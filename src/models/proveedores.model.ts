import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

// [TP5 - Migración a Prisma] Model de proveedores (antes SQL a mano con mysql2)
class ProveedorModel {
    // POST: INSERT INTO proveedores ...
    async crear(proveedor: Record<string, any>) {
        const { razon_social, cuit, telefono, email } = proveedor;
        return prisma.proveedores.create({
            data: { razon_social, cuit, telefono: telefono ?? null, email: email ?? null }
        });
    }

    // GET con filtros: /api/proveedores?razon_social=...&cuit=...&email=...
    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.proveedoresWhereInput = {};
        if (filtros.razon_social) where.razon_social = { contains: String(filtros.razon_social) };
        if (filtros.cuit) where.cuit = String(filtros.cuit);
        if (filtros.email) where.email = { contains: String(filtros.email) };
        return prisma.proveedores.findMany({ where });
    }

    // AGGREGATION: cuántos productos y cuánto stock tiene cada proveedor
    //   _count  → COUNT(...) con la relación (el JOIN lo resuelve Prisma)
    //   groupBy + _sum → SUM(stock) ... GROUP BY id_proveedor
    async obtenerEstadisticas() {
        const [proveedores, stocks] = await Promise.all([
            prisma.proveedores.findMany({
                select: { id_proveedor: true, razon_social: true, _count: { select: { productos: true } } },
                orderBy: { productos: { _count: 'desc' } }
            }),
            prisma.productos.groupBy({ by: ['id_proveedor'], _sum: { stock: true } })
        ]);

        const stockPorProveedor = new Map(stocks.map(s => [s.id_proveedor, s._sum.stock ?? 0]));
        return proveedores.map(p => ({
            id_proveedor: p.id_proveedor,
            razon_social: p.razon_social,
            productos: p._count.productos,
            stock_total: stockPorProveedor.get(p.id_proveedor) ?? 0
        }));
    }

    // GET por id (null si no existe)
    async obtenerPorId(id: number) {
        return prisma.proveedores.findUnique({ where: { id_proveedor: id } });
    }

    // PUT (P2025 si no existe → 404)
    async actualizar(id: number, proveedor: Record<string, any>) {
        const { razon_social, cuit, telefono, email } = proveedor;
        return prisma.proveedores.update({
            where: { id_proveedor: id },
            data: { razon_social, cuit, telefono: telefono ?? null, email: email ?? null }
        });
    }

    // PATCH: solo los campos permitidos que llegaron
    async actualizarParcial(id: number, proveedor: Record<string, any>) {
        const permitidas = ['razon_social', 'cuit', 'telefono', 'email'];
        const data = Object.fromEntries(Object.entries(proveedor).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;
        return prisma.proveedores.update({ where: { id_proveedor: id }, data });
    }

    // DELETE
    async eliminar(id: number) {
        return prisma.proveedores.delete({ where: { id_proveedor: id } });
    }
}

export default new ProveedorModel();
