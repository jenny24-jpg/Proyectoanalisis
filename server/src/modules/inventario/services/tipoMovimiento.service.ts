import { TipoMovimientoRepository } from '../repositories/tipoMovimiento.repository.js';
import {
  ITipoMovimiento,
  ICreateTipoMovimientoDTO,
  IUpdateTipoMovimientoDTO,
  ITipoMovimientoFilterParams,
} from '@erp/contracts';
import {
  validateStrictCode,
  validateNominalText,
  validateBooleanFlag,
  validateNumericId,
  CODIGO_TIPO_MOVIMIENTO_REGEX,
} from '../../../utils/sanitizers.js';

export class TipoMovimientoService {
  static async obtenerTiposMovimiento(filters: ITipoMovimientoFilterParams = {}): Promise<ITipoMovimiento[]> {
    return await TipoMovimientoRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<ITipoMovimiento | null> {
    const validId = validateNumericId(id, 'ID del tipo de movimiento');
    return await TipoMovimientoRepository.findById(validId);
  }

  static async crearTipoMovimiento(data: ICreateTipoMovimientoDTO): Promise<ITipoMovimiento> {
    const codTrimmed = validateStrictCode(data.tmiCodigo, 'código del tipo de movimiento', 20);
    if (!CODIGO_TIPO_MOVIMIENTO_REGEX.test(codTrimmed)) {
      throw new Error('El código del tipo de movimiento solo permite mayúsculas, números y guiones bajos.');
    }

    const descTrimmed = validateNominalText(data.tmiDescripcion, 'descripción del tipo de movimiento', 100);

    if (!['+', '-'].includes(data.tmiNaturaleza)) {
      throw new Error('La naturaleza del movimiento debe ser "+" (Entrada) o "-" (Salida).');
    }

    const duplicado = await TipoMovimientoRepository.findByCodigo(codTrimmed);
    if (duplicado) {
      throw new Error(`Ya existe un tipo de movimiento registrado con el código "${codTrimmed}".`);
    }

    const afectaCosto = validateBooleanFlag(data.tmiAfectaCosto, 'afecta costo', 1);
    const activo = validateBooleanFlag(data.tmiActivo, 'activo', 1);

    return await TipoMovimientoRepository.create({
      tmiCodigo: codTrimmed,
      tmiDescripcion: descTrimmed,
      tmiNaturaleza: data.tmiNaturaleza,
      tmiAfectaCosto: afectaCosto,
      tmiActivo: activo,
    });
  }

  static async actualizarTipoMovimiento(id: number, data: IUpdateTipoMovimientoDTO): Promise<ITipoMovimiento> {
    const validId = validateNumericId(id, 'ID del tipo de movimiento');

    const actual = await TipoMovimientoRepository.findById(validId);
    if (!actual) {
      throw new Error(`No se encontró el tipo de movimiento con ID ${validId}.`);
    }

    const updatePayload: IUpdateTipoMovimientoDTO = {};

    if (data.tmiCodigo !== undefined) {
      const codTrimmed = validateStrictCode(data.tmiCodigo, 'código del tipo de movimiento', 20);
      if (!CODIGO_TIPO_MOVIMIENTO_REGEX.test(codTrimmed)) {
        throw new Error('El código del tipo de movimiento solo permite mayúsculas, números y guiones bajos.');
      }
      const duplicado = await TipoMovimientoRepository.findByCodigo(codTrimmed);
      if (duplicado && duplicado.tmiIdTipoMovimiento !== validId) {
        throw new Error(`Ya existe otro tipo de movimiento registrado con el código "${codTrimmed}".`);
      }
      updatePayload.tmiCodigo = codTrimmed;
    }

    if (data.tmiDescripcion !== undefined) {
      updatePayload.tmiDescripcion = validateNominalText(
        data.tmiDescripcion,
        'descripción del tipo de movimiento',
        100
      );
    }

    if (data.tmiNaturaleza !== undefined) {
      if (!['+', '-'].includes(data.tmiNaturaleza)) {
        throw new Error('La naturaleza debe ser "+" o "-".');
      }
      updatePayload.tmiNaturaleza = data.tmiNaturaleza;
    }

    if (data.tmiAfectaCosto !== undefined) {
      updatePayload.tmiAfectaCosto = validateBooleanFlag(data.tmiAfectaCosto, 'afecta costo', 1);
    }

    if (data.tmiActivo !== undefined) {
      updatePayload.tmiActivo = validateBooleanFlag(data.tmiActivo, 'activo', 1);
    }

    const updated = await TipoMovimientoRepository.update(validId, updatePayload);
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
