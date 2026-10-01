import { Router } from 'express';
import multer from 'multer';
import { RecepcionBodegaController } from '../controllers/recepcionBodega.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoints de Recepción en Bodega e Inventario Kardex
router.get('/', RecepcionBodegaController.listar);
router.post('/', upload.single('archivo'), RecepcionBodegaController.registrar);
router.post('/registrar', upload.single('archivo'), RecepcionBodegaController.registrar);
router.get('/:noRecepcion/documento', RecepcionBodegaController.descargarDocumento);
router.post('/:noRecepcion/documento', upload.single('archivo'), RecepcionBodegaController.subirDocumento);
router.get('/po/:noPo', RecepcionBodegaController.obtenerPorNoPo);
router.get('/:noRecepcion', RecepcionBodegaController.obtenerPorNoRecepcion);

export default router;

