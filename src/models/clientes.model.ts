import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

// Model de clientes - acá van todas las operaciones con la base de datos
// Antes lo hacíamos con SQL a mano, ahora Prisma lo hace por nosotros - Juan

class ClienteModel {

    async crear(cliente: Record<string, any>) {
        const { nombre, apellido, dni, direccion, telefono } = cliente;
        return prisma.clientes.create({
            data: { nombre, apellido, dni, direccion: direccion ?? null, telefono: telefono ?? null }
        });
    }

    // Acepta filtros opcionales por query string: ?dni=...&nombre=...&apellido=...
    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.clientesWhereInput = {};
        if (filtros.dni) where.dni = String(filtros.dni);
        if (filtros.nombre) where.nombre = { contains: String(filtros.nombre) };     // busca parcial tipo LIKE
        if (filtros.apellido) where.apellido = { contains: String(filtros.apellido) };

        return prisma.clientes.findMany({ where });
    }

    // Devuelve cuántos clientes hay y cuántos tienen teléfono cargado
    async obtenerEstadisticas() {
        const [cantidad, conTelefono] = await Promise.all([
            prisma.clientes.count(),
            prisma.clientes.count({ where: { telefono: { not: null } } })
        ]);
        return { cantidad, con_telefono: conTelefono };
    }

    async obtenerPorId(id: number) {
        return prisma.clientes.findUnique({ where: { id_cliente: id } });
    }

    async actualizar(id: number, cliente: Record<string, any>) {
        const { nombre, apellido, dni, direccion, telefono } = cliente;
        return prisma.clientes.update({
            where: { id_cliente: id },
            data: { nombre, apellido, dni, direccion: direccion ?? null, telefono: telefono ?? null }
        });
    }

    // PATCH: solo actualiza los campos que llegaron, no todos
    async actualizarParcial(id: number, cliente: Record<string, any>) {
        const permitidas = ['nombre', 'apellido', 'dni', 'direccion', 'telefono'];
        const data = Object.fromEntries(
            Object.entries(cliente).filter(([campo]) => permitidas.includes(campo))
        );

        if (Object.keys(data).length === 0) return null;

        return prisma.clientes.update({ where: { id_cliente: id }, data });
    }

    async eliminar(id: number) {
        return prisma.clientes.delete({ where: { id_cliente: id } });
    }
}

export default new ClienteModel();
