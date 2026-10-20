import type { NextFunction, Request, Response } from 'express';
import clienteModel from '../models/clientes.model.js';

// [TP5 - Migración a Prisma] Controller de clientes.
// Cambios respecto al TP4:
//  * El id de la URL llega como texto: se convierte a número (Prisma lo exige).
//  * Ya no existe resultado.insertId / affectedRows (eso era de mysql2):
//    create() devuelve el cliente creado y update()/delete() lanzan
//    el error P2025 si el id no existe (el errorHandler lo convierte en 404).

// Convierte req.params.id a número entero; si no es válido devuelve null.
// (Función suelta y no método: las rutas pasan los métodos sin `this`.)
function leerId(req: Request): number | null {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

const ID_INVALIDO = { error: "El ID debe ser un número entero positivo." };

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
            const id = leerId(req);
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
            const id = leerId(req);
            if (id === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }

            await clienteModel.actualizar(id, req.body);
            res.status(200).json({ mensaje: "Cliente actualizado exitosamente" });
        } catch (error) {
            next(error);   // P2025 → 404, P2002 → 409
        }
    }

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = leerId(req);
            if (id === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }

            await clienteModel.eliminar(id);
            res.status(200).json({ mensaje: "Cliente eliminado exitosamente" });
        } catch (error) {
            next(error);   // P2025 → 404, P2003 → 409
        }
    }

    async actualizarParcial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = leerId(req);
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

    // AGGREGATION: /api/clientes/estadisticas
    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.status(200).json(await clienteModel.obtenerEstadisticas());
        } catch (error) {
            next(error);
        }
    }
}

export default new ClienteController();
