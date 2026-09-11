import { Request, Response } from 'express';
import { BodegaService } from '../services/bodega.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

export class BodegaController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, codigo, activo } = req.query;
      const filters = {
        nombre: nombre ? String(nombre) : undefined,
        codigo: codigo ? String(codigo) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
      };

      const bodegas = await BodegaService.obtenerBodegas(filters);
      sendSuccess(res, bodegas);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de bodegas', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const bodega = await BodegaService.obtenerPorId(id);

      if (!bodega) {
        sendError(res, `No se encontró la bodega con ID ${id}`, undefined, 404);
        return;
      }

      sendSuccess(res, bodega);
    } catch (error: any) {
      sendError(res, 'Error al obtener la bodega', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevaBodega = await BodegaService.crearBodega(req.body);
      sendSuccess(res, nuevaBodega, 'Bodega registrada exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear la bodega', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const bodegaActualizada = await BodegaService.actualizarBodega(id, req.body);
      sendSuccess(res, bodegaActualizada, 'Bodega actualizada exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar la bodega', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await BodegaService.eliminarBodega(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar la bodega', error, 400);
    }
  }
}
