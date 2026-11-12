import { Router } from 'express';
import * as productosController from '../controllers/productos.controller.js';

const router = Router();

router.get('/buscar', productosController.buscarPorNombre);
router.get('/:codigo', productosController.buscarPorCodigo);
router.post('/', productosController.crear);
router.put('/:codigo', productosController.editar);
router.put('/:codigo/precio', productosController.actualizarPrecio);
router.delete('/:codigo', productosController.bajaLogica);

export default router;