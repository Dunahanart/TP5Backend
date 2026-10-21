import type { NextFunction, Request, Response } from 'express';
import detallePedidoModel from '../models/detalles_pedido.model.js';
import productoModel from '../models/productos.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

// El precio y el subtotal los calcula el servidor, no el cliente
// Así guardamos el precio que tenía el producto en el momento de la venta (precio histórico)
// Si el producto cambia de precio después, el detalle ya tiene el precio viejo guardado - Leo y Juan

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

            // Buscamos el producto para obtener el precio actual
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
            next(error);
        }
    }

    async obtenerPorPedido(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id_pedido = leerId(req.params.id_pedido);
            if (id_pedido === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }
            const detalles = await detallePedidoModel.obtenerPorPedido(id_pedido, req.query);
            res.status(200).json(detalles);
        } catch (error) {
            next(error);
        }
    }

    async productosMasVendidos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const productos = await detallePedidoModel.obtenerProductosMasVendidos();
            res.status(200).json(productos);
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
            const resultado = await detallePedidoModel.actualizarParcial(id, req.body);
            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }
            res.status(200).json({ mensaje: "Detalle actualizado parcialmente" });
        } catch (error) {
            next(error);
        }
    }
}

export default new DetallePedidoController();
