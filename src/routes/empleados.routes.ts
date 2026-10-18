import { Router } from 'express';
// [Migración TS] Antes era empleados.routes.mjs
import empleadoController from '../controllers/empleados.controller.js';

const router = Router();

router.post('/', empleadoController.crear);
router.get('/', empleadoController.obtenerTodos);
router.get('/estadisticas', empleadoController.estadisticas);
router.get('/:id', empleadoController.obtenerPorId);
router.put('/:id', empleadoController.actualizar);
router.patch('/:id', empleadoController.actualizarParcial);
router.delete('/:id', empleadoController.eliminar);

export default router;
