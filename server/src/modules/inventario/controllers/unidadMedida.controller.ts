import { Request, Response } from 'express';
import { UnidadMedidaService } from '../services/unidadMedida.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

export class UnidadMedidaController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, abreviatura, activo } = req.query;
      const filters = {
        nombre: nombre ? String(nombre) : undefined,
        abreviatura: abreviatura ? String(abreviatura) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
      };

      const unidades = await UnidadMedidaService.obtenerUnidadesMedida(filters);
      sendSuccess(res, unidades);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de unidades de medida', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const unidad = await UnidadMedidaService.obtenerPorId(id);

      if (!unidad) {
        sendError(res, `No se encontró la unidad de medida con ID ${id}`, undefined, 404);
        return;
      }

      sendSuccess(res, unidad);
    } catch (error: any) {
      sendError(res, 'Error al obtener la unidad de medida', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevaUnidad = await UnidadMedidaService.crearUnidadMedida(req.body);
      sendSuccess(res, nuevaUnidad, 'Unidad de medida registrada exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear la unidad de medida', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const unidadActualizada = await UnidadMedidaService.actualizarUnidadMedida(id, req.body);
      sendSuccess(res, unidadActualizada, 'Unidad de medida actualizada exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar la unidad de medida', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await UnidadMedidaService.eliminarUnidadMedida(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar la unidad de medida', error, 400);
    }
  }
}
