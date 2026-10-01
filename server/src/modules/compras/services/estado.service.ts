import { EstadoRepository } from '../repositories/estado.repository.js';
import {
  IEstado,
  ICreateEstadoDTO,
  IUpdateEstadoDTO,
  IEstadoFilterParams,
} from '@erp/contracts';
import {
  validateNominalText,
  validateNumericId,
} from '../../../utils/sanitizers.js';

/**
 * Servicio de Negocio para el catálogo de Estados (CMP_ESTADO)
 * Esquema físico: EST_ID_ESTADO, EST_NOMBRE_ESTADO
 */
export class EstadoService {
  static async obtenerEstados(filters: IEstadoFilterParams = {}): Promise<IEstado[]> {
    return await EstadoRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IEstado | null> {
    const validId = validateNumericId(id, 'ID del estado');
    return await EstadoRepository.findById(validId);
  }

  static async crearEstado(data: ICreateEstadoDTO): Promise<IEstado> {
    const trimmed = validateNominalText(data.estNombreEstado, 'nombre del estado', 50);

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
    const validId = validateNumericId(id, 'ID del estado');
    const updatePayload: IUpdateEstadoDTO = {};

    if (data.estNombreEstado !== undefined) {
      const trimmed = validateNominalText(data.estNombreEstado, 'nombre del estado', 50);

      // Validar unicidad excluyendo el registro actual
      const duplicado = await EstadoRepository.findByNombre(trimmed);
      if (duplicado && duplicado.estIdEstado !== validId) {
        throw new Error(`Ya existe otro estado registrado con el nombre "${trimmed}".`);
      }

      updatePayload.estNombreEstado = trimmed;
    }

    const updated = await EstadoRepository.update(validId, updatePayload);
    if (!updated) {
      throw new Error(`No se encontró el estado con ID ${validId}.`);
    }

    return updated;
  }

  static async eliminarEstado(id: number): Promise<{ deleted: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID del estado debe ser un número positivo.');
    }

    try {
      const result = await EstadoRepository.delete(id);
      if (result.inUse) {
        throw new Error(result.message || 'No se puede eliminar el estado porque está en uso.');
      }

      return {
        deleted: true,
        message: 'Estado eliminado exitosamente.',
      };
    } catch (error: any) {
      if (error?.errorNum === 2292 || (error?.message && error.message.includes('ORA-02292'))) {
        throw new Error(
          'No se puede eliminar el estado porque está siendo utilizado en solicitudes, órdenes de compra o facturas asociadas (restricción de integridad referencial).'
        );
      }
      throw error;
    }
  }
}
