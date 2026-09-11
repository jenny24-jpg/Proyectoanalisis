import { EstadoRepository } from '../repositories/estado.repository.js';
import {
  IEstado,
  ICreateEstadoDTO,
  IUpdateEstadoDTO,
  IEstadoFilterParams,
} from '@erp/contracts';

/**
 * Servicio de Negocio para el catálogo de Estados (CMP_ESTADO)
 */
export class EstadoService {
  static async obtenerEstados(filters: IEstadoFilterParams = {}): Promise<IEstado[]> {
    return await EstadoRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IEstado | null> {
    if (!id || id <= 0) {
      throw new Error('El ID del estado debe ser un número positivo.');
    }
    return await EstadoRepository.findById(id);
  }

  static async crearEstado(data: ICreateEstadoDTO): Promise<IEstado> {
    if (!data.estNombreEstado || data.estNombreEstado.trim() === '') {
      throw new Error('El nombre del estado es obligatorio.');
    }

    const trimmed = data.estNombreEstado.trim();

    if (trimmed.length > 50) {
      throw new Error('El nombre del estado no puede exceder 50 caracteres.');
    }

    // Validación de unicidad
    const duplicado = await EstadoRepository.findByNombre(trimmed);
    if (duplicado) {
      throw new Error(`Ya existe un estado registrado con el nombre "${trimmed}".`);
    }

    return await EstadoRepository.create({
      estNombreEstado: trimmed,
    });
  }

  static async actualizarEstado(id: number, data: IUpdateEstadoDTO): Promise<IEstado> {
    if (!id || id <= 0) {
      throw new Error('El ID del estado debe ser un número positivo.');
    }

    if (data.estNombreEstado !== undefined) {
      const trimmed = data.estNombreEstado.trim();
      if (trimmed === '') {
        throw new Error('El nombre del estado no puede estar vacío.');
      }
      if (trimmed.length > 50) {
        throw new Error('El nombre del estado no puede exceder 50 caracteres.');
      }

      // Validar unicidad excluyendo el registro actual
      const duplicado = await EstadoRepository.findByNombre(trimmed);
      if (duplicado && duplicado.estIdEstado !== id) {
        throw new Error(`Ya existe otro estado registrado con el nombre "${trimmed}".`);
      }

      data.estNombreEstado = trimmed;
    }

    const updated = await EstadoRepository.update(id, data);
    if (!updated) {
      throw new Error(`No se encontró el estado con ID ${id}.`);
    }

    return updated;
  }

  static async eliminarEstado(id: number): Promise<{ deleted: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID del estado debe ser un número positivo.');
    }

    const result = await EstadoRepository.delete(id);
    if (result.inUse) {
      throw new Error(result.message || 'No se puede eliminar el estado porque está en uso.');
    }

    return {
      deleted: true,
      message: 'Estado eliminado exitosamente.',
    };
  }
}
