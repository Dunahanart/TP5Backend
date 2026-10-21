import { Router } from 'express';
import detallePedidoController from '../controllers/detalles_pedido.controller.js';

const router = Router();

router.post('/', detallePedidoController.crear);
// igual que en pedidos, las rutas específicas van antes de /:id
router.get('/pedido/:id_pedido', detallePedidoController.obtenerPorPedido);
router.get('/mas-vendidos', detallePedidoController.productosMasVendidos);
router.patch('/:id', detallePedidoController.actualizarParcial);

export default router;
