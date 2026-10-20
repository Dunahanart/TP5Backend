import type { NextFunction, Request, Response } from 'express';
// [CAMBIO TP4] Los catch delegan el error con next(error): así el
// errorHandler global (src/middlewares/errorHandler.middleware.ts)
// responde 409 (proveedor con productos asociados) o 400 en vez de un 500.
// [Migración TS] Antes era proveedores.controller.mjs.
import proveedorModel from '../models/proveedores.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

class ProveedorController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { razon_social, cuit } = req.body;
            if (!razon_social || !cuit) {
                res.status(400).json({ error: "La razón social y el CUIT son obligatorios" });
                return;
            }
            const resultado = await proveedorModel.crear(req.body);
            res.status(201).json({ mensaje: "Proveedor creado exitosamente", id_proveedor: resultado.id_proveedor });
        } catch (error) {
            console.error("Error al crear proveedor:", error);
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const proveedores = await proveedorModel.obtenerTodos(req.query);
            res.status(200).json(proveedores);
        } catch (error) {
            console.error("Error al obtener proveedores:", error);
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
            const proveedor = await proveedorModel.obtenerPorId(id);

            if (!proveedor) {
                res.status(404).json({ error: "Proveedor no encontrado." });
                return;
            }

            res.status(200).json(proveedor);
        } catch (error) {
            console.error("Error al obtener el proveedor:", error);
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
            await proveedorModel.actualizar(id, req.body);

            res.status(200).json({ mensaje: "Proveedor actualizado exitosamente" });
        } catch (error) {
            console.error("Error al actualizar proveedor:", error);
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
            await proveedorModel.eliminar(id);

            res.status(200).json({ mensaje: "Proveedor eliminado exitosamente" });
        } catch (error) {
            console.error("Error al eliminar proveedor:", error);
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
            const resultado = await proveedorModel.actualizarParcial(id, req.body);

            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }


            res.status(200).json({ mensaje: "Proveedor actualizado parcialmente" });
        } catch (error) {
            console.error("Error al actualizar proveedor (parcial):", error);
            next(error);
        }
    }

    // AGGREGATION: /api/proveedores/estadisticas (COUNT + GROUP BY + JOIN)
    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await proveedorModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas de proveedores:", error);
            next(error);
        }
    }
}

export default new ProveedorController();
