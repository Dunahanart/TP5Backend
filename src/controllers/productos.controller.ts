import type { NextFunction, Request, Response } from 'express';
import productoModel from '../models/productos.model.js';
import { leerId, ID_INVALIDO } from '../utils/params.js';

class ProductoController {
    async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Campos obligatorios y precios/stock no negativos: ya los valido la capa de validacion
            const resultado = await productoModel.crear(req.body);
            res.status(201).json({ mensaje: "Producto creado exitosamente", id_producto: resultado.id_producto });
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Los filtros numericos ya los valido la capa de validacion
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
            // Precio y stock no negativos: ya los valido la capa de validacion
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
            // Precio y stock no negativos: ya los valido la capa de validacion
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
