import { UbicacionRepository } from '../repositories/ubicacion.repository.js';
import {
  IUbicacion,
  ICreateUbicacionDTO,
  IUpdateUbicacionDTO,
  IUbicacionFilterParams,
} from '@erp/contracts';
import {
  validateStrictCode,
  validateNumericId,
  validateBooleanFlag,
} from '../../../utils/sanitizers.js';

export class UbicacionService {
  static async obtenerUbicaciones(filters: IUbicacionFilterParams = {}): Promise<IUbicacion[]> {
    return await UbicacionRepository.findAll(filters);
  }

  static async obtenerPorId(id: number): Promise<IUbicacion | null> {
    const validId = validateNumericId(id, 'ID de la ubicación');
    return await UbicacionRepository.findById(validId);
  }

  static async crearUbicacion(data: ICreateUbicacionDTO): Promise<IUbicacion> {
    const bodegaId = validateNumericId(data.ubiIdBodega, 'bodega');
    const codigoValidado = validateStrictCode(data.ubiCodigoUbicacion, 'código de la ubicación', 30);

    const duplicado = await UbicacionRepository.findByCodigo(bodegaId, codigoValidado);
    if (duplicado) {
      throw new Error(`Ya existe una ubicación con el código "${codigoValidado}" en esta bodega.`);
    }

    const pasillo = data.ubiPasillo && data.ubiPasillo.trim() !== ''
      ? validateStrictCode(data.ubiPasillo, 'pasillo', 20)
      : null;
    const rack = data.ubiRack && data.ubiRack.trim() !== ''
      ? validateStrictCode(data.ubiRack, 'rack', 20)
      : null;
    const nivel = data.ubiNivel && data.ubiNivel.trim() !== ''
      ? validateStrictCode(data.ubiNivel, 'nivel', 20)
      : null;

    const activo = validateBooleanFlag(data.ubiActivo, 'activo', 1);

    return await UbicacionRepository.create({
      ubiIdBodega: bodegaId,
      ubiCodigoUbicacion: codigoValidado,
      ubiPasillo: pasillo,
      ubiRack: rack,
      ubiNivel: nivel,
      ubiActivo: activo,
    });
  }

  static async actualizarUbicacion(id: number, data: IUpdateUbicacionDTO): Promise<IUbicacion> {
    const validId = validateNumericId(id, 'ID de la ubicación');

    const actual = await UbicacionRepository.findById(validId);
    if (!actual) {
      throw new Error(`No se encontró la ubicación con ID ${validId}.`);
    }

    const updatePayload: IUpdateUbicacionDTO = {};

    if (data.ubiIdBodega !== undefined) {
      updatePayload.ubiIdBodega = validateNumericId(data.ubiIdBodega, 'bodega');
    }

    if (data.ubiCodigoUbicacion !== undefined) {
      const codigoValidado = validateStrictCode(data.ubiCodigoUbicacion, 'código de la ubicación', 30);
      const bodegaId = updatePayload.ubiIdBodega || actual.ubiIdBodega;
      const duplicado = await UbicacionRepository.findByCodigo(bodegaId, codigoValidado);
      if (duplicado && duplicado.ubiIdUbicacion !== validId) {
        throw new Error(`Ya existe otra ubicación con el código "${codigoValidado}" en esta bodega.`);
      }
      updatePayload.ubiCodigoUbicacion = codigoValidado;
    }

    if (data.ubiPasillo !== undefined) {
      updatePayload.ubiPasillo = data.ubiPasillo && data.ubiPasillo.trim() !== ''
        ? validateStrictCode(data.ubiPasillo, 'pasillo', 20)
        : null;
    }

    if (data.ubiRack !== undefined) {
      updatePayload.ubiRack = data.ubiRack && data.ubiRack.trim() !== ''
        ? validateStrictCode(data.ubiRack, 'rack', 20)
        : null;
    }

    if (data.ubiNivel !== undefined) {
      updatePayload.ubiNivel = data.ubiNivel && data.ubiNivel.trim() !== ''
        ? validateStrictCode(data.ubiNivel, 'nivel', 20)
        : null;
    }

    if (data.ubiActivo !== undefined) {
      updatePayload.ubiActivo = validateBooleanFlag(data.ubiActivo, 'activo', 1);
    }

    const updated = await UbicacionRepository.update(validId, updatePayload);
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
