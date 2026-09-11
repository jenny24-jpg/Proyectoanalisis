import { Router } from 'express';
import { LoteController } from '../controllers/lote.controller.js';

const router = Router();

router.get('/', LoteController.listar);
router.get('/:id', LoteController.obtenerPorId);
router.post('/', LoteController.crear);
router.put('/:id', LoteController.actualizar);
router.delete('/:id', LoteController.eliminar);

export default router;
