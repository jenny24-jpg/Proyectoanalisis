import { MarcaRepository } from '../repositories/marca.repository.js';
import {
  IMarca,
  ICreateMarcaDTO,
  IUpdateMarcaDTO,
  IMarcaFilterParams,
} from '@erp/contracts';
import {
  validateNominalText,
  validateBooleanFlag,
  validateNumericId,
} from '../../../utils/sanitizers.js';

/**
 * Servicio de Negocio para el catálogo de Marcas
 */
export class MarcaService {
  static async obtenerMarcas(filters: IMarcaFilterParams = {}): Promise<IMarca[]> {
    return await MarcaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IMarca | null> {
    const validId = validateNumericId(id, 'ID de la marca');
    return await MarcaRepository.findById(validId);
  }

  static async crearMarca(data: ICreateMarcaDTO): Promise<IMarca> {
    const nombreValidado = validateNominalText(
      data.marNombreMarca,
      'nombre de la marca',
      100
    );

    const activoValidado = validateBooleanFlag(data.marActivo, 'activo', 1);

    return await MarcaRepository.create({
      marNombreMarca: nombreValidado,
      marActivo: activoValidado,
    });
  }

  static async actualizarMarca(id: number, data: IUpdateMarcaDTO): Promise<IMarca> {
    const validId = validateNumericId(id, 'ID de la marca');
    const updatePayload: IUpdateMarcaDTO = {};

    if (data.marNombreMarca !== undefined) {
      updatePayload.marNombreMarca = validateNominalText(
        data.marNombreMarca,
        'nombre de la marca',
        100
      );
    }

    if (data.marActivo !== undefined) {
      updatePayload.marActivo = validateBooleanFlag(data.marActivo, 'activo', 1);
    }

    const updated = await MarcaRepository.update(validId, updatePayload);
    if (!updated) {
      throw new Error(`No se encontró la marca con ID ${validId}.`);
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
