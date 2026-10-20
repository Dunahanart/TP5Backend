import prisma from '../config/prisma.js';

// ============================================================
//  [TP5 - Migración a Prisma] Model de detalles_pedido
//
//  CORRECCION 2 (precio histórico): la tabla guarda precio_unitario.
//    El controller busca el precio vigente del producto, calcula el
//    subtotal y recién ahí llama a crear().
//
//  CORRECCION 3 (producto repetido): la tabla tiene UNIQUE (id_pedido, id_producto).
//    Repetir un producto en el mismo pedido hace que Prisma lance el error
//    P2002 y el errorHandler global lo traduzca en 409.
// ============================================================
class DetallePedidoModel {
    // CREATE: inserta una línea de producto en el pedido
    async crear(detalle: Record<string, any>) {
        const { id_pedido, id_producto, cantidad, precio_unitario, subtotal } = detalle;
        // [CORRECCION 2] Se persiste el precio histórico junto a la cantidad
        return prisma.detalles_pedido.create({
            data: { id_pedido: Number(id_pedido), id_producto: Number(id_producto), cantidad: Number(cantidad), precio_unitario, subtotal }
        });
    }

    // READ: detalles de un pedido (filtro opcional: /api/detalles/pedido/1?producto=1)
    async obtenerPorPedido(id_pedido: number, filtros: Record<string, any> = {}) {
        const detalles = await prisma.detalles_pedido.findMany({
            where: {
                id_pedido,
                ...(filtros.producto ? { id_producto: Number(filtros.producto) } : {})
            },
            // include = LEFT JOIN con productos
            include: { productos: { select: { id_producto: true, nombre: true, precio_unitario: true } } }
        });

        return detalles.map(d => ({
            id_detalle: d.id_detalle,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,                    // [CORRECCION 2] a cuánto se vendió
            subtotal: d.subtotal,
            id_producto: d.productos?.id_producto ?? null,
            producto_nombre: d.productos?.nombre ?? null,
            producto_precio: d.productos?.precio_unitario ?? null  // precio VIGENTE, para comparar
        }));
    }

    // AGGREGATION: productos más vendidos (SUM + GROUP BY)
    async obtenerProductosMasVendidos() {
        const ventas = await prisma.detalles_pedido.groupBy({
            by: ['id_producto'],
            where: { id_producto: { not: null } },
            _sum: { cantidad: true, subtotal: true },
            orderBy: { _sum: { cantidad: 'desc' } }
        });

        const ids = ventas.map(v => v.id_producto).filter((id): id is number => id !== null);
        const productos = await prisma.productos.findMany({
            where: { id_producto: { in: ids } },
            select: { id_producto: true, nombre: true }
        });
        const nombres = new Map(productos.map(p => [p.id_producto, p.nombre]));

        return ventas.map(v => ({
            id_producto: v.id_producto,
            nombre: nombres.get(v.id_producto as number) ?? null,
            unidades_vendidas: v._sum.cantidad ?? 0,
            facturado: v._sum.subtotal
        }));
    }

    // UPDATE PARCIAL (PATCH): solo los campos enviados de una línea de detalle
    async actualizarParcial(id: number, detalle: Record<string, any>) {
        // [CORRECCION 2] 'precio_unitario' entra en la whitelist de campos modificables
        const permitidas = ['id_pedido', 'id_producto', 'cantidad', 'precio_unitario', 'subtotal'];
        const data = Object.fromEntries(Object.entries(detalle).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;
        return prisma.detalles_pedido.update({ where: { id_detalle: id }, data });
    }
}

export default new DetallePedidoModel();
