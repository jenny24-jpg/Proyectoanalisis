import { UnidadMedidaRepository } from '../repositories/unidadMedida.repository.js';
import {
  IUnidadMedida,
  ICreateUnidadMedidaDTO,
  IUpdateUnidadMedidaDTO,
  IUnidadMedidaFilterParams,
} from '@erp/contracts';
import {
  validateNominalText,
  validateBooleanFlag,
  validateNumericId,
  ABREVIATURA_UNIDAD_REGEX,
} from '../../../utils/sanitizers.js';

/**
 * Servicio de Negocio para el catálogo de Unidades de Medida (CMP_UNIDAD_MEDIDA)
 */
export class UnidadMedidaService {
  static async obtenerUnidadesMedida(filters: IUnidadMedidaFilterParams = {}): Promise<IUnidadMedida[]> {
    return await UnidadMedidaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IUnidadMedida | null> {
    const validId = validateNumericId(id, 'ID de la unidad de medida');
    return await UnidadMedidaRepository.findById(validId);
  }

  static async crearUnidadMedida(data: ICreateUnidadMedidaDTO): Promise<IUnidadMedida> {
    const nombreValidado = validateNominalText(
      data.umeNombreUnidad,
      'nombre de la unidad de medida',
      50
    );

    if (!data.umeAbreviatura || data.umeAbreviatura.trim() === '') {
      throw new Error('La abreviatura de la unidad de medida es obligatoria.');
    }

    const abreviaturaTrimmed = data.umeAbreviatura.trim().toUpperCase();
    if (abreviaturaTrimmed.length > 10) {
      throw new Error('La abreviatura no puede exceder 10 caracteres.');
    }

    if (!ABREVIATURA_UNIDAD_REGEX.test(abreviaturaTrimmed)) {
      throw new Error(
        'La abreviatura solo permite letras mayúsculas, números, punto o barra diagonal (ej. KG, M/S).'
      );
    }

    // Validación de unicidad de nombre
    const duplicado = await UnidadMedidaRepository.findByNombre(nombreValidado);
    if (duplicado) {
      throw new Error(`Ya existe una unidad de medida registrada con el nombre "${nombreValidado}".`);
    }

    const activoValidado = validateBooleanFlag(data.umeActivo, 'activo', 1);

    return await UnidadMedidaRepository.create({
      umeNombreUnidad: nombreValidado,
      umeAbreviatura: abreviaturaTrimmed,
      umeActivo: activoValidado,
    });
  }

  static async actualizarUnidadMedida(id: number, data: IUpdateUnidadMedidaDTO): Promise<IUnidadMedida> {
    const validId = validateNumericId(id, 'ID de la unidad de medida');
    const updatePayload: IUpdateUnidadMedidaDTO = {};

    if (data.umeNombreUnidad !== undefined) {
      const nombreValidado = validateNominalText(
        data.umeNombreUnidad,
        'nombre de la unidad de medida',
        50
      );

      const duplicado = await UnidadMedidaRepository.findByNombre(nombreValidado);
      if (duplicado && duplicado.umeIdUnidad !== validId) {
        throw new Error(`Ya existe otra unidad de medida con el nombre "${nombreValidado}".`);
      }

      updatePayload.umeNombreUnidad = nombreValidado;
    }

    if (data.umeAbreviatura !== undefined) {
      const abreviaturaTrimmed = data.umeAbreviatura.trim().toUpperCase();
      if (abreviaturaTrimmed === '') {
        throw new Error('La abreviatura de la unidad de medida no puede estar vacía.');
      }
      if (abreviaturaTrimmed.length > 10) {
        throw new Error('La abreviatura no puede exceder 10 caracteres.');
      }
      if (!ABREVIATURA_UNIDAD_REGEX.test(abreviaturaTrimmed)) {
        throw new Error(
          'La abreviatura solo permite letras mayúsculas, números, punto o barra diagonal (ej. KG, M/S).'
        );
      }
      updatePayload.umeAbreviatura = abreviaturaTrimmed;
    }

    if (data.umeActivo !== undefined) {
      updatePayload.umeActivo = validateBooleanFlag(data.umeActivo, 'activo', 1);
    }

    const updated = await UnidadMedidaRepository.update(validId, updatePayload);
    if (!updated) {
      throw new Error(`No se encontró la unidad de medida con ID ${validId}.`);
    }

    return updated;
  }

  static async eliminarUnidadMedida(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID de la unidad de medida debe ser un número positivo.');
    }

    const result = await UnidadMedidaRepository.delete(id);
    if (result.deactivated) {
      return {
        ...result,
        message: 'La unidad de medida tiene artículos de inventario asociados, por lo que fue desactivada para proteger la integridad referencial.',
      };
    }

    return {
      ...result,
      message: 'Unidad de medida eliminada exitosamente.',
    };
  }
}
