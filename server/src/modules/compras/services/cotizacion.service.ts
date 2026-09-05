import { CotizacionRepository } from '../repositories/cotizacion.repository.js';
import {
  ICotizacion,
  ICreateCotizacionDTO,
  IUpdateCotizacionDTO,
  ICotizacionFilterParams,
  IProveedor,
  ISaveMatrizCotizacionesDTO,
} from '@erp/contracts';

export class CotizacionService {
  static async obtenerCotizaciones(filters: ICotizacionFilterParams = {}): Promise<ICotizacion[]> {
    return await CotizacionRepository.findAll(filters);
  }

  static async obtenerCotizacionPorId(id: number, includePdf: boolean = false): Promise<ICotizacion | null> {
    if (!id || id <= 0) {
      throw new Error('El ID de la cotización debe ser un entero positivo.');
    }
    return await CotizacionRepository.findById(id, includePdf);
  }

  static async obtenerProveedoresActivos(): Promise<IProveedor[]> {
    return await CotizacionRepository.findProveedoresActivos();
  }

  static async crearCotizacion(data: ICreateCotizacionDTO): Promise<ICotizacion> {
    if (!data.cotNoDocumentoSolicitud || data.cotNoDocumentoSolicitud.trim() === '') {
      throw new Error('El número de documento de la solicitud es obligatorio.');
    }

    if (!data.cotIdProveedor || data.cotIdProveedor <= 0) {
      throw new Error('El ID del proveedor es obligatorio y debe ser mayor a 0.');
    }

    if (data.cotPrecioTotal === undefined || data.cotPrecioTotal === null || data.cotPrecioTotal < 0) {
      throw new Error('El precio total de la cotización debe ser mayor o igual a 0.');
    }

    if (data.cotEsExcepcionUnico !== undefined && ![0, 1].includes(data.cotEsExcepcionUnico)) {
      throw new Error('El campo cotEsExcepcionUnico sólo admite los valores 0 o 1.');
    }

    const estadosValidos = ['PENDIENTE', 'GANADORA', 'RECHAZADA', 'ADJUDICADA'];
    if (data.cotEstadoAdjudicacion && !estadosValidos.includes(data.cotEstadoAdjudicacion.toUpperCase())) {
      throw new Error(`El estado de adjudicación es inválido. Valores permitidos: ${estadosValidos.join(', ')}`);
    }

    return await CotizacionRepository.create({
      ...data,
      cotEsExcepcionUnico: data.cotEsExcepcionUnico ?? 0,
      cotEstadoAdjudicacion: (data.cotEstadoAdjudicacion || 'PENDIENTE').toUpperCase(),
    });
  }

  static async actualizarCotizacion(id: number, data: IUpdateCotizacionDTO): Promise<ICotizacion> {
    if (!id || id <= 0) {
      throw new Error('El ID de la cotización debe ser un entero positivo.');
    }

    if (data.cotIdProveedor !== undefined && data.cotIdProveedor <= 0) {
      throw new Error('El ID del proveedor debe ser mayor a 0.');
    }

    if (data.cotPrecioTotal !== undefined && data.cotPrecioTotal < 0) {
      throw new Error('El precio total de la cotización debe ser mayor o igual a 0.');
    }

    if (data.cotEsExcepcionUnico !== undefined && ![0, 1].includes(data.cotEsExcepcionUnico)) {
      throw new Error('El campo cotEsExcepcionUnico sólo admite los valores 0 o 1.');
    }

    const estadosValidos = ['PENDIENTE', 'GANADORA', 'RECHAZADA', 'ADJUDICADA'];
    if (data.cotEstadoAdjudicacion && !estadosValidos.includes(data.cotEstadoAdjudicacion.toUpperCase())) {
      throw new Error(`El estado de adjudicación es inválido. Valores permitidos: ${estadosValidos.join(', ')}`);
    }

    const updated = await CotizacionRepository.update(id, {
      ...data,
      cotEstadoAdjudicacion: data.cotEstadoAdjudicacion ? data.cotEstadoAdjudicacion.toUpperCase() : undefined,
    });

    if (!updated) {
      throw new Error(`No se encontró la cotización con ID ${id}.`);
    }

    return updated;
  }

  static async eliminarCotizacion(id: number): Promise<boolean> {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error('El ID de la cotización debe ser un entero positivo.');
    }

    await CotizacionRepository.delete(id);
    return true;
  }

  static async guardarMatriz(dto: ISaveMatrizCotizacionesDTO): Promise<ICotizacion[]> {
    if (!dto.noSolicitud || dto.noSolicitud.trim() === '') {
      throw new Error('El número de documento de la solicitud es obligatorio.');
    }

    if ((!dto.cotizaciones || dto.cotizaciones.length === 0) && (!dto.eliminarCotizacionIds || dto.eliminarCotizacionIds.length === 0)) {
      throw new Error('Debe proporcionar al menos una cotización para procesar.');
    }

    for (const item of (dto.cotizaciones || [])) {
      if (!item.idProveedor || item.idProveedor <= 0) {
        throw new Error('Cada cotización debe tener un proveedor válido.');
      }
      if (item.precioTotal === undefined || item.precioTotal === null || item.precioTotal < 0) {
        throw new Error('El precio total de cada cotización debe ser mayor o igual a 0.');
      }
    }

    return await CotizacionRepository.saveMatriz(dto);
  }
}
