import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as proveedores from '../controllers/proveedores.controller.js';

const router = Router();
router.use(autenticar, permitir('ADMINISTRADOR', 'INVENTARIO'));
router.get('/', proveedores.listar);
router.post('/', proveedores.crear);
router.put('/:id', proveedores.editar);

export default router;