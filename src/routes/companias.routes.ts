import { Router } from 'express';
import companiaController from '../controllers/companias.controller.js';

const router = Router();

router.post('/', companiaController.crear);
router.get('/', companiaController.obtenerTodos);
router.get('/estadisticas', companiaController.estadisticas);
router.get('/:id', companiaController.obtenerPorId);
router.put('/:id', companiaController.actualizar);
router.patch('/:id', companiaController.actualizarParcial);
router.delete('/:id', companiaController.eliminar);

export default router;
