import { Request, Response } from 'express';
import { CotizacionService } from '../services/cotizacion.service.js';
import { CotizacionRepository } from '../repositories/cotizacion.repository.js';
import { sendSuccess, sendError } from '../../../shared/index.js';
import { generateCotizacionPdf } from '../../../utils/pdfGenerator.js';

export class CotizacionController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { noSolicitud, idProveedor, estadoAdjudicacion } = req.query;

      const filters = {
        noSolicitud: noSolicitud ? String(noSolicitud) : undefined,
        idProveedor: idProveedor ? Number(idProveedor) : undefined,
        estadoAdjudicacion: estadoAdjudicacion ? String(estadoAdjudicacion) : undefined,
      };

      const cotizaciones = await CotizacionService.obtenerCotizaciones(filters);
      sendSuccess(res, cotizaciones);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de cotizaciones', error, 500);
    }
  }

  static async listarProveedores(_req: Request, res: Response): Promise<void> {
    try {
      const proveedores = await CotizacionService.obtenerProveedoresActivos();
      sendSuccess(res, proveedores);
    } catch (error: any) {
      sendError(res, 'Error al obtener los proveedores', error, 500);
    }
  }

  static async descargarPdf(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) {
        res.status(400).send('ID de cotización inválido');
        return;
      }

      // 1. Intentar obtener el BLOB almacenado directamente en Oracle DB
      const { buffer: dbBlob, filename } = await CotizacionRepository.findPdfBlob(id);

      if (dbBlob && dbBlob.length > 0) {
        const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        const cleanFilename = safeFilename.replace(/[\r\n"']/g, '').trim() || `cotizacion_${id}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${cleanFilename}"`);
        res.setHeader('Content-Length', String(dbBlob.length));
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(dbBlob);
        return;
      }

      // 2. Si no había BLOB adjunto, generar el reporte estándar de respaldo
      const cotizacion = await CotizacionService.obtenerCotizacionPorId(id, true);
      if (!cotizacion) {
        res.status(404).send(`No se encontró la cotización con ID ${id}`);
        return;
      }

      const generatedBuffer = generateCotizacionPdf(cotizacion);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="cotizacion_${id}.pdf"`);
      res.setHeader('Content-Length', String(generatedBuffer.length));
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(generatedBuffer);
    } catch (error: any) {
      console.error('[CotizacionController.descargarPdf Error]:', error);
      res.status(500).send('Error interno al procesar el archivo PDF original');
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const downloadPdf = req.query.downloadPdf === 'true' || req.query.format === 'pdf';

      if (downloadPdf) {
        await CotizacionController.descargarPdf(req, res);
        return;
      }

      const cotizacion = await CotizacionService.obtenerCotizacionPorId(id, false);

      if (!cotizacion) {
        sendError(res, `No se encontró la cotización con ID ${id}`, undefined, 404);
        return;
      }

      sendSuccess(res, cotizacion);
    } catch (error: any) {
      sendError(res, 'Error al obtener la cotización', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevaCotizacion = await CotizacionService.crearCotizacion(req.body);
      sendSuccess(res, nuevaCotizacion, 'Cotización creada exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear la cotización', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const cotizacionActualizada = await CotizacionService.actualizarCotizacion(id, req.body);
      sendSuccess(res, cotizacionActualizada, 'Cotización actualizada exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar la cotización', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await CotizacionService.eliminarCotizacion(id);
      sendSuccess(res, null, `Cotización con ID ${id} eliminada exitosamente`);
    } catch (error: any) {
      sendError(res, 'Error al eliminar la cotización', error, 400);
    }
  }

  static async guardarMatriz(req: Request, res: Response): Promise<void> {
    try {
      const cotizaciones = await CotizacionService.guardarMatriz(req.body);
      sendSuccess(res, cotizaciones, 'Matriz de cotizaciones procesada exitosamente en la base de datos');
    } catch (error: any) {
      sendError(res, 'Error al procesar la matriz de cotizaciones', error, 400);
    }
  }

  static async adjudicar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { noSolicitud, justificacion } = req.body;
      const adjudicada = await CotizacionService.adjudicarCotizacion(id, noSolicitud, justificacion);
      sendSuccess(res, adjudicada, 'Cotización adjudicada exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al adjudicar la cotización', error, 400);
    }
  }
}
