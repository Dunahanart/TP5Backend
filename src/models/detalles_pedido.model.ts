import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

// El precio_unitario lo calcula el controller (no el cliente) para que quede el precio histórico
// o sea, si mañana el producto cambia de precio, el detalle ya guardó el precio de cuando se vendió - Leo
//
// [TP5] La identidad de un detalle es (id_pedido, id_producto): no existe más el
// id_detalle autogenerado. Cada método recibe la clave compuesta desde la URL.

type ClaveDetalle = { id_pedido: number, id_producto: number };

class DetallePedidoModel {

    // [TP5 TOTAL] Recalcula el total del pedido como SUM(subtotal) de sus detalles.
    // Se usa SIEMPRE dentro de una transacción, para que el total nunca quede
    // desfasado respecto de los detalles que lo componen.
    // También lo usa el modelo de pedidos cuando se modifica o borra un pedido.
    async recalcularTotalPedido(tx: Prisma.TransactionClient, id_pedido: number) {
        const suma = await tx.detalles_pedido.aggregate({
            where: { id_pedido },
            _sum: { subtotal: true }
        });
        await tx.pedidos.update({
            where: { id_pedido },
            data: { total: suma._sum.subtotal ?? 0 }
        });
    }

    async crear(detalle: Record<string, any>) {
        const { id_pedido, id_producto, cantidad, precio_unitario, subtotal } = detalle;
        // Se crea el detalle y en la MISMA transacción se refresca el total del pedido
        return prisma.$transaction(async (tx) => {
            const creado = await tx.detalles_pedido.create({
                data: {
                    id_pedido: Number(id_pedido),
                    id_producto: Number(id_producto),
                    cantidad: Number(cantidad),
                    precio_unitario,
                    subtotal
                }
            });
            await this.recalcularTotalPedido(tx, Number(id_pedido));
            return creado;
        });
    }

    // Lista todos los detalles (de todos los pedidos)
    // filtro opcional: ?producto=3
    async obtenerTodos(filtros: Record<string, any> = {}) {
        const detalles = await prisma.detalles_pedido.findMany({
            where: filtros.producto ? { id_producto: Number(filtros.producto) } : {},
            include: { productos: { select: { nombre: true } } }
        });
        return detalles.map(d => ({
            id_pedido: d.id_pedido,
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal,
            producto_nombre: d.productos?.nombre ?? null
        }));
    }

    // Un detalle se identifica por la pareja (pedido, producto)
    async obtenerPorClave(clave: ClaveDetalle) {
        const d = await prisma.detalles_pedido.findUnique({
            where: { id_pedido_id_producto: clave },
            include: { productos: { select: { nombre: true, precio_unitario: true } } }
        });
        if (!d) return null;
        return {
            id_pedido: d.id_pedido,
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,   // precio histórico
            subtotal: d.subtotal,
            producto_nombre: d.productos?.nombre ?? null,
            producto_precio: d.productos?.precio_unitario ?? null  // precio actual
        };
    }

    // Trae los detalles de un pedido con el nombre del producto (include = JOIN)
    // filtro opcional: ?producto=1
    async obtenerPorPedido(id_pedido: number, filtros: Record<string, any> = {}) {
        const detalles = await prisma.detalles_pedido.findMany({
            where: {
                id_pedido,
                ...(filtros.producto ? { id_producto: Number(filtros.producto) } : {})
            },
            include: { productos: { select: { id_producto: true, nombre: true, precio_unitario: true } } }
        });

        return detalles.map(d => ({
            id_pedido: d.id_pedido,
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,   // precio al que se vendió (histórico)
            subtotal: d.subtotal,
            producto_nombre: d.productos?.nombre ?? null,
            producto_precio: d.productos?.precio_unitario ?? null  // precio actual del producto
        }));
    }

    // Qué productos se vendieron más - SUM de cantidad agrupado por producto
    async obtenerProductosMasVendidos() {
        const ventas = await prisma.detalles_pedido.groupBy({
            by: ['id_producto'],
            _sum: { cantidad: true, subtotal: true },
            orderBy: { _sum: { cantidad: 'desc' } }
        });

        // Buscamos los nombres de los productos por separado y los cruzamos
        const ids = ventas.map(v => v.id_producto);
        const productos = await prisma.productos.findMany({
            where: { id_producto: { in: ids } },
            select: { id_producto: true, nombre: true }
        });
        const nombres = new Map(productos.map(p => [p.id_producto, p.nombre]));

        return ventas.map(v => ({
            id_producto: v.id_producto,
            nombre: nombres.get(v.id_producto) ?? null,
            unidades_vendidas: v._sum.cantidad ?? 0,
            facturado: v._sum.subtotal
        }));
    }

    // PUT: reemplaza los campos del detalle (cantidad y precio de la venta).
    // El subtotal NUNCA lo manda el cliente: lo calculamos acá como cantidad x precio
    // y en la misma transacción refrescamos el total del pedido - Juan
    async actualizar(clave: ClaveDetalle, detalle: Record<string, any>) {
        const { cantidad, precio_unitario } = detalle;
        const subtotal = Number(cantidad) * Number(precio_unitario);

        return prisma.$transaction(async (tx) => {
            const actualizado = await tx.detalles_pedido.update({
                where: { id_pedido_id_producto: clave },
                data: { cantidad: Number(cantidad), precio_unitario, subtotal }
            });
            await this.recalcularTotalPedido(tx, clave.id_pedido);
            return actualizado;
        });
    }

    // PATCH: solo actualiza los campos que llegaron.
    // Si cambia la cantidad o el precio, recalculamos el subtotal con los valores combinados
    // y volvemos a refrescar el total del pedido - Juan
    async actualizarParcial(clave: ClaveDetalle, detalle: Record<string, any>) {
        // 'subtotal' no está en la lista: siempre se deriva de cantidad x precio
        const permitidas = ['cantidad', 'precio_unitario'];
        const data = Object.fromEntries(Object.entries(detalle).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;

        return prisma.$transaction(async (tx) => {
            const actual = await tx.detalles_pedido.findUnique({ where: { id_pedido_id_producto: clave } });
            if (actual) {
                const cantidad = Number(data.cantidad ?? actual.cantidad);
                const precio = Number(data.precio_unitario ?? actual.precio_unitario);
                data.subtotal = cantidad * precio;
            }
            // si el detalle no existe, seguimos igual para que update tire P2025 y devuelva 404

            const actualizado = await tx.detalles_pedido.update({ where: { id_pedido_id_producto: clave }, data });
            await this.recalcularTotalPedido(tx, clave.id_pedido);
            return actualizado;
        });
    }

    // Al borrar un detalle el total del pedido baja en la misma transacción
    async eliminar(clave: ClaveDetalle) {
        return prisma.$transaction(async (tx) => {
            const borrado = await tx.detalles_pedido.delete({ where: { id_pedido_id_producto: clave } });
            await this.recalcularTotalPedido(tx, clave.id_pedido);
            return borrado;
        });
    }
}

export default new DetallePedidoModel();
