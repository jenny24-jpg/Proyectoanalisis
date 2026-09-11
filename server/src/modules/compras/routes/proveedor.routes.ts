import { Router } from 'express';
import { ProveedorController } from '../controllers/proveedor.controller.js';

const router = Router();

router.get('/', ProveedorController.listar);
router.get('/:id', ProveedorController.obtenerPorId);
router.post('/', ProveedorController.crear);
router.put('/:id', ProveedorController.actualizar);
router.delete('/:id', ProveedorController.eliminar);

export default router;
