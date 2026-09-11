import { Router } from 'express';
import { UbicacionController } from '../controllers/ubicacion.controller.js';

const router = Router();

router.get('/', UbicacionController.listar);
router.get('/:id', UbicacionController.obtenerPorId);
router.post('/', UbicacionController.crear);
router.put('/:id', UbicacionController.actualizar);
router.delete('/:id', UbicacionController.eliminar);

export default router;
