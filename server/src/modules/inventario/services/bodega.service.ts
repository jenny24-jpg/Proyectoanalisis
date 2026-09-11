import { BodegaRepository } from '../repositories/bodega.repository.js';
import {
  IBodega,
  ICreateBodegaDTO,
  IUpdateBodegaDTO,
  IBodegaFilterParams,
} from '@erp/contracts';

/**
 * Servicio de Negocio para el catálogo de Bodegas (CMP_BODEGA)
 */
export class BodegaService {
  static async obtenerBodegas(filters: IBodegaFilterParams = {}): Promise<IBodega[]> {
    return await BodegaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IBodega | null> {
    if (!id || id <= 0) {
      throw new Error('El ID de la bodega debe ser un número positivo.');
    }
    return await BodegaRepository.findById(id);
  }

  static async crearBodega(data: ICreateBodegaDTO): Promise<IBodega> {
    if (!data.bodCodigo || data.bodCodigo.trim() === '') {
      throw new Error('El código de la bodega es obligatorio.');
    }

    const codigoTrimmed = data.bodCodigo.trim().toUpperCase();
    if (codigoTrimmed.length > 20) {
      throw new Error('El código de la bodega no puede exceder 20 caracteres.');
    }

    if (!data.bodNombre || data.bodNombre.trim() === '') {
      throw new Error('El nombre de la bodega es obligatorio.');
    }

    const nombreTrimmed = data.bodNombre.trim();
    if (nombreTrimmed.length > 100) {
      throw new Error('El nombre de la bodega no puede exceder 100 caracteres.');
    }

    // Validación de unicidad de código
    const duplicado = await BodegaRepository.findByCodigo(codigoTrimmed);
    if (duplicado) {
      throw new Error(`Ya existe una bodega registrada con el código "${codigoTrimmed}".`);
    }

    if (data.bodDireccion && data.bodDireccion.trim().length > 250) {
      throw new Error('La dirección no puede exceder 250 caracteres.');
    }

    if (data.bodPermiteVentas !== undefined && ![0, 1].includes(data.bodPermiteVentas)) {
      throw new Error('El campo permite ventas solo admite valores 0 o 1.');
    }

    if (data.bodActivo !== undefined && ![0, 1].includes(data.bodActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    return await BodegaRepository.create({
      bodCodigo: codigoTrimmed,
      bodNombre: nombreTrimmed,
      bodIdSucursal: data.bodIdSucursal || 1,
      bodIdEncargado: data.bodIdEncargado || null,
      bodDireccion: data.bodDireccion ? data.bodDireccion.trim() : null,
      bodPermiteVentas: data.bodPermiteVentas !== undefined ? data.bodPermiteVentas : 1,
      bodActivo: data.bodActivo !== undefined ? data.bodActivo : 1,
    });
  }

  static async actualizarBodega(id: number, data: IUpdateBodegaDTO): Promise<IBodega> {
    if (!id || id <= 0) {
      throw new Error('El ID de la bodega debe ser un número positivo.');
    }

    if (data.bodCodigo !== undefined) {
      const codigoTrimmed = data.bodCodigo.trim().toUpperCase();
      if (codigoTrimmed === '') {
        throw new Error('El código de la bodega no puede estar vacío.');
      }
      if (codigoTrimmed.length > 20) {
        throw new Error('El código de la bodega no puede exceder 20 caracteres.');
      }

      const duplicado = await BodegaRepository.findByCodigo(codigoTrimmed);
      if (duplicado && duplicado.bodIdBodega !== id) {
        throw new Error(`Ya existe otra bodega registrada con el código "${codigoTrimmed}".`);
      }

      data.bodCodigo = codigoTrimmed;
    }

    if (data.bodNombre !== undefined) {
      const nombreTrimmed = data.bodNombre.trim();
      if (nombreTrimmed === '') {
        throw new Error('El nombre de la bodega no puede estar vacío.');
      }
      if (nombreTrimmed.length > 100) {
        throw new Error('El nombre de la bodega no puede exceder 100 caracteres.');
      }
      data.bodNombre = nombreTrimmed;
    }

    if (data.bodDireccion !== undefined && data.bodDireccion) {
      if (data.bodDireccion.trim().length > 250) {
        throw new Error('La dirección no puede exceder 250 caracteres.');
      }
      data.bodDireccion = data.bodDireccion.trim();
    }

    if (data.bodPermiteVentas !== undefined && ![0, 1].includes(data.bodPermiteVentas)) {
      throw new Error('El campo permite ventas solo admite valores 0 o 1.');
    }

    if (data.bodActivo !== undefined && ![0, 1].includes(data.bodActivo)) {
      throw new Error('El campo activo solo admite valores 0 o 1.');
    }

    const updated = await BodegaRepository.update(id, data);
    if (!updated) {
      throw new Error(`No se encontró la bodega con ID ${id}.`);
    }

    return updated;
  }

  static async eliminarBodega(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID de la bodega debe ser un número positivo.');
    }

    const result = await BodegaRepository.delete(id);
    if (result.deactivated) {
      return {
        ...result,
        message: 'La bodega posee existencias de inventario, movimientos o recepciones vinculadas, por lo que fue desactivada para proteger la integridad referencial.',
      };
    }

    return {
      ...result,
      message: 'Bodega eliminada exitosamente.',
    };
  }
}
