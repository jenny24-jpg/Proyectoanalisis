import { Router } from 'express';
import { ConductorController } from '../controllers/conductor.controller.js';

const router = Router();

router.get('/empleados', ConductorController.getEmpleados);
router.get('/', ConductorController.getAll);
router.get('/:id', ConductorController.getById);
router.post('/', ConductorController.create);
router.put('/:id', ConductorController.update);
router.delete('/:id', ConductorController.delete);

export default router;
