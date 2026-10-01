import { Router } from 'express';
import multer from 'multer';
import { OrdenCompraController } from '../controllers/ordenCompra.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoints de Órdenes de Compra y Validación de Presupuesto
router.get('/', OrdenCompraController.listar);
router.post('/autorizar-presupuesto', OrdenCompraController.autorizarPresupuesto);
router.post('/rechazar-presupuesto', OrdenCompraController.rechazarPresupuesto);
router.get('/solicitud/:noDocumento', OrdenCompraController.obtenerPorSolicitud);
router.get('/:noPo/pdf', OrdenCompraController.descargarPdf);
router.post('/:noPo/pdf', upload.single('archivo'), OrdenCompraController.subirPdf);
router.get('/:noPo', OrdenCompraController.obtenerPorNoPo);

export default router;

