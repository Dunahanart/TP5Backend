import type { NextFunction, Request, Response } from 'express';
import detallePedidoModel from '../models/detalles_pedido.model.js';
import productoModel from '../models/productos.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

// El precio y el subtotal los calcula el servidor, no el cliente
// Así guardamos el precio que tenía el producto en el momento de la venta (precio histórico)
// Si el producto cambia de precio después, el detalle ya tiene el precio viejo guardado - Leo y Juan
//
// [TP5] Un detalle se identifica por la pareja (id_pedido, id_producto), que viene
// en la URL: /api/detalles/1/3  ->  pedido 1, producto 3

// Lee los dos ids de la URL. Devuelve null si alguno no es un número válido.
function leerClave(req: Request): { id_pedido: number, id_producto: number } | null {
    const id_pedido = leerId(req.params.id_pedido);
    const id_producto = leerId(req.params.id_producto);
    if (id_pedido === null || id_producto === null) return null;
    return { id_pedido, id_producto };
}

class DetallePedidoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id_pedido, id_producto, cantidad } = req.body;

            // id_pedido, id_producto y cantidad (> 0) ya los validó la capa de validación
            // Buscamos el producto para obtener el precio actual
            const producto = await productoModel.obtenerPorId(Number(id_producto));
            if (!producto) {
                res.status(404).json({ error: "Producto no encontrado." });
                return;
            }

            const precio_unitario = producto.precio_unitario;
            const subtotal = Number(cantidad) * Number(precio_unitario);

            // El modelo crea el detalle y en la misma transacción recalcula
            // el total del pedido como SUM(subtotal) - Juan
            await detallePedidoModel.crear({
                id_pedido,
                id_producto,
                cantidad,
                precio_unitario,
                subtotal
            });

            res.status(201).json({
                mensaje: "Detalle agregado al pedido exitosamente",
                // [TP5] Ya no existe id_detalle: la identidad del detalle es la pareja
                id_pedido: Number(id_pedido),
                id_producto: Number(id_producto),
                precio_unitario,
                subtotal
            });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const detalles = await detallePedidoModel.obtenerTodos(req.query);
            res.status(200).json(detalles);
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorClave(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const clave = leerClave(req);
            if (clave === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }
            const detalle = await detallePedidoModel.obtenerPorClave(clave);
            if (!detalle) {
                res.status(404).json({ error: "Detalle no encontrado." });
                return;
            }
            res.status(200).json(detalle);
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

    // PUT: reemplaza la cantidad y el precio de la venta.
    // El SUBTOTAL lo calcula SIEMPRE el servidor, y el total del pedido se
    // refresca en la misma transacción - Juan
    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const clave = leerClave(req);
            if (clave === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }
            // Los campos obligatorios, la cantidad > 0 y el precio >= 0
            // ya los validó la capa de validación (el subtotal lo calcula el modelo)
            await detallePedidoModel.actualizar(clave, req.body);
            res.status(200).json({ mensaje: "Detalle actualizado exitosamente" });
        } catch (error) {
            next(error);
        }
    }

    async actualizarParcial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const clave = leerClave(req);
            if (clave === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }
            const resultado = await detallePedidoModel.actualizarParcial(clave, req.body);
            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }
            res.status(200).json({ mensaje: "Detalle actualizado parcialmente" });
        } catch (error) {
            next(error);
        }
    }

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const clave = leerClave(req);
            if (clave === null) {
                res.status(400).json(ID_INVALIDO);
                return;
            }
            // El modelo borra el detalle y baja el total del pedido en la misma transacción
            await detallePedidoModel.eliminar(clave);
            res.status(200).json({ mensaje: "Detalle eliminado exitosamente" });
        } catch (error) {
            next(error);
        }
    }
}

export default new DetallePedidoController();
