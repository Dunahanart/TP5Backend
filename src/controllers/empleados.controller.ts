import type { NextFunction, Request, Response } from 'express';
// [CAMBIO TP4] Los catch delegan el error con next(error): así el
// errorHandler global (src/middlewares/errorHandler.middleware.ts)
// responde 409 (FK con datos asociados) o 400 en vez de un 500 genérico.
// [Migración TS] Antes era empleados.controller.mjs.
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
            console.error("Error al crear empleado:", error);
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empleados = await empleadoModel.obtenerTodos(req.query);
            res.status(200).json(empleados);
        } catch (error) {
            console.error("Error al obtener empleados:", error);
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
            console.error("Error al obtener el empleado:", error);
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
            console.error("Error al actualizar empleado:", error);
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
            console.error("Error al eliminar empleado:", error);
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
            console.error("Error al actualizar empleado (parcial):", error);
            next(error);
        }
    }

    // AGGREGATION: /api/empleados/estadisticas (SUM + COUNT + GROUP BY + JOIN)
    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await empleadoModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas de empleados:", error);
            next(error);
        }
    }
}

export default new EmpleadoController();
