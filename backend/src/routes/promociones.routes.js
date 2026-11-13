import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as promociones from '../controllers/promociones.controller.js';

const router = Router();
router.use(autenticar);

// Consultar: todos. Las vigentes las usa la pantalla de venta.
router.get('/', permitir('ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'), promociones.listar);
router.get('/vigentes', permitir('ADMINISTRADOR', 'CAJERO'), promociones.vigentes);

// Alta, edición y duplicado: solo el Administrador
router.post('/', permitir('ADMINISTRADOR'), promociones.crear);
router.put('/:id', permitir('ADMINISTRADOR'), promociones.editar);
router.post('/:id/duplicar', permitir('ADMINISTRADOR'), promociones.duplicar);

export default router;