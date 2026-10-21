import { Router } from 'express';
import clienteController from '../controllers/clientes.controller.js';

const router = Router();

router.post('/', clienteController.crear);
router.get('/', clienteController.obtenerTodos);
// /estadisticas tiene que ir antes de /:id o Express lo toma como un ID
router.get('/estadisticas', clienteController.estadisticas);
router.get('/:id', clienteController.obtenerPorId);
router.put('/:id', clienteController.actualizar);
router.patch('/:id', clienteController.actualizarParcial);
router.delete('/:id', clienteController.eliminar);

export default router;
