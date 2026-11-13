import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import * as catalogo from '../controllers/catalogo.controller.js';

const router = Router();
router.use(autenticar);          // cualquier usuario con sesión puede bajar el catálogo
router.get('/', catalogo.listar);

export default router;