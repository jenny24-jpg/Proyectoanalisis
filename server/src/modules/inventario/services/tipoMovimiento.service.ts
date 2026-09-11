import { TipoMovimientoRepository } from '../repositories/tipoMovimiento.repository.js';
import {
  ITipoMovimiento,
  ICreateTipoMovimientoDTO,
  IUpdateTipoMovimientoDTO,
  ITipoMovimientoFilterParams,
} from '@erp/contracts';

export class TipoMovimientoService {
  static async obtenerTiposMovimiento(filters: ITipoMovimientoFilterParams = {}): Promise<ITipoMovimiento[]> {
    return await TipoMovimientoRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<ITipoMovimiento | null> {
    if (!id || id <= 0) {
      throw new Error('El ID del tipo de movimiento debe ser un número positivo.');
    }
    return await TipoMovimientoRepository.findById(id);
  }

  static async crearTipoMovimiento(data: ICreateTipoMovimientoDTO): Promise<ITipoMovimiento> {
    if (!data.tmiCodigo || data.tmiCodigo.trim() === '') {
      throw new Error('El código del tipo de movimiento es obligatorio.');
    }
    if (!data.tmiDescripcion || data.tmiDescripcion.trim() === '') {
      throw new Error('La descripción del tipo de movimiento es obligatoria.');
    }
    if (!['+', '-'].includes(data.tmiNaturaleza)) {
      throw new Error('La naturaleza del movimiento debe ser "+" (Entrada) o "-" (Salida).');
    }

    const codTrimmed = data.tmiCodigo.trim().toUpperCase();
    if (codTrimmed.length > 20) {
      throw new Error('El código no puede exceder 20 caracteres.');
    }

    const duplicado = await TipoMovimientoRepository.findByCodigo(codTrimmed);
    if (duplicado) {
      throw new Error(`Ya existe un tipo de movimiento registrado con el código "${codTrimmed}".`);
    }

    return await TipoMovimientoRepository.create({
      ...data,
      tmiCodigo: codTrimmed,
      tmiDescripcion: data.tmiDescripcion.trim(),
    });
  }

  static async actualizarTipoMovimiento(id: number, data: IUpdateTipoMovimientoDTO): Promise<ITipoMovimiento> {
    if (!id || id <= 0) {
      throw new Error('El ID del tipo de movimiento debe ser un número positivo.');
    }

    const actual = await TipoMovimientoRepository.findById(id);
    if (!actual) {
      throw new Error(`No se encontró el tipo de movimiento con ID ${id}.`);
    }

    if (data.tmiCodigo !== undefined) {
      const codTrimmed = data.tmiCodigo.trim().toUpperCase();
      if (codTrimmed === '') throw new Error('El código no puede estar vacío.');
      if (codTrimmed.length > 20) throw new Error('El código no puede exceder 20 caracteres.');

      const duplicado = await TipoMovimientoRepository.findByCodigo(codTrimmed);
      if (duplicado && duplicado.tmiIdTipoMovimiento !== id) {
        throw new Error(`Ya existe otro tipo de movimiento registrado con el código "${codTrimmed}".`);
      }
      data.tmiCodigo = codTrimmed;
    }

    if (data.tmiNaturaleza !== undefined && !['+', '-'].includes(data.tmiNaturaleza)) {
      throw new Error('La naturaleza debe ser "+" o "-".');
    }

    const updated = await TipoMovimientoRepository.update(id, data);
    return updated!;
  }

  static async eliminarTipoMovimiento(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    if (!id || id <= 0) {
      throw new Error('El ID del tipo de movimiento debe ser un número positivo.');
    }
    const res = await TipoMovimientoRepository.delete(id);
    if (res.deactivated) {
      return {
        ...res,
        message: 'El tipo de movimiento posee transacciones en el kardex, por lo que fue desactivado.',
      };
    }
    return {
      ...res,
      message: 'Tipo de movimiento eliminado exitosamente.',
    };
  }
}
