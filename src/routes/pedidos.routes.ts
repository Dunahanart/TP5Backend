import { Router } from 'express';
import pedidoController from '../controllers/pedidos.controller.js';
import { validar } from '../middlewares/validar.middleware.js';
import { actualizarPedido, actualizarPedidoParcial, crearPedido, filtrosPedido } from '../validators/pedidos.validators.js';

const router = Router();

// Capa de validación antes del controller (express-validator)
router.post('/', ...validar(crearPedido), pedidoController.crear);
router.get('/', ...validar(filtrosPedido, 'query'), pedidoController.obtenerTodos);
// estas dos rutas van ANTES de /:id, si no Express las confunde con un id - Leo
router.get('/estadisticas', pedidoController.estadisticas);
router.get('/totales-por-cliente', pedidoController.totalesPorCliente);
router.get('/:id', pedidoController.obtenerPorId);
router.put('/:id', ...validar(actualizarPedido), pedidoController.actualizar);
router.patch('/:id', ...validar(actualizarPedidoParcial), pedidoController.actualizarParcial);
router.delete('/:id', pedidoController.eliminar);

export default router;
