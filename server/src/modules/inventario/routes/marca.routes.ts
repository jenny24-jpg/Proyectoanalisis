import { Router } from 'express';
import { MarcaController } from '../controllers/marca.controller.js';

const router = Router();

router.get('/', MarcaController.listar);
router.get('/:id', MarcaController.obtenerPorId);
router.post('/', MarcaController.crear);
router.put('/:id', MarcaController.actualizar);
router.delete('/:id', MarcaController.eliminar);

export default router;
