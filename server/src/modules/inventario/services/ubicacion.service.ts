import { UbicacionRepository } from '../repositories/ubicacion.repository.js';
import {
  IUbicacion,
  ICreateUbicacionDTO,
  IUpdateUbicacionDTO,
  IUbicacionFilterParams,
} from '@erp/contracts';

export class UbicacionService {
  static async obtenerUbicaciones(filters: IUbicacionFilterParams = {}): Promise<IUbicacion[]> {
    return await UbicacionRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IUbicacion | null> {
    if (!id || id <= 0) {
      throw new Error('El ID de la ubicación debe ser un número positivo.');
    }
    return await UbicacionRepository.findById(id);
  }

  static async crearUbicacion(data: ICreateUbicacionDTO): Promise<IUbicacion> {
    if (!data.ubiIdBodega || data.ubiIdBodega <= 0) {
      throw new Error('Debe especificar una bodega válida para la ubicación.');
    }

    if (!data.ubiCodigoUbicacion || data.ubiCodigoUbicacion.trim() === '') {
      throw new Error('El código de la ubicación es obligatorio.');
    }

    const codigoTrimmed = data.ubiCodigoUbicacion.trim().toUpperCase();
    if (codigoTrimmed.length > 30) {
      throw new Error('El código de la ubicación no puede exceder 30 caracteres.');
    }

    const duplicado = await UbicacionRepository.findByCodigo(data.ubiIdBodega, codigoTrimmed);
    if (duplicado) {
      throw new Error(`Ya existe una ubicación con el código "${codigoTrimmed}" en esta bodega.`);
    }

    return await UbicacionRepository.create({
      ...data,
      ubiCodigoUbicacion: codigoTrimmed,
    });
  }

  static async actualizarUbicacion(id: number, data: IUpdateUbicacionDTO): Promise<IUbicacion> {
    if (!id || id <= 0) {
      throw new Error('El ID de la ubicación debe ser un número positivo.');
    }

    const actual = await UbicacionRepository.findById(id);
    if (!actual) {
      throw new Error(`No se encontró la ubicación con ID ${id}.`);
    }

    if (data.ubiCodigoUbicacion !== undefined) {
      const codigoTrimmed = data.ubiCodigoUbicacion.trim().toUpperCase();
      if (codigoTrimmed === '') throw new Error('El código no puede estar vacío.');
      if (codigoTrimmed.length > 30) throw new Error('El código no puede exceder 30 caracteres.');

      const bodegaId = data.ubiIdBodega || actual.ubiIdBodega;
      const duplicado = await UbicacionRepository.findByCodigo(bodegaId, codigoTrimmed);
      if (duplicado && duplicado.ubiIdUbicacion !== id) {
        throw new Error(`Ya existe otra ubicación con el código "${codigoTrimmed}" en esta bodega.`);
      }
      data.ubiCodigoUbicacion = codigoTrimmed;
    }

    const updated = await UbicacionRepository.update(id, data);
    return updated!;
  }

  static async eliminarUbicacion(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID de la ubicación debe ser un número positivo.');
    }
    const res = await UbicacionRepository.delete(id);
    if (res.deactivated) {
      return {
        ...res,
        message: 'La ubicación posee referencias en inventario o movimientos, por lo que fue desactivada.',
      };
    }
    return {
      ...res,
      message: 'Ubicación eliminada exitosamente.',
    };
  }
}
