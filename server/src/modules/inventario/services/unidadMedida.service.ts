import { UnidadMedidaRepository } from '../repositories/unidadMedida.repository.js';
import {
  IUnidadMedida,
  ICreateUnidadMedidaDTO,
  IUpdateUnidadMedidaDTO,
  IUnidadMedidaFilterParams,
} from '@erp/contracts';

/**
 * Servicio de Negocio para el catálogo de Unidades de Medida (CMP_UNIDAD_MEDIDA)
 */
export class UnidadMedidaService {
  static async obtenerUnidadesMedida(filters: IUnidadMedidaFilterParams = {}): Promise<IUnidadMedida[]> {
    return await UnidadMedidaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IUnidadMedida | null> {
    if (!id || id <= 0) {
      throw new Error('El ID de la unidad de medida debe ser un número positivo.');
    }
    return await UnidadMedidaRepository.findById(id);
  }

  static async crearUnidadMedida(data: ICreateUnidadMedidaDTO): Promise<IUnidadMedida> {
    if (!data.umeNombreUnidad || data.umeNombreUnidad.trim() === '') {
      throw new Error('El nombre de la unidad de medida es obligatorio.');
    }

    const nombreTrimmed = data.umeNombreUnidad.trim();
    if (nombreTrimmed.length > 50) {
      throw new Error('El nombre de la unidad de medida no puede exceder 50 caracteres.');
    }

    if (!data.umeAbreviatura || data.umeAbreviatura.trim() === '') {
      throw new Error('La abreviatura de la unidad de medida es obligatoria.');
    }

    const abreviaturaTrimmed = data.umeAbreviatura.trim().toUpperCase();
    if (abreviaturaTrimmed.length > 10) {
      throw new Error('La abreviatura no puede exceder 10 caracteres.');
    }

    // Validación de unicidad de nombre
    const duplicado = await UnidadMedidaRepository.findByNombre(nombreTrimmed);
    if (duplicado) {
      throw new Error(`Ya existe una unidad de medida registrada con el nombre "${nombreTrimmed}".`);
    }

    if (data.umeActivo !== undefined && ![0, 1].includes(data.umeActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    return await UnidadMedidaRepository.create({
      umeNombreUnidad: nombreTrimmed,
      umeAbreviatura: abreviaturaTrimmed,
      umeActivo: data.umeActivo !== undefined ? data.umeActivo : 1,
    });
  }

  static async actualizarUnidadMedida(id: number, data: IUpdateUnidadMedidaDTO): Promise<IUnidadMedida> {
    if (!id || id <= 0) {
      throw new Error('El ID de la unidad de medida debe ser un número positivo.');
    }

    if (data.umeNombreUnidad !== undefined) {
      const nombreTrimmed = data.umeNombreUnidad.trim();
      if (nombreTrimmed === '') {
        throw new Error('El nombre de la unidad de medida no puede estar vacío.');
      }
      if (nombreTrimmed.length > 50) {
        throw new Error('El nombre de la unidad de medida no puede exceder 50 caracteres.');
      }

      const duplicado = await UnidadMedidaRepository.findByNombre(nombreTrimmed);
      if (duplicado && duplicado.umeIdUnidad !== id) {
        throw new Error(`Ya existe otra unidad de medida con el nombre "${nombreTrimmed}".`);
      }

      data.umeNombreUnidad = nombreTrimmed;
    }

    if (data.umeAbreviatura !== undefined) {
      const abreviaturaTrimmed = data.umeAbreviatura.trim().toUpperCase();
      if (abreviaturaTrimmed === '') {
        throw new Error('La abreviatura de la unidad de medida no puede estar vacía.');
      }
      if (abreviaturaTrimmed.length > 10) {
        throw new Error('La abreviatura no puede exceder 10 caracteres.');
      }
      data.umeAbreviatura = abreviaturaTrimmed;
    }

    if (data.umeActivo !== undefined && ![0, 1].includes(data.umeActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    const updated = await UnidadMedidaRepository.update(id, data);
    if (!updated) {
      throw new Error(`No se encontró la unidad de medida con ID ${id}.`);
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
