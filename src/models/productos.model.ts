import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

class ProductoModel {

    async crear(producto: Record<string, any>) {
        const { nombre, descripcion, precio_unitario, stock, id_proveedor } = producto;
        return prisma.productos.create({
            data: { nombre, descripcion: descripcion ?? null, precio_unitario, stock, id_proveedor: id_proveedor ?? null }
        });
    }

    // Filtros: ?nombre=...&stock_min=10&stock_max=50&precio_min=1000&proveedor=2
    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.productosWhereInput = {};
        if (filtros.nombre) where.nombre = { contains: String(filtros.nombre) };
        if (filtros.proveedor) where.id_proveedor = Number(filtros.proveedor);

        // Filtro de rango de stock
        const stock: Prisma.IntFilter = {};
        if (filtros.stock_min) stock.gte = Number(filtros.stock_min);
        if (filtros.stock_max) stock.lte = Number(filtros.stock_max);
        if (Object.keys(stock).length > 0) where.stock = stock;

        if (filtros.precio_min) where.precio_unitario = { gte: Number(filtros.precio_min) };

        return prisma.productos.findMany({ where });
    }

    // Estadísticas generales de productos - COUNT, SUM, AVG, MAX, MIN en una sola query
    async obtenerEstadisticas() {
        const r = await prisma.productos.aggregate({
            _count: true,
            _sum: { stock: true },
            _avg: { precio_unitario: true },
            _max: { precio_unitario: true },
            _min: { precio_unitario: true }
        });
        return {
            cantidad: r._count,
            stock_total: r._sum.stock,
            precio_promedio: r._avg.precio_unitario,
            precio_maximo: r._max.precio_unitario,
            precio_minimo: r._min.precio_unitario
        };
    }

    async obtenerPorId(id: number) {
        return prisma.productos.findUnique({ where: { id_producto: id } });
    }

    async actualizar(id: number, producto: Record<string, any>) {
        const { nombre, descripcion, precio_unitario, stock, id_proveedor } = producto;
        return prisma.productos.update({
            where: { id_producto: id },
            data: { nombre, descripcion: descripcion ?? null, precio_unitario, stock, id_proveedor: id_proveedor ?? null }
        });
    }

    async actualizarParcial(id: number, producto: Record<string, any>) {
        const permitidas = ['nombre', 'descripcion', 'precio_unitario', 'stock', 'id_proveedor'];
        const data = Object.fromEntries(Object.entries(producto).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;
        return prisma.productos.update({ where: { id_producto: id }, data });
    }

    async eliminar(id: number) {
        return prisma.productos.delete({ where: { id_producto: id } });
    }
}

export default new ProductoModel();
