import { BodegaRepository } from '../repositories/bodega.repository.js';
import {
  IBodega,
  ICreateBodegaDTO,
  IUpdateBodegaDTO,
  IBodegaFilterParams,
} from '@erp/contracts';
import {
  validateStrictCode,
  validateNominalText,
  validateAddressOrNotes,
  validateBooleanFlag,
  validateNumericId,
} from '../../../utils/sanitizers.js';

/**
 * Servicio de Negocio para el catálogo de Bodegas (CMP_BODEGA)
 */
export class BodegaService {
  static async obtenerBodegas(filters: IBodegaFilterParams = {}): Promise<IBodega[]> {
    return await BodegaRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IBodega | null> {
    const validId = validateNumericId(id, 'ID de la bodega');
    return await BodegaRepository.findById(validId);
  }

  static async crearBodega(data: ICreateBodegaDTO): Promise<IBodega> {
    const codigoValidado = validateStrictCode(data.bodCodigo, 'código de la bodega', 20);
    const nombreValidado = validateNominalText(data.bodNombre, 'nombre de la bodega', 100);

    // Validación de unicidad de código
    const duplicado = await BodegaRepository.findByCodigo(codigoValidado);
    if (duplicado) {
      throw new Error(`Ya existe una bodega registrada con el código "${codigoValidado}".`);
    }

    const direccionValidada = validateAddressOrNotes(
      data.bodDireccion,
      'dirección de la bodega',
      250
    );

    const permiteVentas = validateBooleanFlag(data.bodPermiteVentas, 'permite ventas', 1);
    const activo = validateBooleanFlag(data.bodActivo, 'activo', 1);

    return await BodegaRepository.create({
      bodCodigo: codigoValidado,
      bodNombre: nombreValidado,
      bodIdSucursal: data.bodIdSucursal || 1,
      bodIdEncargado: data.bodIdEncargado || null,
      bodDireccion: direccionValidada,
      bodPermiteVentas: permiteVentas,
      bodActivo: activo,
    });
  }

  static async actualizarBodega(id: number, data: IUpdateBodegaDTO): Promise<IBodega> {
    const validId = validateNumericId(id, 'ID de la bodega');
    const updatePayload: IUpdateBodegaDTO = {};

    if (data.bodCodigo !== undefined) {
      const codigoValidado = validateStrictCode(data.bodCodigo, 'código de la bodega', 20);
      const duplicado = await BodegaRepository.findByCodigo(codigoValidado);
      if (duplicado && duplicado.bodIdBodega !== validId) {
        throw new Error(`Ya existe otra bodega registrada con el código "${codigoValidado}".`);
      }
      updatePayload.bodCodigo = codigoValidado;
    }

    if (data.bodNombre !== undefined) {
      updatePayload.bodNombre = validateNominalText(data.bodNombre, 'nombre de la bodega', 100);
    }

    if (data.bodDireccion !== undefined) {
      updatePayload.bodDireccion = validateAddressOrNotes(
        data.bodDireccion,
        'dirección de la bodega',
        250
      );
    }

    if (data.bodPermiteVentas !== undefined) {
      updatePayload.bodPermiteVentas = validateBooleanFlag(
        data.bodPermiteVentas,
        'permite ventas',
        1
      );
    }

    if (data.bodActivo !== undefined) {
      updatePayload.bodActivo = validateBooleanFlag(data.bodActivo, 'activo', 1);
    }

    const updated = await BodegaRepository.update(validId, updatePayload);
    if (!updated) {
      throw new Error(`No se encontró la bodega con ID ${validId}.`);
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
