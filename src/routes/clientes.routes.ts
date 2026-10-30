import { Router } from 'express';
import clienteController from '../controllers/clientes.controller.js';
import { validar } from '../middlewares/validar.middleware.js';
import { actualizarCliente, actualizarClienteParcial, crearCliente, filtrosCliente } from '../validators/clientes.validators.js';

const router = Router();

// La capa de validación va ANTES del controller: si el body o la query no cumplen
// el esquema, responde 400 con el detalle y el controller nunca se entera
router.post('/', ...validar(crearCliente), clienteController.crear);
router.get('/', ...validar(filtrosCliente, 'query'), clienteController.obtenerTodos);
// /estadisticas tiene que ir antes de /:id o Express lo toma como un ID
router.get('/estadisticas', clienteController.estadisticas);
router.get('/:id', clienteController.obtenerPorId);
router.put('/:id', ...validar(actualizarCliente), clienteController.actualizar);
router.patch('/:id', ...validar(actualizarClienteParcial), clienteController.actualizarParcial);
router.delete('/:id', clienteController.eliminar);

export default router;
