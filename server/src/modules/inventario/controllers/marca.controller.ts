import { Request, Response } from 'express';
import { MarcaService } from '../services/marca.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

export class MarcaController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, activo } = req.query;
      const filters = {
        nombre: nombre ? String(nombre) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
      };

      const marcas = await MarcaService.obtenerMarcas(filters);
      sendSuccess(res, marcas);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de marcas', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const marca = await MarcaService.obtenerPorId(id);

      if (!marca) {
        sendError(res, `No se encontró la marca con ID ${id}`, undefined, 404);
        return;
      }

      sendSuccess(res, marca);
    } catch (error: any) {
      sendError(res, 'Error al obtener la marca', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevaMarca = await MarcaService.crearMarca(req.body);
      sendSuccess(res, nuevaMarca, 'Marca creada exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear la marca', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const marcaActualizada = await MarcaService.actualizarMarca(id, req.body);
      sendSuccess(res, marcaActualizada, 'Marca actualizada exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar la marca', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await MarcaService.eliminarMarca(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar la marca', error, 400);
    }
  }
}
