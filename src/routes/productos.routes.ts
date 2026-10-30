import { Router } from 'express';
import productoController from '../controllers/productos.controller.js';
import { validar } from '../middlewares/validar.middleware.js';
import { actualizarProducto, actualizarProductoParcial, crearProducto, filtrosProducto } from '../validators/productos.validators.js';

const router = Router();

// Capa de validación antes del controller (express-validator)
router.post('/', ...validar(crearProducto), productoController.crear);
router.get('/', ...validar(filtrosProducto, 'query'), productoController.obtenerTodos);
router.get('/estadisticas', productoController.estadisticas);
router.get('/:id', productoController.obtenerPorId);
router.put('/:id', ...validar(actualizarProducto), productoController.actualizar);
router.patch('/:id', ...validar(actualizarProductoParcial), productoController.actualizarParcial);
router.delete('/:id', productoController.eliminar);

export default router;
