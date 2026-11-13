import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import * as medios from '../controllers/mediosPago.controller.js';

const router = Router();
router.use(autenticar);        // cualquier usuario con sesión necesita ver los medios para cobrar
router.get('/', medios.listar);

export default router;