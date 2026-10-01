import { Router } from 'express';
import { VehiculoController } from '../controllers/vehiculo.controller.js';

const router = Router();

router.get('/', VehiculoController.getAll);
router.get('/:id', VehiculoController.getById);
router.post('/', VehiculoController.create);
router.put('/:id', VehiculoController.update);
router.delete('/:id', VehiculoController.delete);

export default router;
