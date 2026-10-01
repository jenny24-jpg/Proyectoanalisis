import { Request, Response } from 'express';
import { OrdenCompraService } from '../services/ordenCompra.service.js';

export class OrdenCompraController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { noPo, idEstado, fechaInicio, fechaFin } = req.query;

      const filters = {
        noPo: noPo ? String(noPo) : undefined,
        idEstado: idEstado ? Number(idEstado) : undefined,
        fechaInicio: fechaInicio ? String(fechaInicio) : undefined,
        fechaFin: fechaFin ? String(fechaFin) : undefined,
      };

      const ordenes = await OrdenCompraService.obtenerOrdenesCompra(filters);
      res.status(200).json({
        success: true,
        data: ordenes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de órdenes de compra',
        error: error.message,
      });
    }
  }

  static async obtenerPorNoPo(req: Request, res: Response): Promise<void> {
    try {
      const noPo = req.params.noPo;
      const orden = await OrdenCompraService.obtenerPorNoPo(noPo);

      if (!orden) {
        res.status(404).json({
          success: false,
          message: `No se encontró la orden de compra ${noPo}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: orden,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener la orden de compra',
        error: error.message,
      });
    }
  }

  static async obtenerPorSolicitud(req: Request, res: Response): Promise<void> {
    try {
      const noDocumento = req.params.noDocumento;
      const orden = await OrdenCompraService.obtenerPorSolicitud(noDocumento);

      if (!orden) {
        res.status(404).json({
          success: false,
          message: `No se encontró orden de compra asociada a la solicitud ${noDocumento}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: orden,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener la orden de compra de la solicitud',
        error: error.message,
      });
    }
  }

  static async autorizarPresupuesto(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const resultado = await OrdenCompraService.autorizarPresupuesto(payload);

      res.status(200).json({
        success: true,
        message: `Presupuesto validado exitosamente. Orden de Compra ${resultado.ocoNoPo} generada y solicitud enviada a Bodega.`,
        data: resultado,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al autorizar el presupuesto',
        error: error.message,
      });
    }
  }

  static async rechazarPresupuesto(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      await OrdenCompraService.rechazarPresupuesto(payload);

      res.status(200).json({
        success: true,
        message: 'Presupuesto rechazado / solicitud devuelta para ajuste financiero exitosamente.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al rechazar el presupuesto',
        error: error.message,
      });
    }
  }

  static async descargarPdf(req: Request, res: Response): Promise<void> {
    try {
      const noPo = req.params.noPo;
      const { OrdenCompraRepository } = await import('../repositories/ordenCompra.repository.js');
      const doc = await OrdenCompraRepository.findPdfBlob(noPo);

      if (!doc || !doc.blob) {
        res.status(404).json({
          success: false,
          message: `La orden de compra ${noPo} no cuenta con documento PDF almacenado en la base de datos.`,
        });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
      res.setHeader('Content-Length', doc.blob.length);
      res.end(doc.blob);
    } catch (error: any) {
      console.error('[OrdenCompraController.descargarPdf Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Error al recuperar el archivo PDF de la orden de compra desde Oracle DB',
        error: error.message,
      });
    }
  }

  static async subirPdf(req: Request, res: Response): Promise<void> {
    try {
      const noPo = req.params.noPo;
      const file = req.file;

      if (!file || !file.buffer) {
        res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo PDF para almacenar en BLOB.',
        });
        return;
      }

      const { OrdenCompraRepository } = await import('../repositories/ordenCompra.repository.js');
      await OrdenCompraRepository.guardarPdfBlob(noPo, file.buffer);

      res.status(200).json({
        success: true,
        message: `Documento PDF de la Orden de Compra ${noPo} almacenado exitosamente en Oracle DB (BLOB).`,
      });
    } catch (error: any) {
      console.error('[OrdenCompraController.subirPdf Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Error al almacenar el PDF de la orden de compra en BLOB',
        error: error.message,
      });
    }
  }
}

