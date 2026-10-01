import { Router } from 'express';
import multer from 'multer';
import { GuiaSistemaController } from '../controllers/guiaSistema.controller.js';

const router = Router();

// Almacenamiento en memoria para BLOB (cero archivos en disco)
const uploadGuiaMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB límite
});

// Endpoints para CMP_GUIA_SISTEMA
router.get('/', GuiaSistemaController.listar);
router.get('/:id/archivo', GuiaSistemaController.descargarArchivo);
router.get('/:id', GuiaSistemaController.obtenerPorId);

// Endpoint para creación y edición de guía (soporta multipart con archivo o JSON directo)
router.post('/', uploadGuiaMedia.single('archivo'), GuiaSistemaController.crear);
router.put('/:id', uploadGuiaMedia.single('archivo'), GuiaSistemaController.actualizar);
router.delete('/:id', GuiaSistemaController.eliminar);

export default router;

