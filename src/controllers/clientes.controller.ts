import type { NextFunction, Request, Response } from 'express';
import clienteModel from '../models/clientes.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

// El controller valida los datos que llegan y llama al model
// Si algo falla, llama a next(error) y lo agarra el errorHandler global

class ClienteController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { nombre, apellido, dni } = req.body;

            if (!nombre || !apellido || !dni) {
                res.status(400).json({ error: "El nombre, apellido y DNI son campos obligatorios." });
                return;
            }

            const cliente = await clienteModel.crear(req.body);
            res.status(201).json({ mensaje: "Cliente creado exitosamente", id_cliente: cliente.id_cliente });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const clientes = await clienteModel.obtenerTodos(req.query);
            res.status(200).json(clientes);
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = leerId(req.params.id);
            if (id === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }

            const cliente = await clienteModel.obtenerPorId(id);
            if (!cliente) {
                res.status(404).json({ error: "Cliente no encontrado." });
                return;
            }
            res.status(200).json(cliente);
        } catch (error) {
            next(error);
        }
    }

    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = leerId(req.params.id);
            if (id === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }

            await clienteModel.actualizar(id, req.body);
            res.status(200).json({ mensaje: "Cliente actualizado exitosamente" });
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

            await clienteModel.eliminar(id);
            res.status(200).json({ mensaje: "Cliente eliminado exitosamente" });
        } catch (error) {
            next(error);
        }
    }

    async actualizarParcial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = leerId(req.params.id);
            if (id === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }

            const resultado = await clienteModel.actualizarParcial(id, req.body);
            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }
            res.status(200).json({ mensaje: "Cliente actualizado parcialmente" });
        } catch (error) {
            next(error);
        }
    }

    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.status(200).json(await clienteModel.obtenerEstadisticas());
        } catch (error) {
            next(error);
        }
    }
}

export default new ClienteController();
