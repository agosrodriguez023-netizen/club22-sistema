import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as caja from '../controllers/caja.controller.js';

const router = Router();
router.use(autenticar);
router.get('/resumen', permitir('CAJERO', 'ADMINISTRADOR'), caja.resumen);
router.post('/cierres', permitir('CAJERO', 'ADMINISTRADOR'), caja.cerrar);

export default router;