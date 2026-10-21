import type { NextFunction, Request, Response } from 'express';
import productoModel from '../models/productos.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

class ProductoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { nombre, precio_unitario, stock } = req.body;
            if (!nombre || !precio_unitario) {
                res.status(400).json({ error: "El nombre y el precio unitario son obligatorios." });
                return;
            }

            // Validamos acá también aunque la BD tiene CHECK, para dar un mensaje más claro
            if (Number(precio_unitario) < 0) {
                res.status(400).json({ error: "El precio unitario no puede ser negativo." });
                return;
            }
            if (stock !== undefined && Number(stock) < 0) {
                res.status(400).json({ error: "El stock no puede ser negativo." });
                return;
            }

            const resultado = await productoModel.crear(req.body);
            res.status(201).json({ mensaje: "Producto creado exitosamente", id_producto: resultado.id_producto });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Verificamos que los filtros numéricos sean realmente números
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
            const producto = await productoModel.obtenerPorId(id);
            if (!producto) {
                res.status(404).json({ error: "Producto no encontrado." });
                return;
            }
            res.status(200).json(producto);
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
            const { precio_unitario, stock } = req.body;

            if ((precio_unitario !== undefined && Number(precio_unitario) < 0) ||
                (stock !== undefined && Number(stock) < 0)) {
                res.status(400).json({ error: "El precio unitario y el stock no pueden ser negativos." });
                return;
            }

            await productoModel.actualizar(id, req.body);
            res.status(200).json({ mensaje: "Producto actualizado exitosamente" });
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
            res.status(200).json({ mensaje: "Producto actualizado parcialmente" });
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
            await productoModel.eliminar(id);
            res.status(200).json({ mensaje: "Producto eliminado exitosamente" });
        } catch (error) {
            next(error);
        }
    }

    async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const estadisticas = await productoModel.obtenerEstadisticas();
            res.status(200).json(estadisticas);
        } catch (error) {
            next(error);
        }
    }
}

export default new ProductoController();
