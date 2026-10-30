import { Router } from 'express';
import detallePedidoController from '../controllers/detalles_pedido.controller.js';
import { validar } from '../middlewares/validar.middleware.js';
import { actualizarDetalle, actualizarDetalleParcial, claveDetalleParams, crearDetalle, filtrosDetalle } from '../validators/detalles_pedido.validators.js';

const router = Router();

// Capa de validación antes del controller (express-validator).
// Ningún esquema incluye 'subtotal': ese importe lo calcula siempre el servidor.
//
// [TP5] Un detalle se identifica por la pareja (id_pedido, id_producto), porque
// ahora es la clave primaria de la tabla. No existe el id_detalle suelto:
//     /api/detalles/1/3   ->  pedido 1, producto 3
router.post('/', ...validar(crearDetalle), detallePedidoController.crear);
router.get('/', ...validar(filtrosDetalle, 'query'), detallePedidoController.obtenerTodos);
// estas rutas van antes de /:id_pedido/:id_producto o Express las confunde con ids
router.get('/pedido/:id_pedido', ...validar(filtrosDetalle, 'query'), detallePedidoController.obtenerPorPedido);
router.get('/mas-vendidos', detallePedidoController.productosMasVendidos);

// Acá se valida también la URL: los dos ids tienen que ser números
router.route('/:id_pedido/:id_producto')
    .get(...validar(claveDetalleParams, 'params'), detallePedidoController.obtenerPorClave)
    .put(...validar(claveDetalleParams, 'params'), ...validar(actualizarDetalle), detallePedidoController.actualizar)
    .patch(...validar(claveDetalleParams, 'params'), ...validar(actualizarDetalleParcial), detallePedidoController.actualizarParcial)
    .delete(...validar(claveDetalleParams, 'params'), detallePedidoController.eliminar);

export default router;
