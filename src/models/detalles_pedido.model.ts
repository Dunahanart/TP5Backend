import prisma from '../config/prisma.js';

// El precio_unitario lo calcula el controller (no el cliente) para que quede el precio histórico
// o sea, si mañana el producto cambia de precio, el detalle ya guardó el precio de cuando se vendió - Leo

class DetallePedidoModel {

    async crear(detalle: Record<string, any>) {
        const { id_pedido, id_producto, cantidad, precio_unitario, subtotal } = detalle;
        return prisma.detalles_pedido.create({
            data: { id_pedido: Number(id_pedido), id_producto: Number(id_producto), cantidad: Number(cantidad), precio_unitario, subtotal }
        });
    }

    // Lista todos los detalles (de todos los pedidos)
    async obtenerTodos() {
        const detalles = await prisma.detalles_pedido.findMany({
            include: { productos: { select: { nombre: true } } }
        });
        return detalles.map(d => ({
            id_detalle: d.id_detalle,
            id_pedido: d.id_pedido,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal,
            id_producto: d.id_producto,
            producto_nombre: d.productos?.nombre ?? null
        }));
    }

    async obtenerPorId(id: number) {
        const d = await prisma.detalles_pedido.findUnique({
            where: { id_detalle: id },
            include: { productos: { select: { nombre: true, precio_unitario: true } } }
        });
        if (!d) return null;
        return {
            id_detalle: d.id_detalle,
            id_pedido: d.id_pedido,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,   // precio histórico
            subtotal: d.subtotal,
            id_producto: d.id_producto,
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
            id_detalle: d.id_detalle,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,   // precio al que se vendió (histórico)
            subtotal: d.subtotal,
            id_producto: d.productos?.id_producto ?? null,
            producto_nombre: d.productos?.nombre ?? null,
            producto_precio: d.productos?.precio_unitario ?? null  // precio actual del producto
        }));
    }

    // Qué productos se vendieron más - SUM de cantidad agrupado por producto
    async obtenerProductosMasVendidos() {
        const ventas = await prisma.detalles_pedido.groupBy({
            by: ['id_producto'],
            where: { id_producto: { not: null } },
            _sum: { cantidad: true, subtotal: true },
            orderBy: { _sum: { cantidad: 'desc' } }
        });

        // Buscamos los nombres de los productos por separado y los cruzamos
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

    // PUT: reemplaza todos los campos del detalle.
    // El subtotal NUNCA lo manda el cliente: lo calculamos acá como cantidad x precio - Juan
    async actualizar(id: number, detalle: Record<string, any>) {
        const { id_pedido, id_producto, cantidad, precio_unitario } = detalle;
        const subtotal = Number(cantidad) * Number(precio_unitario);
        return prisma.detalles_pedido.update({
            where: { id_detalle: id },
            data: { id_pedido: Number(id_pedido), id_producto: Number(id_producto), cantidad: Number(cantidad), precio_unitario, subtotal }
        });
    }

    // PATCH: solo actualiza los campos que llegaron.
    // Si cambia la cantidad o el precio, recalculamos el subtotal con los valores combinados - Juan
    async actualizarParcial(id: number, detalle: Record<string, any>) {
        // 'subtotal' no está en la lista: siempre se deriva de cantidad x precio
        const permitidas = ['id_pedido', 'id_producto', 'cantidad', 'precio_unitario'];
        const data = Object.fromEntries(Object.entries(detalle).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;

        if (data.cantidad !== undefined || data.precio_unitario !== undefined) {
            const actual = await prisma.detalles_pedido.findUnique({ where: { id_detalle: id } });
            if (actual) {
                const cantidad = Number(data.cantidad ?? actual.cantidad);
                const precio = Number(data.precio_unitario ?? actual.precio_unitario);
                data.subtotal = cantidad * precio;
            }
            // si el detalle no existe, seguimos igual para que update tire P2025 y devuelva 404
        }

        return prisma.detalles_pedido.update({ where: { id_detalle: id }, data });
    }

    async eliminar(id: number) {
        return prisma.detalles_pedido.delete({ where: { id_detalle: id } });
    }
}

export default new DetallePedidoModel();
