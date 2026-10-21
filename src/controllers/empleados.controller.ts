import type { NextFunction, Request, Response } from 'express';
import empleadoModel from '../models/empleados.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

class EmpleadoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { nombre, apellido } = req.body;
            if (!nombre || !apellido) {
                res.status(400).json({ error: "El nombre y el apellido del empleado son obligatorios." });
                return;
            }
            const resultado = await empleadoModel.crear(req.body);
            res.status(201).json({ mensaje: "Empleado creado exitosamente", id_empleado: resultado.id_empleado });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empleados = await empleadoModel.obtenerTodos(req.query);
            res.status(200).json(empleados);
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
            const empleado = await empleadoModel.obtenerPorId(id);
            if (!empleado) {
                res.status(404).json({ error: "Empleado no encontrado." });
                return;
            }
            res.status(200).json(empleado);
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
            await empleadoModel.actualizar(id, req.body);
            res.status(200).json({ mensaje: "Empleado actualizado exitosamente" });
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
            await empleadoModel.eliminar(id);
            res.status(200).json({ mensaje: "Empleado eliminado exitosamente" });
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
            const resultado = await empleadoModel.actualizarParcial(id, req.body);
            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }
            res.status(200).json({ mensaje: "Empleado actualizado parcialmente" });
        } catch (error) {
            next(error);
        }
    }

    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await empleadoModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            next(error);
        }
    }
}

export default new EmpleadoController();
