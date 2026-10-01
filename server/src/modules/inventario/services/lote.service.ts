import { LoteRepository } from '../repositories/lote.repository.js';
import {
  ILote,
  ICreateLoteDTO,
  IUpdateLoteDTO,
  ILoteFilterParams,
  EstadoLoteType,
} from '@erp/contracts';
import {
  validateStrictCode,
  validateDateString,
  validateLotDates,
  validateNumericId,
} from '../../../utils/sanitizers.js';

const ESTADOS_LOTE_VALIDOS: EstadoLoteType[] = ['ACTIVO', 'VENCIDO', 'BLOQUEADO', 'AGOTADO'];

export class LoteService {
  static async obtenerLotes(filters: ILoteFilterParams = {}): Promise<ILote[]> {
    return await LoteRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<ILote | null> {
    const validId = validateNumericId(id, 'ID del lote');
    return await LoteRepository.findById(validId);
  }

  static async crearLote(data: ICreateLoteDTO): Promise<ILote> {
    const numTrimmed = validateStrictCode(data.lotNumeroLote, 'número de lote', 50);
    const artTrimmed = validateStrictCode(data.lotCodigoArticulo, 'código del artículo', 30);

    const fechaProd = validateDateString(data.lotFechaProduccion, 'fecha de producción');
    const fechaVenc = validateDateString(data.lotFechaVencimiento, 'fecha de vencimiento');
    validateLotDates(fechaProd, fechaVenc);

    const estadoLote: EstadoLoteType = data.lotEstado ? data.lotEstado : 'ACTIVO';
    if (!ESTADOS_LOTE_VALIDOS.includes(estadoLote)) {
      throw new Error(`El estado del lote debe ser uno de: ${ESTADOS_LOTE_VALIDOS.join(', ')}.`);
    }

    const duplicado = await LoteRepository.findByNumero(artTrimmed, numTrimmed);
    if (duplicado) {
      throw new Error(`Ya existe un lote con el número "${numTrimmed}" para el artículo seleccionado.`);
    }

    return await LoteRepository.create({
      lotNumeroLote: numTrimmed,
      lotCodigoArticulo: artTrimmed,
      lotFechaProduccion: fechaProd,
      lotFechaVencimiento: fechaVenc,
      lotEstado: estadoLote,
    });
  }

  static async actualizarLote(id: number, data: IUpdateLoteDTO): Promise<ILote> {
    const validId = validateNumericId(id, 'ID del lote');

    const actual = await LoteRepository.findById(validId);
    if (!actual) {
      throw new Error(`No se encontró el lote con ID ${validId}.`);
    }

    const updatePayload: IUpdateLoteDTO = {};

    let art = actual.lotCodigoArticulo;
    if (data.lotCodigoArticulo !== undefined) {
      art = validateStrictCode(data.lotCodigoArticulo, 'código del artículo', 30);
      updatePayload.lotCodigoArticulo = art;
    }

    if (data.lotNumeroLote !== undefined) {
      const numTrimmed = validateStrictCode(data.lotNumeroLote, 'número de lote', 50);
      const duplicado = await LoteRepository.findByNumero(art, numTrimmed);
      if (duplicado && duplicado.lotIdLote !== validId) {
        throw new Error(`Ya existe otro lote con el número "${numTrimmed}" para este artículo.`);
      }
      updatePayload.lotNumeroLote = numTrimmed;
    }

    if (data.lotFechaProduccion !== undefined) {
      updatePayload.lotFechaProduccion = validateDateString(data.lotFechaProduccion, 'fecha de producción');
    }

    if (data.lotFechaVencimiento !== undefined) {
      updatePayload.lotFechaVencimiento = validateDateString(data.lotFechaVencimiento, 'fecha de vencimiento');
    }

    const finalFechaProd = updatePayload.lotFechaProduccion !== undefined
      ? updatePayload.lotFechaProduccion
      : actual.lotFechaProduccion;
    const finalFechaVenc = updatePayload.lotFechaVencimiento !== undefined
      ? updatePayload.lotFechaVencimiento
      : actual.lotFechaVencimiento;

    const prodStr = finalFechaProd instanceof Date
      ? finalFechaProd.toISOString().slice(0, 10)
      : (finalFechaProd ? String(finalFechaProd).slice(0, 10) : null);
    const vencStr = finalFechaVenc instanceof Date
      ? finalFechaVenc.toISOString().slice(0, 10)
      : (finalFechaVenc ? String(finalFechaVenc).slice(0, 10) : null);

    validateLotDates(prodStr, vencStr);

    if (data.lotEstado !== undefined) {
      if (!ESTADOS_LOTE_VALIDOS.includes(data.lotEstado)) {
        throw new Error(`El estado del lote debe ser uno de: ${ESTADOS_LOTE_VALIDOS.join(', ')}.`);
      }
      updatePayload.lotEstado = data.lotEstado;
    }

    const updated = await LoteRepository.update(validId, updatePayload);
    return updated!;
  }

  static async eliminarLote(id: number): Promise<{ deleted: boolean; blocked: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID del lote debe ser un número positivo.');
    }
    const res = await LoteRepository.delete(id);
    if (res.blocked) {
      return {
        ...res,
        message: 'El lote posee movimientos o registros en inventario, por lo que fue cambiado a estado BLOQUEADO.',
      };
    }
    return {
      ...res,
      message: 'Lote eliminado exitosamente.',
    };
  }
}
