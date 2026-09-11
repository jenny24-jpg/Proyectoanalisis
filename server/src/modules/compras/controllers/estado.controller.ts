import { Request, Response } from 'express';
import { EstadoService } from '../services/estado.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

export class EstadoController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { nombre } = req.query;
      const filters = {
        nombre: nombre ? String(nombre) : undefined,
      };

      const estados = await EstadoService.obtenerEstados(filters);
      sendSuccess(res, estados);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de estados', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const estado = await EstadoService.obtenerPorId(id);

      if (!estado) {
        sendError(res, `No se encontró el estado con ID ${id}`, undefined, 404);
        return;
      }

      sendSuccess(res, estado);
    } catch (error: any) {
      sendError(res, 'Error al obtener el estado', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevoEstado = await EstadoService.crearEstado(req.body);
      sendSuccess(res, nuevoEstado, 'Estado registrado exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear el estado', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const estadoActualizado = await EstadoService.actualizarEstado(id, req.body);
      sendSuccess(res, estadoActualizado, 'Estado actualizado exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar el estado', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await EstadoService.eliminarEstado(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar el estado', error, 400);
    }
  }
}
