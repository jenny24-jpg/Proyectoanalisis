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

  static async obtenerCompleta(req: Request, res: Response): Promise<void> {
    try {
      const noDocumento = req.params.noDocumento;
      const solicitud = await SolicitudCompraService.obtenerSolicitudCompleta(noDocumento);

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
        message: 'Error al obtener la solicitud completa',
        error: error.message,
      });
    }
  }

  static async obtenerDetalles(req: Request, res: Response): Promise<void> {
    try {
      const noDocumento = req.params.noDocumento;
      const detalles = await SolicitudCompraService.obtenerDetalles(noDocumento);

      res.status(200).json({
        success: true,
        data: detalles,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener los detalles de la solicitud de compra',
        error: error.message,
      });
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const noDocumento = req.params.noDocumento;
      const payload = req.body;
      const actualizada = await SolicitudCompraService.actualizarSolicitud(noDocumento, payload);

      res.status(200).json({
        success: true,
        message: 'Solicitud actualizada exitosamente',
        data: actualizada,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al actualizar la solicitud de compra',
        error: error.message,
      });
    }
  }

  static async aprobar(req: Request, res: Response): Promise<void> {
    try {
      const noDocumento = req.params.noDocumento;
      const payload = req.body;
      const aprobada = await SolicitudCompraService.aprobarSolicitud(noDocumento, payload);

      res.status(200).json({
        success: true,
        message: 'Solicitud de compra aprobada exitosamente',
        data: aprobada,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al aprobar la solicitud de compra',
        error: error.message,
      });
    }
  }

  static async rechazar(req: Request, res: Response): Promise<void> {
    try {
      const noDocumento = req.params.noDocumento;
      const payload = req.body;
      const rechazada = await SolicitudCompraService.rechazarSolicitud(noDocumento, payload);

      res.status(200).json({
        success: true,
        message: 'Solicitud de compra rechazada exitosamente',
        data: rechazada,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al rechazar la solicitud de compra',
        error: error.message,
      });
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const nuevaSolicitud = await SolicitudCompraService.crearSolicitud(payload);
      
      res.status(201).json({
        success: true,
        message: 'Solicitud de compra creada exitosamente',
        data: nuevaSolicitud
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al crear la solicitud de compra',
        error: error.message,
      });
    }
  }
}
