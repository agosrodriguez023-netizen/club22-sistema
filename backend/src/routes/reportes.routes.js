import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as reportes from '../controllers/reportes.controller.js';

const router = Router();
router.use(autenticar);
router.use(permitir('ADMINISTRADOR'));

router.get('/ventas', reportes.ventas);
router.get('/ventas.csv', reportes.ventasCsv);
router.get('/mas-vendidos', reportes.masVendidos);
router.get('/cierres', reportes.cierres);

export default router;