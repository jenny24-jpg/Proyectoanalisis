import { Request, Response } from 'express';
import { SolicitudCompraService } from '../services/solicitudCompra.service.js';

export class SolicitudCompraController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { noDocumento, idDepartamento, idEstado } = req.query;

      const filters = {
        noDocumento: noDocumento ? String(noDocumento) : undefined,
        idDepartamento: idDepartamento ? Number(idDepartamento) : undefined,
        idEstado: idEstado ? Number(idEstado) : undefined,
      };

      const solicitudes = await SolicitudCompraService.obtenerSolicitudes(filters);
      res.status(200).json({
        success: true,
        data: solicitudes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de solicitudes de compra',
        error: error.message,
      });
    }
  }

  static async obtenerPorNoDocumento(req: Request, res: Response): Promise<void> {
    try {
      const noDocumento = req.params.noDocumento;
      const solicitud = await SolicitudCompraService.obtenerSolicitudPorNoDocumento(noDocumento);

      if (!solicitud) {
        res.status(404).json({
          success: false,
          message: `No se encontró la solicitud de compra con documento ${noDocumento}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: solicitud,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener la solicitud de compra',
        error: error.message,
      });
    }
  }
}
