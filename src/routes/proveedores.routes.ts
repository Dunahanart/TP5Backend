import { Router } from 'express';
import proveedorController from '../controllers/proveedores.controller.js';

const router = Router();

router.post('/', proveedorController.crear);
router.get('/', proveedorController.obtenerTodos);
router.get('/estadisticas', proveedorController.estadisticas);
router.get('/:id', proveedorController.obtenerPorId);
router.put('/:id', proveedorController.actualizar);
router.patch('/:id', proveedorController.actualizarParcial);
router.delete('/:id', proveedorController.eliminar);

export default router;
