import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as usuarios from '../controllers/usuarios.controller.js';

const router = Router();
router.use(autenticar, permitir('ADMINISTRADOR'));
router.get('/', usuarios.auditoria);

export default router;