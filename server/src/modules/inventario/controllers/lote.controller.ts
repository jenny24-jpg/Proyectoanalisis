import { Request, Response } from 'express';
import { LoteService } from '../services/lote.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';
import { EstadoLoteType } from '@erp/contracts';

export class LoteController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { numeroLote, codigoArticulo, estado } = req.query;
      const filters = {
        numeroLote: numeroLote ? String(numeroLote) : undefined,
        codigoArticulo: codigoArticulo ? String(codigoArticulo) : undefined,
        estado: estado ? (String(estado) as EstadoLoteType) : undefined,
      };
      const lotes = await LoteService.obtenerLotes(filters);
      sendSuccess(res, lotes);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de lotes', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const lote = await LoteService.obtenerPorId(id);
      if (!lote) {
        sendError(res, `No se encontró el lote con ID ${id}`, undefined, 404);
        return;
      }
      sendSuccess(res, lote);
    } catch (error: any) {
      sendError(res, 'Error al obtener el lote', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevo = await LoteService.crearLote(req.body);
      sendSuccess(res, nuevo, 'Lote registrado exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear el lote', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const actualizado = await LoteService.actualizarLote(id, req.body);
      sendSuccess(res, actualizado, 'Lote actualizado exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar el lote', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await LoteService.eliminarLote(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar el lote', error, 400);
    }
  }
}
