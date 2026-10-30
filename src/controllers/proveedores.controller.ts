import type { NextFunction, Request, Response } from 'express';
import proveedorModel from '../models/proveedores.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

class ProveedorController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Campos obligatorios y formato del CUIT: ya los validó la capa de validación
            const resultado = await proveedorModel.crear(req.body);
            res.status(201).json({ mensaje: "Proveedor creado exitosamente", id_proveedor: resultado.id_proveedor });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const proveedores = await proveedorModel.obtenerTodos(req.query);
            res.status(200).json(proveedores);
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
            const proveedor = await proveedorModel.obtenerPorId(id);
            if (!proveedor) {
                res.status(404).json({ error: "Proveedor no encontrado." });
                return;
            }
            res.status(200).json(proveedor);
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
            await proveedorModel.actualizar(id, req.body);
            res.status(200).json({ mensaje: "Proveedor actualizado exitosamente" });
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
            await proveedorModel.eliminar(id);
            res.status(200).json({ mensaje: "Proveedor eliminado exitosamente" });
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
            const resultado = await proveedorModel.actualizarParcial(id, req.body);
            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }
            res.status(200).json({ mensaje: "Proveedor actualizado parcialmente" });
        } catch (error) {
            next(error);
        }
    }

    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await proveedorModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            next(error);
        }
    }
}

export default new ProveedorController();
