import type { NextFunction, Request, Response } from 'express';
// [CAMBIO TP4] Los catch delegan el error con next(error): así el
// errorHandler global (src/middlewares/errorHandler.middleware.ts)
// responde 409 (FK con datos asociados) o 400 en vez de un 500 genérico.
// [Migración TS] Antes era companias.controller.mjs.
import companiaModel from '../models/companias.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

class CompaniaController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { nombre } = req.body;

            if (!nombre) {
                res.status(400).json({ error: "El nombre de la compañía de envío es obligatorio." });
                return;
            }

            const resultado = await companiaModel.crear(req.body);
            res.status(201).json({ mensaje: "Compañía de envío creada exitosamente", id_compania: resultado.id_compania });
        } catch (error) {
            console.error("Error al crear compañía de envío:", error);
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const companias = await companiaModel.obtenerTodos(req.query);
            res.status(200).json(companias);
        } catch (error) {
            console.error("Error al obtener compañías de envío:", error);
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
            const compania = await companiaModel.obtenerPorId(id);

            if (!compania) {
                res.status(404).json({ error: "Compañía de envío no encontrada." });
                return;
            }

            res.status(200).json(compania);
        } catch (error) {
            console.error("Error al obtener la compañía de envío:", error);
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
            await companiaModel.actualizar(id, req.body);

            res.status(200).json({ mensaje: "Compañía de envío actualizada exitosamente" });
        } catch (error) {
            console.error("Error al actualizar compañía de envío:", error);
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
            await companiaModel.eliminar(id);

            res.status(200).json({ mensaje: "Compañía de envío eliminada exitosamente" });
        } catch (error) {
            console.error("Error al eliminar compañía de envío:", error);
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
            const resultado = await companiaModel.actualizarParcial(id, req.body);

            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }


            res.status(200).json({ mensaje: "Compañía de envío actualizada parcialmente" });
        } catch (error) {
            console.error("Error al actualizar compañía de envío (parcial):", error);
            next(error);
        }
    }

    // AGGREGATION: /api/companias/estadisticas (COUNT + GROUP BY + JOIN)
    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await companiaModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas de compañías:", error);
            next(error);
        }
    }
}

export default new CompaniaController();
