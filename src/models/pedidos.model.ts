import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';
import detallePedidoModel from './detalles_pedido.model.js';

// [TP5 TOTAL] El total del pedido NO lo manda nunca el cliente: el servidor lo
// calcula como SUM(subtotal) de los detalles del pedido. Un pedido recién creado
// nace en 0.00 (sin detalles todavía) y va creciendo a medida que se agregan.

class PedidoModel {

    async crear(pedido: Record<string, any>) {
        const { estado = 'pendiente', id_cliente, id_empleado, id_compania } = pedido;
        // Ojo: no mandamos 'total' a propósito. La BD le pone el DEFAULT 0.00
        // y el total recién se llena cuando se agregan detalles.
        return prisma.pedidos.create({
            data: { estado, id_cliente, id_empleado: id_empleado ?? null, id_compania: id_compania ?? null }
        });
    }

    // GET con filtros: ?cliente=ana&empleado=carlos&estado=entregado&desde=2026-09-01&hasta=2026-10-01
    // el include es como hacer un LEFT JOIN en SQL - trae los datos relacionados - Leo
    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.pedidosWhereInput = {};
        if (filtros.cliente) where.clientes = { nombre: { contains: String(filtros.cliente) } };
        if (filtros.empleado) where.empleados = { nombre: { contains: String(filtros.empleado) } };
        if (filtros.estado) where.estado = String(filtros.estado) as Prisma.pedidosWhereInput['estado'];

        const fecha: Prisma.DateTimeNullableFilter = {};
        if (filtros.desde) fecha.gte = new Date(String(filtros.desde));
        if (filtros.hasta) fecha.lt = new Date(String(filtros.hasta));
        if (Object.keys(fecha).length > 0) where.fecha = fecha;

        const pedidos = await prisma.pedidos.findMany({
            where,
            include: {
                clientes: { select: { nombre: true, apellido: true } },
                empleados: { select: { nombre: true, apellido: true } },
                companias_envio: { select: { nombre: true } }
            }
        });

        // Aplanamos el resultado para que la respuesta sea más limpia
        return pedidos.map(p => ({
            id_pedido: p.id_pedido,
            fecha: p.fecha,
            total: p.total,
            estado: p.estado,
            cliente_nombre: p.clientes?.nombre ?? null,
            cliente_apellido: p.clientes?.apellido ?? null,
            empleado_nombre: p.empleados?.nombre ?? null,
            empleado_apellido: p.empleados?.apellido ?? null,
            compania_nombre: p.companias_envio?.nombre ?? null
        }));
    }

    // Estadísticas globales de pedidos
    async obtenerEstadisticas() {
        const r = await prisma.pedidos.aggregate({
            _count: true,
            _sum: { total: true },
            _avg: { total: true },
            _max: { total: true },
            _min: { total: true }
        });
        return {
            cantidad: r._count,
            total: r._sum.total,
            promedio: r._avg.total,
            maximo: r._max.total,
            minimo: r._min.total
        };
    }

    // Cuánto gastó cada cliente en total - incluye los que no tienen pedidos con 0
    // TODO: ver si conviene filtrar los cancelados acá también - Juan
    async obtenerTotalesPorCliente() {
        const [clientes, totales] = await Promise.all([
            prisma.clientes.findMany({
                select: { id_cliente: true, nombre: true, apellido: true, _count: { select: { pedidos: true } } }
            }),
            prisma.pedidos.groupBy({ by: ['id_cliente'], _sum: { total: true } })
        ]);

        const gastadoPorCliente = new Map(totales.map(t => [t.id_cliente, Number(t._sum.total ?? 0)]));
        return clientes
            .map(c => ({
                id_cliente: c.id_cliente,
                nombre: c.nombre,
                apellido: c.apellido,
                pedidos: c._count.pedidos,
                total_gastado: gastadoPorCliente.get(c.id_cliente) ?? 0
            }))
            .sort((a, b) => b.total_gastado - a.total_gastado);
    }

    async obtenerPorId(id: number) {
        const p = await prisma.pedidos.findUnique({
            where: { id_pedido: id },
            include: {
                clientes: { select: { nombre: true } },
                empleados: { select: { nombre: true } },
                companias_envio: { select: { nombre: true } }
            }
        });
        if (!p) return null;

        const { clientes, empleados, companias_envio, ...pedido } = p;
        return {
            ...pedido,
            cliente: clientes?.nombre ?? null,
            empleado: empleados?.nombre ?? null,
            compania: companias_envio?.nombre ?? null
        };
    }

    // PUT: reemplaza el pedido (sin tocar el total, que sale de los detalles).
    // Después de guardar, refrescamos el total por si cambió el conjunto de detalles.
    async actualizar(id: number, pedido: Record<string, any>) {
        const { estado = 'pendiente', id_cliente, id_empleado, id_compania } = pedido;
        return prisma.$transaction(async (tx) => {
            const actualizado = await tx.pedidos.update({
                where: { id_pedido: id },
                data: { estado, id_cliente, id_empleado: id_empleado ?? null, id_compania: id_compania ?? null }
            });
            await detallePedidoModel.recalcularTotalPedido(tx, id);
            return actualizado;
        });
    }

    // PATCH: solo modifica lo que llegó. 'total' no está en la lista de campos
    // permitidos: es un campo calculado, el cliente no lo puede tocar.
    async actualizarParcial(id: number, pedido: Record<string, any>) {
        const permitidas = ['estado', 'id_cliente', 'id_empleado', 'id_compania'];
        const data = Object.fromEntries(Object.entries(pedido).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;
        return prisma.$transaction(async (tx) => {
            const actualizado = await tx.pedidos.update({ where: { id_pedido: id }, data });
            await detallePedidoModel.recalcularTotalPedido(tx, id);
            return actualizado;
        });
    }

    // Borrar el pedido arrastra sus detalles (FK ON DELETE CASCADE), así que no
    // hace falta recalcular nada: si no existe el pedido, tampoco existen sus detalles.
    async eliminar(id: number) {
        return prisma.pedidos.delete({ where: { id_pedido: id } });
    }
}

export default new PedidoModel();
