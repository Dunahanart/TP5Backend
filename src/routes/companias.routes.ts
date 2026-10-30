import { Router } from 'express';
import companiaController from '../controllers/companias.controller.js';
import { validar } from '../middlewares/validar.middleware.js';
import { actualizarCompania, actualizarCompaniaParcial, crearCompania, filtrosCompania } from '../validators/companias.validators.js';

const router = Router();

// Capa de validación antes del controller (express-validator)
router.post('/', ...validar(crearCompania), companiaController.crear);
router.get('/', ...validar(filtrosCompania, 'query'), companiaController.obtenerTodos);
router.get('/estadisticas', companiaController.estadisticas);
router.get('/:id', companiaController.obtenerPorId);
router.put('/:id', ...validar(actualizarCompania), companiaController.actualizar);
router.patch('/:id', ...validar(actualizarCompaniaParcial), companiaController.actualizarParcial);
router.delete('/:id', companiaController.eliminar);

export default router;
