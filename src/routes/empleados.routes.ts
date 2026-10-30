import { Router } from 'express';
import empleadoController from '../controllers/empleados.controller.js';
import { validar } from '../middlewares/validar.middleware.js';
import { actualizarEmpleado, actualizarEmpleadoParcial, crearEmpleado, filtrosEmpleado } from '../validators/empleados.validators.js';

const router = Router();

// Capa de validación antes del controller (express-validator)
router.post('/', ...validar(crearEmpleado), empleadoController.crear);
router.get('/', ...validar(filtrosEmpleado, 'query'), empleadoController.obtenerTodos);
router.get('/estadisticas', empleadoController.estadisticas);
router.get('/:id', empleadoController.obtenerPorId);
router.put('/:id', ...validar(actualizarEmpleado), empleadoController.actualizar);
router.patch('/:id', ...validar(actualizarEmpleadoParcial), empleadoController.actualizarParcial);
// [TP5 SOFT DELETE] El DELETE desactiva (no borra) y este lo vuelve a poner activo.
// Van después de los GET para que /estadisticas no se lo coma.
router.put('/:id/reactivar', empleadoController.reactivar);
router.delete('/:id', empleadoController.eliminar);

export default router;
