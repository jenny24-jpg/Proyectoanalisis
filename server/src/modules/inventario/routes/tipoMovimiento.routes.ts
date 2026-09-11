import { Router } from 'express';
import { TipoMovimientoController } from '../controllers/tipoMovimiento.controller.js';

const router = Router();

router.get('/', TipoMovimientoController.listar);
router.get('/:id', TipoMovimientoController.obtenerPorId);
router.post('/', TipoMovimientoController.crear);
router.put('/:id', TipoMovimientoController.actualizar);
router.delete('/:id', TipoMovimientoController.eliminar);

export default router;
