import { Router } from 'express';
import { UnidadMedidaController } from '../controllers/unidadMedida.controller.js';

const router = Router();

router.get('/', UnidadMedidaController.listar);
router.get('/:id', UnidadMedidaController.obtenerPorId);
router.post('/', UnidadMedidaController.crear);
router.put('/:id', UnidadMedidaController.actualizar);
router.delete('/:id', UnidadMedidaController.eliminar);

export default router;
