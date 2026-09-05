import { Router } from 'express';
import { SolicitudCompraController } from '../controllers/solicitudCompra.controller.js';

const router = Router();

router.get('/', SolicitudCompraController.listar);
router.get('/:noDocumento', SolicitudCompraController.obtenerPorNoDocumento);

export default router;
