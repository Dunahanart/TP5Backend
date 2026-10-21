import type { NextFunction, Request, Response } from 'express';
import usuarioModel from '../models/usuario.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

// Controlador básico de usuarios
// La contraseña se guarda tal cual llega - en producción habría que hashearla con bcrypt
// Lo dejamos así por ahora para no complicar el TP - Leo

class UsuarioController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                res.status(400).json({ error: "El username y la contraseña son obligatorios." });
                return;
            }
            const resultado = await usuarioModel.crear(username, password);
            res.status(201).json({ mensaje: "Usuario creado exitosamente", id_usuario: resultado.id_usuario });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const usuarios = await usuarioModel.obtenerTodos();
            res.status(200).json(usuarios);
        } catch (error) {
            next(error);
        }
    }

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = leerId(req.params.id);
            if (id === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }
            await usuarioModel.eliminar(id);
            res.status(200).json({ mensaje: "Usuario eliminado exitosamente" });
        } catch (error) {
            next(error);
        }
    }
}

export default new UsuarioController();
