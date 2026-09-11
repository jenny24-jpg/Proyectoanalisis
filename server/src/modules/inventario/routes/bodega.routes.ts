import { Router } from 'express';
import { BodegaController } from '../controllers/bodega.controller.js';

const router = Router();

router.get('/', BodegaController.listar);
router.get('/:id', BodegaController.obtenerPorId);
router.post('/', BodegaController.crear);
router.put('/:id', BodegaController.actualizar);
router.delete('/:id', BodegaController.eliminar);

export default router;
