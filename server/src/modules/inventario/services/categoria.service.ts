import { CategoriaRepository } from '../repositories/categoria.repository.js';
import {
  ICategoria,
  ICreateCategoriaDTO,
  IUpdateCategoriaDTO,
  ICategoriaFilterParams,
} from '@erp/contracts';
import {
  validateNominalText,
  validateBooleanFlag,
  validateNumericId,
} from '../../../utils/sanitizers.js';

/**
 * Servicio de Negocio para el catálogo de Categorías
 */
export class CategoriaService {
  static async obtenerCategorias(filters: ICategoriaFilterParams = {}): Promise<ICategoria[]> {
    return await CategoriaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<ICategoria | null> {
    const validId = validateNumericId(id, 'ID de la categoría');
    return await CategoriaRepository.findById(validId);
  }

  static async crearCategoria(data: ICreateCategoriaDTO): Promise<ICategoria> {
    const nombreValidado = validateNominalText(
      data.catNombreCategoria,
      'nombre de la categoría',
      100
    );

    const activoValidado = validateBooleanFlag(data.catActivo, 'activo', 1);

    return await CategoriaRepository.create({
      catNombreCategoria: nombreValidado,
      catActivo: activoValidado,
    });
  }

  static async actualizarCategoria(id: number, data: IUpdateCategoriaDTO): Promise<ICategoria> {
    const validId = validateNumericId(id, 'ID de la categoría');
    const updatePayload: IUpdateCategoriaDTO = {};

    if (data.catNombreCategoria !== undefined) {
      updatePayload.catNombreCategoria = validateNominalText(
        data.catNombreCategoria,
        'nombre de la categoría',
        100
      );
    }

    if (data.catActivo !== undefined) {
      updatePayload.catActivo = validateBooleanFlag(data.catActivo, 'activo', 1);
    }

    const updated = await CategoriaRepository.update(validId, updatePayload);
    if (!updated) {
      throw new Error(`No se encontró la categoría con ID ${validId}.`);
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
