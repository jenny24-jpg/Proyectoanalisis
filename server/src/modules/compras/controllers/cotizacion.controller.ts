import { Request, Response } from 'express';
import { CotizacionService } from '../services/cotizacion.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

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

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const downloadPdf = req.query.downloadPdf === 'true';

      const cotizacion = await CotizacionService.obtenerCotizacionPorId(id, downloadPdf);

      if (!cotizacion) {
        sendError(res, `No se encontró la cotización con ID ${id}`, undefined, 404);
        return;
      }

      if (downloadPdf && cotizacion.cotArchivoPdf) {
        const pdfBuffer = Buffer.isBuffer(cotizacion.cotArchivoPdf)
          ? cotizacion.cotArchivoPdf
          : Buffer.from(cotizacion.cotArchivoPdf as string, 'base64');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="cotizacion_${id}.pdf"`);
        res.send(pdfBuffer);
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
}
