import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as usuarios from '../controllers/usuarios.controller.js';

const router = Router();
router.use(autenticar, permitir('ADMINISTRADOR'));   // todo lo de usuarios es solo del Administrador
router.get('/', usuarios.listar);
router.post('/', usuarios.crear);
router.put('/:id', usuarios.editar);

export default router;