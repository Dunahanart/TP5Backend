import { Router } from 'express';
import productoController from '../controllers/productos.controller.js';

const router = Router();

router.post('/', productoController.crear);
router.get('/', productoController.obtenerTodos);
router.get('/estadisticas', productoController.estadisticas);
router.get('/:id', productoController.obtenerPorId);
router.put('/:id', productoController.actualizar);
router.patch('/:id', productoController.actualizarParcial);
router.delete('/:id', productoController.eliminar);

export default router;
