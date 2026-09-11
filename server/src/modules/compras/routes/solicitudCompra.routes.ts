import { Router } from 'express';
import { SolicitudCompraController } from '../controllers/solicitudCompra.controller.js';

const router = Router();

router.get('/', SolicitudCompraController.listar);
router.get('/:noDocumento', SolicitudCompraController.obtenerPorNoDocumento);
router.get('/:noDocumento/completa', SolicitudCompraController.obtenerCompleta);
router.get('/:noDocumento/detalles', SolicitudCompraController.obtenerDetalles);
router.put('/:noDocumento', SolicitudCompraController.actualizar);
router.post('/:noDocumento/aprobar', SolicitudCompraController.aprobar);
router.post('/:noDocumento/rechazar', SolicitudCompraController.rechazar);
router.post('/', SolicitudCompraController.crear);

export default router;
