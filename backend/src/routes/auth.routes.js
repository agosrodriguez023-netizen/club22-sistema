import { Router } from 'express';
import { login, comprobarSalud, yo } from '../controllers/auth.controller.js';

const router = Router();

router.get('/salud', comprobarSalud);
router.post('/auth/login', login);
router.get('/auth/yo', yo);

export default router;