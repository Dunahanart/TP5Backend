import { Router } from 'express';
// [Migración TS] Antes era clientes.routes.mjs (solo cambia la extensión y la extensión del import)
import clienteController from '../controllers/clientes.controller.js';

const router = Router();

router.post('/', clienteController.crear);
router.get('/', clienteController.obtenerTodos);
router.get('/estadisticas', clienteController.estadisticas);
router.get('/:id', clienteController.obtenerPorId);
router.put('/:id', clienteController.actualizar);
router.patch('/:id', clienteController.actualizarParcial);
router.delete('/:id', clienteController.eliminar);

export default router;
