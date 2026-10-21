import { Router } from 'express';
import pedidoController from '../controllers/pedidos.controller.js';

const router = Router();

router.post('/', pedidoController.crear);
router.get('/', pedidoController.obtenerTodos);
// estas dos rutas van ANTES de /:id, si no Express las confunde con un id - Leo
router.get('/estadisticas', pedidoController.estadisticas);
router.get('/totales-por-cliente', pedidoController.totalesPorCliente);
router.get('/:id', pedidoController.obtenerPorId);
router.put('/:id', pedidoController.actualizar);
router.patch('/:id', pedidoController.actualizarParcial);
router.delete('/:id', pedidoController.eliminar);

export default router;
