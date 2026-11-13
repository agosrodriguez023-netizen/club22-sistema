import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as stock from '../controllers/stock.controller.js';

const router = Router();
router.use(autenticar, permitir('ADMINISTRADOR', 'INVENTARIO'));
router.get('/', stock.listar);
router.post('/conteo', stock.conteo);               // antes de /:codigo...
router.get('/:codigo/movimientos', stock.movimientos);
router.put('/:codigo/minimo', stock.cambiarMinimo);
router.post('/:codigo/ajuste', stock.ajustar);

export default router;