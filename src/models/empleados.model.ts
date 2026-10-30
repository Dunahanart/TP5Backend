import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

class EmpleadoModel {

    async crear(empleado: Record<string, any>) {
        const { nombre, apellido, cargo } = empleado;
        return prisma.empleados.create({ data: { nombre, apellido, cargo: cargo ?? null } });
    }

    async obtenerTodos(filtros: Record<string, any> = {}) {
        // [TP5 SOFT DELETE] Solo se listan los empleados activos.
        // Un empleado desactivado no aparece en los GET, pero sus pedidos viejos
        // siguen mostrando quién los atendió (la fila no se borra de la BD).
        const where: Prisma.empleadosWhereInput = { activo: true };
        if (filtros.nombre) where.nombre = { contains: String(filtros.nombre) };
        if (filtros.apellido) where.apellido = { contains: String(filtros.apellido) };
        if (filtros.cargo) where.cargo = { contains: String(filtros.cargo) };
        return prisma.empleados.findMany({ where });
    }

    // Muestra cuántos pedidos atendió cada empleado y cuánto vendió en total.
    // Incluye los desactivados a propósito: sus ventas históricas siguen contando.
    async obtenerEstadisticas() {
        const [empleados, totales] = await Promise.all([
            prisma.empleados.findMany({
                select: { id_empleado: true, nombre: true, apellido: true, activo: true, _count: { select: { pedidos: true } } }
            }),
            prisma.pedidos.groupBy({ by: ['id_empleado'], _sum: { total: true } })
        ]);

        const vendidoPorEmpleado = new Map(totales.map(t => [t.id_empleado, Number(t._sum.total ?? 0)]));
        return empleados
            .map(e => ({
                id_empleado: e.id_empleado,
                nombre: e.nombre,
                apellido: e.apellido,
                activo: e.activo,
                pedidos: e._count.pedidos,
                total_vendido: vendidoPorEmpleado.get(e.id_empleado) ?? 0
            }))
            .sort((a, b) => b.total_vendido - a.total_vendido);
    }

    async obtenerPorId(id: number) {
        // Solo se puede consultar un empleado activo
        return prisma.empleados.findFirst({ where: { id_empleado: id, activo: true } });
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

    // [TP5 SOFT DELETE] El DELETE no borra la fila: la desactiva.
    // Así no se rompen los pedidos que ya atendió ese empleado.
    // Si el id no existe, Prisma tira P2025 y el errorHandler contesta 404.
    async eliminar(id: number) {
        return prisma.empleados.update({
            where: { id_empleado: id },
            data: { activo: false }
        });
    }

    // [TP5] Reponer un empleado dado de baja (útil para corrección de errores)
    async reactivar(id: number) {
        return prisma.empleados.update({
            where: { id_empleado: id },
            data: { activo: true }
        });
    }
}

export default new EmpleadoModel();
