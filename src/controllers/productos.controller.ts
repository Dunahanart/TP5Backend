import type { NextFunction, Request, Response } from 'express';
// ============================================================
//  [CAMBIO TP4] Controller de productos - Corrección 5 del profesor:
//   * Validaciones numéricas: precio_unitario y stock no pueden ser
//     negativos (lo mismo que exigen los CHECK de la base de datos,
//     para responder 400 con mensaje claro antes de llegar al motor)
//   * Los catch delegan con next(error) al errorHandler global
//     (así eliminar un producto con detalles asociados responde 409)
//  [Migración TS] Antes era productos.controller.mjs.
// ============================================================
import productoModel from '../models/productos.model.js';

class ProductoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { nombre, precio_unitario, stock } = req.body;
            if (!nombre || !precio_unitario) {
                res.status(400).json({ error: "El nombre y el precio unitario son obligatorios." });
                return;
            }

            // [CORRECCION 5] Restricciones numéricas de negocio (respaldadas por los CHECK de la BD)
            if (Number(precio_unitario) < 0) {
                res.status(400).json({ error: "El precio unitario no puede ser negativo." });
                return;
            }
            if (stock !== undefined && Number(stock) < 0) {
                res.status(400).json({ error: "El stock no puede ser negativo." });
                return;
            }

            const resultado = await productoModel.crear(req.body);
            res.status(201).json({ mensaje: "Producto creado exitosamente", id_producto: resultado.insertId });
        } catch (error) {
            console.error("Error al crear producto:", error);
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validamos que los filtros numéricos sean realmente números
            for (const parametro of ['stock_min', 'stock_max', 'precio_min', 'proveedor']) {
                const valor = req.query[parametro];
                if (valor !== undefined && valor !== '' && isNaN(Number(valor))) {
                    res.status(400).json({ error: `El parámetro '${parametro}' debe ser numérico.` });
                    return;
                }
            }

            const productos = await productoModel.obtenerTodos(req.query);
            res.status(200).json(productos);
        } catch (error) {
            console.error("Error al obtener productos:", error);
            next(error);
        }
    }

    async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const producto = await productoModel.obtenerPorId(id);

            if (!producto) {
                res.status(404).json({ error: "Producto no encontrado." });
                return;
            }

            res.status(200).json(producto);
        } catch (error) {
            console.error("Error al obtener el producto:", error);
            next(error);
        }
    }

    async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const { precio_unitario, stock } = req.body;

            if ((precio_unitario !== undefined && Number(precio_unitario) < 0) ||
                (stock !== undefined && Number(stock) < 0)) {
                res.status(400).json({ error: "El precio unitario y el stock no pueden ser negativos." });
                return;
            }

            const resultado = await productoModel.actualizar(id, req.body);
            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Producto no encontrado." });
                return;
            }
            res.status(200).json({ mensaje: "Producto actualizado exitosamente" });
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            next(error);
        }
    }

    async actualizarParcial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const { precio_unitario, stock } = req.body;

            if ((precio_unitario !== undefined && Number(precio_unitario) < 0) ||
                (stock !== undefined && Number(stock) < 0)) {
                res.status(400).json({ error: "El precio unitario y el stock no pueden ser negativos." });
                return;
            }

            const resultado = await productoModel.actualizarParcial(id, req.body);

            if (!resultado) {
                res.status(400).json({ error: "Debe enviar al menos un campo válido a modificar." });
                return;
            }

            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Producto no encontrado." });
                return;
            }

            res.status(200).json({ mensaje: "Producto actualizado parcialmente" });
        } catch (error) {
            console.error("Error al actualizar producto (parcial):", error);
            next(error);
        }
    }

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = String(req.params.id);   // Express 5 tipa params como string | string[]
            const resultado = await productoModel.eliminar(id);
            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: "Producto no encontrado." });
                return;
            }
            res.status(200).json({ mensaje: "Producto eliminado exitosamente" });
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            next(error);
        }
    }

    // AGGREGATION: /api/productos/estadisticas (COUNT, SUM, AVG, MAX, MIN)
    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await productoModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas de productos:", error);
            next(error);
        }
    }
}

export default new ProductoController();
