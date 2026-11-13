import { Router } from 'express';
import { login, comprobarSalud, yo } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';

const router = Router();

router.get('/salud', comprobarSalud);
router.post('/auth/login', login);

// Ruta protegida de prueba (solo pasa si tiene un token válido de cualquier rol)
router.get('/auth/yo', autenticar, yo);

export default router;