import { Router } from 'express';
// [Migración TS] Antes era detalles_pedido.routes.mjs
import detallePedidoController from '../controllers/detalles_pedido.controller.js';

const router = Router();

router.post('/', detallePedidoController.crear);
// /pedido/:id_pedido y /mas-vendidos van ANTES de cualquier ruta con :id
router.get('/pedido/:id_pedido', detallePedidoController.obtenerPorPedido);
router.get('/mas-vendidos', detallePedidoController.productosMasVendidos);
router.patch('/:id', detallePedidoController.actualizarParcial);

export default router;
