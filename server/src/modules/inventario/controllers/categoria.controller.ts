import { Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

export class CategoriaController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, activo } = req.query;
      const filters = {
        nombre: nombre ? String(nombre) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
      };

      const categorias = await CategoriaService.obtenerCategorias(filters);
      sendSuccess(res, categorias);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de categorías', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const categoria = await CategoriaService.obtenerPorId(id);

      if (!categoria) {
        sendError(res, `No se encontró la categoría con ID ${id}`, undefined, 404);
        return;
      }

      sendSuccess(res, categoria);
    } catch (error: any) {
      sendError(res, 'Error al obtener la categoría', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevaCategoria = await CategoriaService.crearCategoria(req.body);
      sendSuccess(res, nuevaCategoria, 'Categoría creada exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear la categoría', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const categoriaActualizada = await CategoriaService.actualizarCategoria(id, req.body);
      sendSuccess(res, categoriaActualizada, 'Categoría actualizada exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar la categoría', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await CategoriaService.eliminarCategoria(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar la categoría', error, 400);
    }
  }
}
