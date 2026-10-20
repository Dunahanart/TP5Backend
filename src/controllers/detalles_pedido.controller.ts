import type { NextFunction, Request, Response } from 'express';
// ============================================================
//  [CAMBIO TP4] Controller de detalles - Correcciones 2 y 3 del profesor:
//   * CORRECCION 2: el precio_unitario (histórico) lo define el SERVIDOR.
//     Al crear un detalle busca el precio vigente del producto y calcula
//     el subtotal. El cliente ya NO manda precio ni subtotal en el body.
//     Si el producto no existe → 404.
//   * CORRECCION 3: repetir un producto en el mismo pedido → 409
//     (lo resuelven el UNIQUE de la BD + el errorHandler global)
//   * Los catch delegan con next(error) al errorHandler global
//  [Migración TS] Antes era detalles_pedido.controller.mjs.
// ============================================================
import detallePedidoModel from '../models/detalles_pedido.model.js';
import productoModel from '../models/productos.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

class DetallePedidoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id_pedido, id_producto, cantidad } = req.body;

            if (!id_pedido || !id_producto || !cantidad) {
                res.status(400).json({ error: "Faltan datos obligatorios (id_pedido, id_producto, cantidad)." });
                return;
            }

            if (Number(cantidad) <= 0) {
                res.status(400).json({ error: "La cantidad debe ser un número mayor a cero." });
                return;
            }

            // [CORRECCION 2] Precio histórico: lo define el SERVIDOR al momento de la venta,
            // tomando el precio vigente del producto. Así nadie puede alterarlo
            // desde el cliente y el subtotal queda consistente.
            const producto = await productoModel.obtenerPorId(Number(id_producto));
            if (!producto) {
                res.status(404).json({ error: "Producto no encontrado." });
                return;
            }

            const precio_unitario = producto.precio_unitario;
            const subtotal = Number(cantidad) * Number(precio_unitario);

            const resultado = await detallePedidoModel.crear({
                id_pedido,
                id_producto,
                cantidad,
                precio_unitario,
                subtotal
            });

            res.status(201).json({
                mensaje: "Detalle agregado al pedido exitosamente",
                id_detalle: resultado.id_detalle,
                precio_unitario,
                subtotal
            });
        } catch (error) {
            console.error("Error al crear detalle:", error);
            next(error);
        }
    }

    async obtenerPorPedido(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // En este caso, el ID del pedido viene por la URL (ej: /api/detalles/pedido/1)
            const id_pedido = leerId(req.params.id_pedido);
            if (id_pedido === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }
            const detalles = await detallePedidoModel.obtenerPorPedido(id_pedido, req.query);

            res.status(200).json(detalles);
        } catch (error) {
            console.error("Error al obtener detalles:", error);
            next(error);
        }
    }

    // AGGREGATION: /api/detalles/mas-vendidos (SUM + JOIN + GROUP BY)
    async productosMasVendidos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const productos = await detallePedidoModel.obtenerProductosMasVendidos();
            res.status(200).json(productos);
        } catch (error) {
            console.error("Error al obtener productos más vendidos:", error);
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
            const resultado = await detallePedidoModel.actualizarParcial(id, req.body);

            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }


            res.status(200).json({ mensaje: "Detalle actualizado parcialmente" });
        } catch (error) {
            console.error("Error al actualizar detalle (parcial):", error);
            next(error);
        }
    }
}

export default new DetallePedidoController();
