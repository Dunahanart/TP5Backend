import { Router } from 'express';
import informeController from '../controllers/informe.controller.js';

// Ruta del informe - consigna 3.4
const router = Router();

router.get('/', informeController.generarInforme);

export default router;
