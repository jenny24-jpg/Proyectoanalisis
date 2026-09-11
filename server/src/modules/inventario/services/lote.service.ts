import { LoteRepository } from '../repositories/lote.repository.js';
import {
  ILote,
  ICreateLoteDTO,
  IUpdateLoteDTO,
  ILoteFilterParams,
} from '@erp/contracts';

export class LoteService {
  static async obtenerLotes(filters: ILoteFilterParams = {}): Promise<ILote[]> {
    return await LoteRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<ILote | null> {
    if (!id || id <= 0) {
      throw new Error('El ID del lote debe ser un número positivo.');
    }
    return await LoteRepository.findById(id);
  }

  static async crearLote(data: ICreateLoteDTO): Promise<ILote> {
    if (!data.lotNumeroLote || data.lotNumeroLote.trim() === '') {
      throw new Error('El número de lote es obligatorio.');
    }
    if (!data.lotCodigoArticulo || data.lotCodigoArticulo.trim() === '') {
      throw new Error('El código del artículo es obligatorio para registrar un lote.');
    }

    const numTrimmed = data.lotNumeroLote.trim().toUpperCase();
    const artTrimmed = data.lotCodigoArticulo.trim().toUpperCase();

    if (numTrimmed.length > 50) {
      throw new Error('El número de lote no puede exceder 50 caracteres.');
    }

    const duplicado = await LoteRepository.findByNumero(artTrimmed, numTrimmed);
    if (duplicado) {
      throw new Error(`Ya existe un lote con el número "${numTrimmed}" para el artículo seleccionado.`);
    }

    return await LoteRepository.create({
      ...data,
      lotNumeroLote: numTrimmed,
      lotCodigoArticulo: artTrimmed,
      lotEstado: data.lotEstado || 'ACTIVO',
    });
  }

  static async actualizarLote(id: number, data: IUpdateLoteDTO): Promise<ILote> {
    if (!id || id <= 0) {
      throw new Error('El ID del lote debe ser un número positivo.');
    }

    const actual = await LoteRepository.findById(id);
    if (!actual) {
      throw new Error(`No se encontró el lote con ID ${id}.`);
    }

    if (data.lotNumeroLote !== undefined) {
      const numTrimmed = data.lotNumeroLote.trim().toUpperCase();
      if (numTrimmed === '') throw new Error('El número de lote no puede estar vacío.');
      if (numTrimmed.length > 50) throw new Error('El número de lote no puede exceder 50 caracteres.');

      const art = data.lotCodigoArticulo ? data.lotCodigoArticulo.trim().toUpperCase() : actual.lotCodigoArticulo;
      const duplicado = await LoteRepository.findByNumero(art, numTrimmed);
      if (duplicado && duplicado.lotIdLote !== id) {
        throw new Error(`Ya existe otro lote con el número "${numTrimmed}" para este artículo.`);
      }
      data.lotNumeroLote = numTrimmed;
    }

    const updated = await LoteRepository.update(id, data);
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
