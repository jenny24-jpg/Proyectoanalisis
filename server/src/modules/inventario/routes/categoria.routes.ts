import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller.js';

const router = Router();

router.get('/', CategoriaController.listar);
router.get('/:id', CategoriaController.obtenerPorId);
router.post('/', CategoriaController.crear);
router.put('/:id', CategoriaController.actualizar);
router.delete('/:id', CategoriaController.eliminar);

export default router;
