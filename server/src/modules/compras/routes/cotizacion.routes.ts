import { Router } from 'express';
import { CotizacionController } from '../controllers/cotizacion.controller.js';

const router = Router();

router.get('/', CotizacionController.listar);
router.get('/proveedores', CotizacionController.listarProveedores);
router.post('/matriz', CotizacionController.guardarMatriz);
router.post('/:id/adjudicar', CotizacionController.adjudicar);
router.get('/:id/pdf', CotizacionController.descargarPdf);
router.get('/:id', CotizacionController.obtenerPorId);
router.post('/', CotizacionController.crear);
router.put('/:id', CotizacionController.actualizar);
router.delete('/:id', CotizacionController.eliminar);

export default router;
