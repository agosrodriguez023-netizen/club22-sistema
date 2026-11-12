// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { login, comprobarSalud, yo } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';

const router = Router();

router.get('/salud', comprobarSalud);
router.post('/auth/login', login);

// Ruta protegida de prueba (solo pasa si tiene un token válido de cualquier rol)
router.get('/auth/yo', autenticar, yo);

// Ruta simulada para probar el permiso: solo pasa si es ADMINISTRADOR
router.get('/usuarios', autenticar, permitir('ADMINISTRADOR'), (req, res) => {
    res.json({ mensaje: 'Lista de usuarios confidencial (Solo para admins)' });
});

export default router;