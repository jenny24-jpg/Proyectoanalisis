import { Router } from 'express';
import { EstadoController } from '../controllers/estado.controller.js';

const router = Router();

router.get('/', EstadoController.listar);
router.get('/:id', EstadoController.obtenerPorId);
router.post('/', EstadoController.crear);
router.put('/:id', EstadoController.actualizar);
router.delete('/:id', EstadoController.eliminar);

export default router;
