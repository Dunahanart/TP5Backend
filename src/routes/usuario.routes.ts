import { Router } from 'express';
import usuarioController from '../controllers/usuario.controller.js';

const router = Router();

router.post('/', usuarioController.crear);
router.get('/', usuarioController.obtenerTodos);
router.delete('/:id', usuarioController.eliminar);

export default router;
