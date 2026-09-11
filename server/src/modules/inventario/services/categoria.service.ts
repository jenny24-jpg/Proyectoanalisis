import { CategoriaRepository } from '../repositories/categoria.repository.js';
import {
  ICategoria,
  ICreateCategoriaDTO,
  IUpdateCategoriaDTO,
  ICategoriaFilterParams,
} from '@erp/contracts';

/**
 * Servicio de Negocio para el catálogo de Categorías
 */
export class CategoriaService {
  static async obtenerCategorias(filters: ICategoriaFilterParams = {}): Promise<ICategoria[]> {
    return await CategoriaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<ICategoria | null> {
    if (!id || id <= 0) {
      throw new Error('El ID de la categoría debe ser un número positivo.');
    }
    return await CategoriaRepository.findById(id);
  }

  static async crearCategoria(data: ICreateCategoriaDTO): Promise<ICategoria> {
    if (!data.catNombreCategoria || data.catNombreCategoria.trim() === '') {
      throw new Error('El nombre de la categoría es obligatorio.');
    }

    if (data.catNombreCategoria.trim().length > 100) {
      throw new Error('El nombre de la categoría no puede exceder 100 caracteres.');
    }

    if (data.catActivo !== undefined && ![0, 1].includes(data.catActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    return await CategoriaRepository.create(data);
  }

  static async actualizarCategoria(id: number, data: IUpdateCategoriaDTO): Promise<ICategoria> {
    if (!id || id <= 0) {
      throw new Error('El ID de la categoría debe ser un número positivo.');
    }

    if (data.catNombreCategoria !== undefined) {
      if (data.catNombreCategoria.trim() === '') {
        throw new Error('El nombre de la categoría no puede estar vacío.');
      }
      if (data.catNombreCategoria.trim().length > 100) {
        throw new Error('El nombre de la categoría no puede exceder 100 caracteres.');
      }
    }

    if (data.catActivo !== undefined && ![0, 1].includes(data.catActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    const updated = await CategoriaRepository.update(id, data);
    if (!updated) {
      throw new Error(`No se encontró la categoría con ID ${id}.`);
    }

    return updated;
  }

  static async eliminarCategoria(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID de la categoría debe ser un número positivo.');
    }

    const result = await CategoriaRepository.delete(id);
    if (result.deactivated) {
      return {
        ...result,
        message: 'La categoría posee artículos asociados, por lo que fue desactivada para proteger la integridad.',
      };
    }
    return {
      ...result,
      message: 'Categoría eliminada exitosamente.',
    };
  }
}
