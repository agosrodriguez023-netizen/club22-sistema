import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as mesas from '../controllers/mesas.controller.js';

const router = Router();
router.use(autenticar);

// Ver y ocupar/liberar: Administrador, Cajero y Sala
router.get('/', permitir('ADMINISTRADOR', 'CAJERO', 'SALA'), mesas.listar);
router.get('/:id', permitir('ADMINISTRADOR', 'CAJERO', 'SALA'), mesas.obtener);
router.patch('/:id/ocupar', permitir('ADMINISTRADOR', 'CAJERO', 'SALA'), mesas.ocupar);
router.patch('/:id/liberar', permitir('ADMINISTRADOR', 'CAJERO', 'SALA'), mesas.liberar);

// Alta, edición y baja: solo el Administrador
router.post('/', permitir('ADMINISTRADOR'), mesas.crear);
router.put('/:id', permitir('ADMINISTRADOR'), mesas.editar);
router.patch('/:id/baja', permitir('ADMINISTRADOR'), mesas.baja);

export default router;