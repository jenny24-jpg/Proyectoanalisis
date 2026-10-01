import { Request, Response } from 'express';
import { RecepcionBodegaService } from '../services/recepcionBodega.service.js';

export class RecepcionBodegaController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { noRecepcion, noPo, idBodega, tipoRecepcion } = req.query;

      const filters = {
        noRecepcion: noRecepcion ? String(noRecepcion) : undefined,
        noPo: noPo ? String(noPo) : undefined,
        idBodega: idBodega ? Number(idBodega) : undefined,
        tipoRecepcion: tipoRecepcion ? String(tipoRecepcion) : undefined,
      };

      const recepciones = await RecepcionBodegaService.obtenerRecepciones(filters);
      res.status(200).json({
        success: true,
        data: recepciones,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener el listado de recepciones en bodega',
        error: error.message,
      });
    }
  }

  static async obtenerPorNoRecepcion(req: Request, res: Response): Promise<void> {
    try {
      const noRecepcion = req.params.noRecepcion;
      const recepcion = await RecepcionBodegaService.obtenerPorNoRecepcion(noRecepcion);

      if (!recepcion) {
        res.status(404).json({
          success: false,
          message: `No se encontró la recepción ${noRecepcion}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: recepcion,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener los detalles de la recepción',
        error: error.message,
      });
    }
  }

  static async obtenerPorNoPo(req: Request, res: Response): Promise<void> {
    try {
      const noPo = req.params.noPo;
      const recepcion = await RecepcionBodegaService.obtenerPorNoPo(noPo);

      if (!recepcion) {
        res.status(404).json({
          success: false,
          message: `No se encontró recepción para la orden de compra ${noPo}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: recepcion,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener la recepción de la PO',
        error: error.message,
      });
    }
  }

  static async registrar(req: Request, res: Response): Promise<void> {
    try {
      let payload = req.body;
      // Si viene como FormData (multipart/form-data), 'data' puede venir como string JSON
      if (typeof payload.data === 'string') {
        try {
          payload = JSON.parse(payload.data);
        } catch (_e) {
          // continuar con payload plano
        }
      }

      if (req.file) {
        payload.documentoBlob = req.file.buffer;
        payload.nombreArchivoPdf = req.file.originalname;
      }

      const resultado = await RecepcionBodegaService.registrarRecepcion(payload);

      res.status(201).json({
        success: true,
        message: `Recepción física ${resultado.rboNoRecepcion} procesada exitosamente. Kardex e inventario actualizados.`,
        data: resultado,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al procesar la recepción en bodega',
        error: error.message,
      });
    }
  }

  static async descargarDocumento(req: Request, res: Response): Promise<void> {
    try {
      const noRecepcion = req.params.noRecepcion;
      const { RecepcionBodegaRepository } = await import('../repositories/recepcionBodega.repository.js');
      const doc = await RecepcionBodegaRepository.findDocumentoBlob(noRecepcion);

      if (!doc || !doc.blob) {
        res.status(404).json({
          success: false,
          message: `La recepción ${noRecepcion} no cuenta con documento o comprobante físico adjunto.`,
        });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
      res.setHeader('Content-Length', doc.blob.length);
      res.end(doc.blob);
    } catch (error: any) {
      console.error('[RecepcionBodegaController.descargarDocumento Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Error al recuperar el documento de recepción desde Oracle DB',
        error: error.message,
      });
    }
  }

  static async subirDocumento(req: Request, res: Response): Promise<void> {
    try {
      const noRecepcion = req.params.noRecepcion;
      const file = req.file;

      if (!file || !file.buffer) {
        res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo para adjuntar a la recepción.',
        });
        return;
      }

      const { RecepcionBodegaRepository } = await import('../repositories/recepcionBodega.repository.js');
      await RecepcionBodegaRepository.guardarDocumentoBlob(noRecepcion, file.buffer, file.originalname);

      res.status(200).json({
        success: true,
        message: `Documento adjunto a la recepción ${noRecepcion} guardado exitosamente en Oracle DB (BLOB).`,
      });
    } catch (error: any) {
      console.error('[RecepcionBodegaController.subirDocumento Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar el documento de recepción en BLOB',
        error: error.message,
      });
    }
  }
}

