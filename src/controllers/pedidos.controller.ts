import type { NextFunction, Request, Response } from 'express';
import pedidoModel from '../models/pedidos.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

// Los estados posibles del pedido y la validación del total están en
// src/validators/pedidos.validators.ts (la capa de validación) - Juan

class PedidoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // id_cliente obligatorio, estado del ENUM y total no negativo:
            // ya los validó la capa de validación antes de llegar acá
            const resultado = await pedidoModel.crear(req.body);
            res.status(201).json({ mensaje: "Pedido creado exitosamente", id_pedido: resultado.id_pedido });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // El formato de los filtros desde/hasta ya lo validó la capa de validación
            const pedidos = await pedidoModel.obtenerTodos(req.query);
            res.status(200).json(pedidos);
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
            const pedido = await pedidoModel.obtenerPorId(id);
            if (!pedido) {
                res.status(404).json({ error: "Pedido no encontrado." });
                return;
            }
            res.status(200).json(pedido);
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
            // Mismas reglas que el POST (cliente obligatorio, estado y total):
            // ya las aplicó la capa de validación
            await pedidoModel.actualizar(id, req.body);
            res.status(200).json({ mensaje: "Pedido actualizado exitosamente" });
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
            // Todo es opcional, pero lo que llegue ya vino validado por la capa
            const resultado = await pedidoModel.actualizarParcial(id, req.body);
            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }
            res.status(200).json({ mensaje: "Pedido actualizado parcialmente" });
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
            await pedidoModel.eliminar(id);
            res.status(200).json({ mensaje: "Pedido eliminado exitosamente" });
        } catch (error) {
            next(error);
        }
    }

    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await pedidoModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            next(error);
        }
    }

    async totalesPorCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const totales = await pedidoModel.obtenerTotalesPorCliente();
            res.status(200).json(totales);
        } catch (error) {
            next(error);
        }
    }
}

export default new PedidoController();
