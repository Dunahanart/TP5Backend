import { Router } from 'express';
import informeController from '../controllers/informe.controller.js';

// [TP5 - Consigna 3.4] Ruta del informe generado con SQL puro ($queryRaw)
const router = Router();

router.get('/', informeController.generarInforme);

export default router;
