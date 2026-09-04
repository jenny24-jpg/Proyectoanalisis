import { Request, Response } from 'express';
import { CotizacionService } from '../services/cotizacion.service.js';

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
      res.status(200).json({
        success: true,
        data: cotizaciones,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de cotizaciones',
        error: error.message,
      });
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const downloadPdf = req.query.downloadPdf === 'true';

      const cotizacion = await CotizacionService.obtenerCotizacionPorId(id, downloadPdf);

      if (!cotizacion) {
        res.status(404).json({
          success: false,
          message: `No se encontró la cotización con ID ${id}`,
        });
        return;
      }

      if (downloadPdf && cotizacion.cotArchivoPdf) {
        let pdfBuffer: Buffer;
        if (Buffer.isBuffer(cotizacion.cotArchivoPdf)) {
          pdfBuffer = cotizacion.cotArchivoPdf;
        } else {
          pdfBuffer = Buffer.from(cotizacion.cotArchivoPdf as string, 'base64');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="cotizacion_${id}.pdf"`);
        res.send(pdfBuffer);
        return;
      }

      res.status(200).json({
        success: true,
        data: cotizacion,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener la cotización',
        error: error.message,
      });
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevaCotizacion = await CotizacionService.crearCotizacion(req.body);
      res.status(201).json({
        success: true,
        message: 'Cotización creada exitosamente',
        data: nuevaCotizacion,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al crear la cotización',
        error: error.message,
      });
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const cotizacionActualizada = await CotizacionService.actualizarCotizacion(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Cotización actualizada exitosamente',
        data: cotizacionActualizada,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar la cotización',
        error: error.message,
      });
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await CotizacionService.eliminarCotizacion(id);
      res.status(200).json({
        success: true,
        message: `Cotización con ID ${id} eliminada exitosamente`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al eliminar la cotización',
        error: error.message,
      });
    }
  }
}
