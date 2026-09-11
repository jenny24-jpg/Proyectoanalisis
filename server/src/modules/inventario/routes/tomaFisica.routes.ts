import { Router } from 'express';
import { TomaFisicaController } from '../controllers/tomaFisica.controller.js';

const router = Router();

router.post('/', TomaFisicaController.aperturar);
router.get('/activa/:idBodega', TomaFisicaController.getActiva);
router.put('/:idToma/conteo', TomaFisicaController.guardarConteo);

export default router;
