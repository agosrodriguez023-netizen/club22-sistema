import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { permitir } from '../middlewares/permitir.js';
import * as productosController from '../controllers/productos.controller.js';

const router = Router();
router.use(autenticar);

const TODOS = ['ADMINISTRADOR', 'CAJERO', 'SALA', 'INVENTARIO'];

// Ver el catálogo: cualquier usuario con sesión. '/buscar' va antes que '/:codigo'.
router.get('/buscar', permitir(...TODOS), productosController.buscarPorNombre);
router.get('/:codigo', permitir(...TODOS), productosController.buscarPorCodigo);

// Modificar el catálogo: solo el Administrador.
router.post('/', permitir('ADMINISTRADOR'), productosController.crear);
router.put('/:codigo', permitir('ADMINISTRADOR'), productosController.editar);
router.put('/:codigo/precio', permitir('ADMINISTRADOR'), productosController.actualizarPrecio);
router.delete('/:codigo', permitir('ADMINISTRADOR'), productosController.bajaLogica);

export default router;