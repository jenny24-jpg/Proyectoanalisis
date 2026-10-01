import { Request, Response } from 'express';
import path from 'path';
import { GuiaSistemaService } from '../services/guiaSistema.service.js';
import { GuiaSistemaRepository } from '../repositories/guiaSistema.repository.js';

function getMimeType(filename: string, tipo?: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (ext === '.ppt') return 'application/vnd.ms-powerpoint';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp4') return 'video/mp4';

  if (tipo) {
    const t = tipo.toUpperCase();
    if (t === 'PDF' || t === 'DOCUMENTO') return 'application/pdf';
    if (t === 'PRESENTACION') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (t === 'IMAGEN') return 'image/png';
    if (t === 'VIDEO') return 'video/mp4';
  }

  return 'application/octet-stream';
}

export class GuiaSistemaController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { modulo, tipo, activo, busqueda } = req.query;
      const filters = {
        moduloDestino: modulo ? String(modulo) : undefined,
        tipoContenido: tipo ? String(tipo) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
        busqueda: busqueda ? String(busqueda) : undefined,
      };

      const guias = await GuiaSistemaService.obtenerGuías(filters);
      res.status(200).json({
        success: true,
        data: guias,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al consultar las guías multimedia del sistema',
        error: error.message,
      });
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const guia = await GuiaSistemaService.obtenerGuiaPorId(id);
      if (!guia) {
        res.status(404).json({
          success: false,
          message: `No se encontró la guía con ID ${id}`,
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: guia,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener la guía',
      });
    }
  }

  /**
   * Descarga o visualiza el archivo BLOB directamente desde Oracle DB
   */
  static async descargarArchivo(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const doc = await GuiaSistemaRepository.findArchivoBlob(id);

      if (!doc || !doc.blob) {
        res.status(404).json({
          success: false,
          message: `La guía con ID ${id} no cuenta con archivo binario almacenado en base de datos.`,
        });
        return;
      }

      const contentType = getMimeType(doc.filename, doc.tipo);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
      res.setHeader('Content-Length', doc.blob.length);
      res.end(doc.blob);
    } catch (error: any) {
      console.error('[GuiaSistemaController.descargarArchivo Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Error al recuperar el archivo de la guía desde Oracle DB',
        error: error.message,
      });
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      let dto = { ...req.body };
      if (typeof dto.data === 'string') {
        try {
          dto = JSON.parse(dto.data);
        } catch (_e) {
          // continuar
        }
      }

      // Si viene archivo vía multer
      if (req.file) {
        dto.archivoBlob = req.file.buffer;
        dto.nombreArchivo = req.file.originalname;
      }

      const guia = await GuiaSistemaService.crearGuia(dto);
      res.status(201).json({
        success: true,
        message: 'Guía del sistema creada exitosamente y archivo almacenado en BLOB',
        data: guia,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear la guía del sistema',
      });
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      let dto = { ...req.body };
      if (typeof dto.data === 'string') {
        try {
          dto = JSON.parse(dto.data);
        } catch (_e) {
          // continuar
        }
      }

      if (req.file) {
        dto.archivoBlob = req.file.buffer;
        dto.nombreArchivo = req.file.originalname;
      }

      const guia = await GuiaSistemaService.actualizarGuia(id, dto);
      if (!guia) {
        res.status(404).json({
          success: false,
          message: `No se encontró la guía con ID ${id}`,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Guía actualizada exitosamente',
        data: guia,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar la guía',
      });
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const ok = await GuiaSistemaService.eliminarGuia(id);
      res.status(200).json({
        success: ok,
        message: ok ? 'Guía desactivada exitosamente' : 'No se pudo desactivar la guía',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar la guía',
      });
    }
  }
}

