import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as pedidos from '../controllers/pedidos.controller.js';

const router = Router();
router.use(autenticar, permitir('ADMINISTRADOR', 'INVENTARIO'));
router.get('/', pedidos.listar);
router.post('/', pedidos.crear);
router.get('/:id', pedidos.obtener);
router.post('/:id/ingreso', pedidos.ingreso);
router.post('/:id/cancelar', pedidos.cancelar);

export default router;