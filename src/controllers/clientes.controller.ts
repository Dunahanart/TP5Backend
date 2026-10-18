import type { NextFunction, Request, Response } from 'express';
// [CAMBIO TP4] Los catch delegan el error con next(error): así el
// errorHandler global (src/middlewares/errorHandler.middleware.ts)
// responde 409 (DNI duplicado, FK con datos) o 400 (CHECK violado)
// en vez de un 500 genérico.
// [Migración TS] Antes era clientes.controller.mjs.
import clienteModel from '../models/clientes.model.js';

class ClienteController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { nombre, apellido, dni } = req.body;

            // Validación de negocio alineada a la BD
            if (!nombre || !apellido || !dni) {
                res.status(400).json({ error: "El nombre, apellido y DNI son campos obligatorios." });
                return;
            }

            const resultado = await clienteModel.crear(req.body);
            res.status(201).json({ mensaje: "Cliente creado exitosamente", id_cliente: resultado.insertId });
        } catch (error) {
            console.error("Error al crear cliente:", error);
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const clientes = await clienteModel.obtenerTodos(req.query);
            res.status(200).json(clientes);
        } catch (error) {
            console.error("Error al obtener clientes:", error);
            next(error);
        }
    }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const cliente = await clienteModel.obtenerPorId(id);

            if (!cliente) {
                res.status(404).json({ error: "Cliente no encontrado." });
                return;
            }

            res.status(200).json(cliente);
        } catch (error) {
            console.error("Error al obtener el cliente:", error);
            next(error);
        }
    }

    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const resultado = await clienteModel.actualizar(id, req.body);

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Cliente no encontrado." });
                return;
            }
            res.status(200).json({ mensaje: "Cliente actualizado exitosamente" });
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
            next(error);
        }
    }

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const resultado = await clienteModel.eliminar(id);

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Cliente no encontrado." });
                return;
            }
            res.status(200).json({ mensaje: "Cliente eliminado exitosamente" });
        } catch (error) {
            console.error("Error al eliminar cliente:", error);
            next(error);
        }
    }

    async actualizarParcial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const resultado = await clienteModel.actualizarParcial(id, req.body);

            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Cliente no encontrado." });
                return;
            }

            res.status(200).json({ mensaje: "Cliente actualizado parcialmente" });
        } catch (error) {
            console.error("Error al actualizar cliente (parcial):", error);
            next(error);
        }
    }

    // AGGREGATION: /api/clientes/estadisticas (COUNT)
    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await clienteModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas de clientes:", error);
            next(error);
        }
    }
}

export default new ClienteController();
