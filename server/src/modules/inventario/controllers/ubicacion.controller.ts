import { Request, Response } from 'express';
import { UbicacionService } from '../services/ubicacion.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

export class UbicacionController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { codigo, idBodega, activo } = req.query;
      const filters = {
        codigo: codigo ? String(codigo) : undefined,
        idBodega: idBodega ? Number(idBodega) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
      };
      const ubicaciones = await UbicacionService.obtenerUbicaciones(filters);
      sendSuccess(res, ubicaciones);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de ubicaciones', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const ubicacion = await UbicacionService.obtenerPorId(id);
      if (!ubicacion) {
        sendError(res, `No se encontró la ubicación con ID ${id}`, undefined, 404);
        return;
      }
      sendSuccess(res, ubicacion);
    } catch (error: any) {
      sendError(res, 'Error al obtener la ubicación', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nueva = await UbicacionService.crearUbicacion(req.body);
      sendSuccess(res, nueva, 'Ubicación registrada exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear la ubicación', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const actualizada = await UbicacionService.actualizarUbicacion(id, req.body);
      sendSuccess(res, actualizada, 'Ubicación actualizada exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar la ubicación', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await UbicacionService.eliminarUbicacion(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar la ubicación', error, 400);
    }
  }
}
