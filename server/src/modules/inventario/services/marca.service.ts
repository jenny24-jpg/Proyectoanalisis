import { MarcaRepository } from '../repositories/marca.repository.js';
import {
  IMarca,
  ICreateMarcaDTO,
  IUpdateMarcaDTO,
  IMarcaFilterParams,
} from '@erp/contracts';

/**
 * Servicio de Negocio para el catálogo de Marcas
 */
export class MarcaService {
  static async obtenerMarcas(filters: IMarcaFilterParams = {}): Promise<IMarca[]> {
    return await MarcaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IMarca | null> {
    if (!id || id <= 0) {
      throw new Error('El ID de la marca debe ser un número positivo.');
    }
    return await MarcaRepository.findById(id);
  }

  static async crearMarca(data: ICreateMarcaDTO): Promise<IMarca> {
    if (!data.marNombreMarca || data.marNombreMarca.trim() === '') {
      throw new Error('El nombre de la marca es obligatorio.');
    }

    if (data.marNombreMarca.trim().length > 100) {
      throw new Error('El nombre de la marca no puede exceder 100 caracteres.');
    }

    if (data.marActivo !== undefined && ![0, 1].includes(data.marActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    return await MarcaRepository.create(data);
  }

  static async actualizarMarca(id: number, data: IUpdateMarcaDTO): Promise<IMarca> {
    if (!id || id <= 0) {
      throw new Error('El ID de la marca debe ser un número positivo.');
    }

    if (data.marNombreMarca !== undefined) {
      if (data.marNombreMarca.trim() === '') {
        throw new Error('El nombre de la marca no puede estar vacío.');
      }
      if (data.marNombreMarca.trim().length > 100) {
        throw new Error('El nombre de la marca no puede exceder 100 caracteres.');
      }
    }

    if (data.marActivo !== undefined && ![0, 1].includes(data.marActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    const updated = await MarcaRepository.update(id, data);
    if (!updated) {
      throw new Error(`No se encontró la marca con ID ${id}.`);
    }

    return updated;
  }

  static async eliminarMarca(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID de la marca debe ser un número positivo.');
    }

    const result = await MarcaRepository.delete(id);
    if (result.deactivated) {
      return {
        ...result,
        message: 'La marca posee artículos asociados, por lo que fue desactivada para proteger la integridad.',
      };
    }
    return {
      ...result,
      message: 'Marca eliminada exitosamente.',
    };
  }
}
