import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

class CompaniaModel {

    async crear(compania: Record<string, any>) {
        const { nombre, telefono } = compania;
        return prisma.companias_envio.create({ data: { nombre, telefono: telefono ?? null } });
    }

    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.companias_envioWhereInput = {};
        if (filtros.nombre) where.nombre = { contains: String(filtros.nombre) };
        if (filtros.telefono) where.telefono = String(filtros.telefono);
        return prisma.companias_envio.findMany({ where });
    }

    // Cuántos pedidos envió cada compañía, ordenado de mayor a menor
    async obtenerEstadisticas() {
        const companias = await prisma.companias_envio.findMany({
            select: { id_compania: true, nombre: true, _count: { select: { pedidos: true } } },
            orderBy: { pedidos: { _count: 'desc' } }
        });
        return companias.map(c => ({ id_compania: c.id_compania, nombre: c.nombre, pedidos: c._count.pedidos }));
    }

    async obtenerPorId(id: number) {
        return prisma.companias_envio.findUnique({ where: { id_compania: id } });
    }

    async actualizar(id: number, compania: Record<string, any>) {
        const { nombre, telefono } = compania;
        return prisma.companias_envio.update({
            where: { id_compania: id },
            data: { nombre, telefono: telefono ?? null }
        });
    }

    async actualizarParcial(id: number, compania: Record<string, any>) {
        const permitidas = ['nombre', 'telefono'];
        const data = Object.fromEntries(Object.entries(compania).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;
        return prisma.companias_envio.update({ where: { id_compania: id }, data });
    }

    async eliminar(id: number) {
        return prisma.companias_envio.delete({ where: { id_compania: id } });
    }
}

export default new CompaniaModel();
