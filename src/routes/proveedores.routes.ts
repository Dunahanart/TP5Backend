import { Router } from 'express';
import proveedorController from '../controllers/proveedores.controller.js';
import { validar } from '../middlewares/validar.middleware.js';
import { actualizarProveedor, actualizarProveedorParcial, crearProveedor, filtrosProveedor } from '../validators/proveedores.validators.js';

const router = Router();

// Capa de validación antes del controller (express-validator)
router.post('/', ...validar(crearProveedor), proveedorController.crear);
router.get('/', ...validar(filtrosProveedor, 'query'), proveedorController.obtenerTodos);
router.get('/estadisticas', proveedorController.estadisticas);
router.get('/:id', proveedorController.obtenerPorId);
router.put('/:id', ...validar(actualizarProveedor), proveedorController.actualizar);
router.patch('/:id', ...validar(actualizarProveedorParcial), proveedorController.actualizarParcial);
router.delete('/:id', proveedorController.eliminar);

export default router;
