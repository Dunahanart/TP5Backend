import { Router } from 'express';
import detallePedidoController from '../controllers/detalles_pedido.controller.js';

const router = Router();

router.post('/', detallePedidoController.crear);
router.get('/', detallePedidoController.obtenerTodos);
// estas rutas van antes de /:id o Express las confunde con un ID
router.get('/pedido/:id_pedido', detallePedidoController.obtenerPorPedido);
router.get('/mas-vendidos', detallePedidoController.productosMasVendidos);
router.get('/:id', detallePedidoController.obtenerPorId);
router.put('/:id', detallePedidoController.actualizar);
router.patch('/:id', detallePedidoController.actualizarParcial);
router.delete('/:id', detallePedidoController.eliminar);

export default router;
