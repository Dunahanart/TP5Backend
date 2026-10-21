import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

class EmpleadoModel {

    async crear(empleado: Record<string, any>) {
        const { nombre, apellido, cargo } = empleado;
        return prisma.empleados.create({ data: { nombre, apellido, cargo: cargo ?? null } });
    }

    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.empleadosWhereInput = {};
        if (filtros.nombre) where.nombre = { contains: String(filtros.nombre) };
        if (filtros.apellido) where.apellido = { contains: String(filtros.apellido) };
        if (filtros.cargo) where.cargo = { contains: String(filtros.cargo) };
        return prisma.empleados.findMany({ where });
    }

    // Muestra cuántos pedidos atendió cada empleado y cuánto vendió en total
    async obtenerEstadisticas() {
        const [empleados, totales] = await Promise.all([
            prisma.empleados.findMany({
                select: { id_empleado: true, nombre: true, apellido: true, _count: { select: { pedidos: true } } }
            }),
            prisma.pedidos.groupBy({ by: ['id_empleado'], _sum: { total: true } })
        ]);

        const vendidoPorEmpleado = new Map(totales.map(t => [t.id_empleado, Number(t._sum.total ?? 0)]));
        return empleados
            .map(e => ({
                id_empleado: e.id_empleado,
                nombre: e.nombre,
                apellido: e.apellido,
                pedidos: e._count.pedidos,
                total_vendido: vendidoPorEmpleado.get(e.id_empleado) ?? 0
            }))
            .sort((a, b) => b.total_vendido - a.total_vendido);
    }

    async obtenerPorId(id: number) {
        return prisma.empleados.findUnique({ where: { id_empleado: id } });
    }

    async actualizar(id: number, empleado: Record<string, any>) {
        const { nombre, apellido, cargo } = empleado;
        return prisma.empleados.update({
            where: { id_empleado: id },
            data: { nombre, apellido, cargo: cargo ?? null }
        });
    }

    async actualizarParcial(id: number, empleado: Record<string, any>) {
        const permitidas = ['nombre', 'apellido', 'cargo'];
        const data = Object.fromEntries(Object.entries(empleado).filter(([campo]) => permitidas.includes(campo)));
        if (Object.keys(data).length === 0) return null;
        return prisma.empleados.update({ where: { id_empleado: id }, data });
    }

    async eliminar(id: number) {
        return prisma.empleados.delete({ where: { id_empleado: id } });
    }
}

export default new EmpleadoModel();
