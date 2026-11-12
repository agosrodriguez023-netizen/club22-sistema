import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as ventas from '../controllers/ventas.controller.js';

const router = Router();
router.use(autenticar);
router.post('/', permitir('CAJERO', 'ADMINISTRADOR'), ventas.crear);
router.get('/:id', permitir('CAJERO', 'ADMINISTRADOR'), ventas.obtener);

export default router;