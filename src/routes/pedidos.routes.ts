import { Router } from 'express';
// [Migración TS] Antes era pedidos.routes.mjs
import pedidoController from '../controllers/pedidos.controller.js';

const router = Router();

router.post('/', pedidoController.crear);
router.get('/', pedidoController.obtenerTodos);
router.get('/estadisticas', pedidoController.estadisticas);
router.get('/totales-por-cliente', pedidoController.totalesPorCliente);
// IMPORTANTE: /estadisticas y /totales-por-cliente van ANTES de /:id,
// si no Express los tomaría como un ID y no encontraría la ruta
router.get('/:id', pedidoController.obtenerPorId);
router.put('/:id', pedidoController.actualizar);
router.patch('/:id', pedidoController.actualizarParcial);
router.delete('/:id', pedidoController.eliminar);

export default router;
