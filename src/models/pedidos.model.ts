import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

// ============================================================
//  [TP5 - Migración a Prisma] Model de pedidos
//  Mantiene lo del TP4 (corrección 4: campo 'estado'), pero ahora:
//   * los JOINs se hacen con `include` (Prisma arma el JOIN)
//   * los filtros se arman en un objeto `where`
//   * COUNT/SUM/AVG/MAX/MIN con aggregate() y groupBy()
// ============================================================
class PedidoModel {
    // CREATE
    async crear(pedido: Record<string, any>) {
        // Si no mandan total → 0.00; si no mandan estado → 'pendiente' (mismo default que la BD)
        const { total = 0.00, estado = 'pendiente', id_cliente, id_empleado, id_compania } = pedido;
        return prisma.pedidos.create({
            data: { total, estado, id_cliente, id_empleado: id_empleado ?? null, id_compania: id_compania ?? null }
        });
    }

    // READ: LEFT JOIN con clientes, empleados y compañías + filtros opcionales
    //   /api/pedidos?cliente=ana&empleado=carlos&estado=entregado&desde=2026-09-01&hasta=2026-10-01
    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.pedidosWhereInput = {};
        if (filtros.cliente) where.clientes = { nombre: { contains: String(filtros.cliente) } };
        if (filtros.empleado) where.empleados = { nombre: { contains: String(filtros.empleado) } };
        // [CORRECCION 4] Filtro por estado. Si el valor no existe en el ENUM, Prisma lanza
        // un error de validación y el errorHandler responde 400.
        if (filtros.estado) where.estado = String(filtros.estado) as Prisma.pedidosWhereInput['estado'];

        const fecha: Prisma.DateTimeNullableFilter = {};
        if (filtros.desde) fecha.gte = new Date(String(filtros.desde));   // fecha >= desde
        if (filtros.hasta) fecha.lt = new Date(String(filtros.hasta));    // fecha <  hasta
        if (Object.keys(fecha).length > 0) where.fecha = fecha;

        const pedidos = await prisma.pedidos.findMany({
            where,
            include: {
                clientes: { select: { nombre: true, apellido: true } },
                empleados: { select: { nombre: true, apellido: true } },
                companias_envio: { select: { nombre: true } }
            }
        });

        // Se aplana el resultado para que la API responda igual que en el TP4
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

    // AGGREGATION: COUNT, SUM, AVG, MAX y MIN sobre los pedidos
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

    // AGGREGATION: cuánto gastó cada cliente (SUM + COUNT + GROUP BY)
    //   Todos los clientes aparecen, también los que no compraron (total 0).
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

    // READ by ID (con los nombres del cliente, empleado y compañía)
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

    // UPDATE (PUT)
    async actualizar(id: number, pedido: Record<string, any>) {
        // [CORRECCION 4] El PUT también actualiza el estado del pedido
        const { total, estado = 'pendiente', id_cliente, id_empleado, id_compania } = pedido;
        return prisma.pedidos.update({
            where: { id_pedido: id },
            data: { total, estado, id_cliente, id_empleado: id_empleado ?? null, id_compania: id_compania ?? null }
        });
    }

    // UPDATE PARCIAL (PATCH)
    async actualizarParcial(id: number, pedido: Record<string, any>) {
        // [CORRECCION 4] 'estado' entra en la whitelist de campos modificables
        const permitidas = ['total', 'estado', 'id_cliente', 'id_empleado', 'id_compania'];
        const data = Object.fromEntries(Object.entries(pedido).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;
        return prisma.pedidos.update({ where: { id_pedido: id }, data });
    }

    // DELETE
    async eliminar(id: number) {
        return prisma.pedidos.delete({ where: { id_pedido: id } });
    }
}

export default new PedidoModel();
