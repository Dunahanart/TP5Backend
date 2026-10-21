import type { NextFunction, Request, Response } from 'express';
import pedidoModel from '../models/pedidos.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

// Los estados posibles del pedido, tienen que coincidir con el ENUM de la BD
const ESTADOS_PERMITIDOS = ['pendiente', 'enviado', 'entregado', 'cancelado'];

// La BD tiene un CHECK que impide totales negativos, pero si lo dejamos pasar
// el error llega crudo como 500. Acá lo frenamos antes para devolver un 400 claro - Juan
function totalInvalido(total: unknown): boolean {
    return total !== undefined && (Number.isNaN(Number(total)) || Number(total) < 0);
}

class PedidoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id_cliente, estado } = req.body;

            if (!id_cliente) {
                res.status(400).json({ error: "El id_cliente es obligatorio para generar un pedido." });
                return;
            }

            if (totalInvalido(req.body.total)) {
                res.status(400).json({ error: "El total no puede ser negativo." });
                return;
            }

            if (estado && !ESTADOS_PERMITIDOS.includes(estado)) {
                res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.` });
                return;
            }

            const resultado = await pedidoModel.crear(req.body);
            res.status(201).json({ mensaje: "Pedido creado exitosamente", id_pedido: resultado.id_pedido });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Las fechas tienen que venir en formato YYYY-MM-DD
            const fechaValida = /^\d{4}-\d{2}-\d{2}$/;
            for (const parametro of ['desde', 'hasta']) {
                const valor = req.query[parametro];
                if (typeof valor === 'string' && valor !== '' && !fechaValida.test(valor)) {
                    res.status(400).json({ error: `El parámetro '${parametro}' debe tener formato YYYY-MM-DD.` });
                    return;
                }
            }

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
            const { id_cliente, estado } = req.body;

            if (!id_cliente) {
                res.status(400).json({ error: "El id_cliente es obligatorio para actualizar el pedido." });
                return;
            }

            if (totalInvalido(req.body.total)) {
                res.status(400).json({ error: "El total no puede ser negativo." });
                return;
            }

            if (estado && !ESTADOS_PERMITIDOS.includes(estado)) {
                res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.` });
                return;
            }

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
            const { estado } = req.body;

            if (totalInvalido(req.body.total)) {
                res.status(400).json({ error: "El total no puede ser negativo." });
                return;
            }

            if (estado && !ESTADOS_PERMITIDOS.includes(estado)) {
                res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.` });
                return;
            }

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
