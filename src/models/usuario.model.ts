import prisma from '../config/prisma.js';

// Modelo básico para la tabla usuario
// Por ahora solo tiene crear y listar - en un proyecto real habría login con hash de contraseña
// TODO: agregar bcrypt para hashear la contraseña antes de guardar - Juan

class UsuarioModel {

    async crear(username: string, password: string) {
        return prisma.usuario.create({
            data: { username, password }
        });
    }

    async obtenerTodos() {
        // No devolvemos el password en el listado
        return prisma.usuario.findMany({
            select: { id_usuario: true, username: true }
        });
    }

    async obtenerPorUsername(username: string) {
        return prisma.usuario.findUnique({ where: { username } });
    }

    async eliminar(id: number) {
        return prisma.usuario.delete({ where: { id_usuario: id } });
    }
}

export default new UsuarioModel();
