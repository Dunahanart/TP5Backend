import type { NextFunction, Request, Response } from 'express';
// ============================================================
//  [CAMBIO TP4] Controller de pedidos - Corrección 4 del profesor:
//   * Nuevo campo 'estado': pendiente / enviado / entregado / cancelado
//   * Se valida en crear(), actualizar() y actualizarParcial() → 400 si no es válido
//   * Filtro nuevo: GET /api/pedidos?estado=entregado
//   * Los catch delegan con next(error) al errorHandler global,
//     así los errores de BD responden 409/400 en vez de un 500 genérico
//  [Migración TS] Antes era pedidos.controller.mjs.
// ============================================================
import pedidoModel from '../models/pedidos.model.js';

// [CORRECCION 4] Estados posibles del pedido (mismo ENUM que define la base
// de datos). Si el cliente manda uno distinto → respondemos 400.
const ESTADOS_PERMITIDOS = ['pendiente', 'enviado', 'entregado', 'cancelado'];

class PedidoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id_cliente, estado } = req.body;

            // Regla de negocio: No hay pedido fantasma, necesitamos un cliente
            if (!id_cliente) {
                res.status(400).json({ error: "El id_cliente es obligatorio para generar un pedido." });
                return;
            }

            if (estado && !ESTADOS_PERMITIDOS.includes(estado)) {
                res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.` });
                return;
            }

            const resultado = await pedidoModel.crear(req.body);
            res.status(201).json({ mensaje: "Pedido creado exitosamente", id_pedido: resultado.insertId });
        } catch (error) {
            console.error("Error al crear pedido:", error);
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Los filtros de fecha deben venir en formato YYYY-MM-DD
            const fechaValida = /^\d{4}-\d{2}-\d{2}$/;
            for (const parametro of ['desde', 'hasta']) {
                const valor = req.query[parametro];
                // typeof 'string' descarta undefined, arrays y objetos anidados del query
                if (typeof valor === 'string' && valor !== '' && !fechaValida.test(valor)) {
                    res.status(400).json({ error: `El parámetro '${parametro}' debe tener formato YYYY-MM-DD.` });
                    return;
                }
            }

            const pedidos = await pedidoModel.obtenerTodos(req.query);
            res.status(200).json(pedidos);
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            next(error);
        }
    }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const pedido = await pedidoModel.obtenerPorId(id);

            if (!pedido) {
                res.status(404).json({ error: "Pedido no encontrado." });
                return;
            }

            res.status(200).json(pedido);
        } catch (error) {
            console.error("Error al obtener el pedido:", error);
            next(error);
        }
    }

    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const { id_cliente, estado } = req.body;

            // Mantenemos la regla de negocio: un pedido no puede quedar huérfano de cliente
            if (!id_cliente) {
                res.status(400).json({ error: "El id_cliente es obligatorio para actualizar el pedido." });
                return;
            }

            if (estado && !ESTADOS_PERMITIDOS.includes(estado)) {
                res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.` });
                return;
            }

            const resultado = await pedidoModel.actualizar(id, req.body);

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Pedido no encontrado para actualizar." });
                return;
            }

            res.status(200).json({ mensaje: "Pedido actualizado exitosamente" });
        } catch (error) {
            console.error("Error al actualizar pedido:", error);
            next(error);
        }
    }

    async actualizarParcial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const { estado } = req.body;

            if (estado && !ESTADOS_PERMITIDOS.includes(estado)) {
                res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}.` });
                return;
            }

            const resultado = await pedidoModel.actualizarParcial(id, req.body);

            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Pedido no encontrado." });
                return;
            }

            res.status(200).json({ mensaje: "Pedido actualizado parcialmente" });
        } catch (error) {
            console.error("Error al actualizar pedido (parcial):", error);
            next(error);
        }
    }

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const resultado = await pedidoModel.eliminar(id);

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Pedido no encontrado para eliminar." });
                return;
            }

            res.status(200).json({ mensaje: "Pedido eliminado exitosamente" });
        } catch (error) {
            console.error("Error al eliminar pedido:", error);

            // Lógica de negocio (manejo de clave foránea)
            // Si el error es ER_ROW_IS_REFERENCED_2, significa que el pedido ya tiene detalles asociados
            if (error instanceof Error && 'code' in error && error.code === 'ER_ROW_IS_REFERENCED_2') {
                res.status(409).json({ error: "No se puede eliminar el pedido porque tiene productos asociados en sus detalles." });
                return;
            }

            next(error);
        }
    }

    // AGGREGATION: /api/pedidos/estadisticas (COUNT, SUM, AVG, MAX, MIN)
    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await pedidoModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas de pedidos:", error);
            next(error);
        }
    }

    // AGGREGATION: /api/pedidos/totales-por-cliente (SUM + COUNT + JOIN + GROUP BY)
    async totalesPorCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const totales = await pedidoModel.obtenerTotalesPorCliente();
            res.status(200).json(totales);
        } catch (error) {
            console.error("Error al obtener totales por cliente:", error);
            next(error);
        }
    }
}

export default new PedidoController();
