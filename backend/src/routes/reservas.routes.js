import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as reservas from '../controllers/reservas.controller.js';

const router = Router();
router.use(autenticar);
router.use(permitir('ADMINISTRADOR', 'SALA'));

router.get('/disponibilidad', reservas.disponibilidad);
router.get('/', reservas.listar);
router.post('/', reservas.crear);
router.patch('/:id/cancelar', reservas.cancelar);

export default router;