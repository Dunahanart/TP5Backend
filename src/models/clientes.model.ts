import type { Prisma } from '../generated/prisma/client.js';
import prisma from '../config/prisma.js';

// ============================================================
//  [TP5 - Migración a Prisma] Model de clientes
//  Antes: SQL escrito a mano con mysql2 (pool.execute / pool.query).
//  Ahora: Prisma Client. Prisma arma el SQL parametrizado por nosotros.
//  Los errores (dni duplicado, id inexistente) los lanza Prisma y los
//  traduce el errorHandler global a 409 / 404.
// ============================================================
class ClienteModel {
    // CREATE  →  INSERT INTO clientes ...
    async crear(cliente: Record<string, any>) {
        const { nombre, apellido, dni, direccion, telefono } = cliente;
        return prisma.clientes.create({
            data: { nombre, apellido, dni, direccion: direccion ?? null, telefono: telefono ?? null }
        });
    }

    // READ con filtros opcionales: /api/clientes?dni=...&nombre=...
    // Antes: armábamos el WHERE concatenando condiciones a mano.
    // Ahora: objeto `where`; solo se agregan los filtros que llegaron.
    async obtenerTodos(filtros: Record<string, any> = {}) {
        const where: Prisma.clientesWhereInput = {};
        if (filtros.dni) where.dni = String(filtros.dni);                           // exacto
        if (filtros.nombre) where.nombre = { contains: String(filtros.nombre) };    // LIKE %x%
        if (filtros.apellido) where.apellido = { contains: String(filtros.apellido) };

        return prisma.clientes.findMany({ where });
    }

    // AGGREGATION: COUNT(*) y COUNT(telefono)
    async obtenerEstadisticas() {
        const [cantidad, conTelefono] = await Promise.all([
            prisma.clientes.count(),
            prisma.clientes.count({ where: { telefono: { not: null } } })
        ]);
        return { cantidad, con_telefono: conTelefono };
    }

    // READ by ID  →  devuelve null si no existe
    async obtenerPorId(id: number) {
        return prisma.clientes.findUnique({ where: { id_cliente: id } });
    }

    // UPDATE (PUT): reemplaza todos los campos.
    // Si el id no existe, Prisma lanza el error P2025 (→ 404 en el errorHandler).
    async actualizar(id: number, cliente: Record<string, any>) {
        const { nombre, apellido, dni, direccion, telefono } = cliente;
        return prisma.clientes.update({
            where: { id_cliente: id },
            data: { nombre, apellido, dni, direccion: direccion ?? null, telefono: telefono ?? null }
        });
    }

    // UPDATE PARCIAL (PATCH): solo los campos permitidos que llegaron
    async actualizarParcial(id: number, cliente: Record<string, any>) {
        const permitidas = ['nombre', 'apellido', 'dni', 'direccion', 'telefono'];
        const data = Object.fromEntries(
            Object.entries(cliente).filter(([campo]) => permitidas.includes(campo))
        );

        // Si no llega ningún campo válido, no hay nada que modificar
        if (Object.keys(data).length === 0) return null;

        return prisma.clientes.update({ where: { id_cliente: id }, data });
    }

    // DELETE (P2025 si no existe, P2003 si tiene pedidos asociados)
    async eliminar(id: number) {
        return prisma.clientes.delete({ where: { id_cliente: id } });
    }
}

export default new ClienteModel();
