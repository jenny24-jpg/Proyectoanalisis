import { SolicitudCompraRepository } from '../repositories/solicitudCompra.repository.js';
import {
  ISolicitudCompra,
  ISolicitudCompraFilterParams,
  ISolicitudCompraDetalle,
  ISolicitudCompraCompleta,
  IUpdateSolicitudCompraDTO,
  IAprobarSolicitudDTO,
  IRechazarSolicitudDTO,
} from '@erp/contracts';

export class SolicitudCompraService {
  static async obtenerSolicitudes(filters: ISolicitudCompraFilterParams = {}): Promise<ISolicitudCompra[]> {
    return await SolicitudCompraRepository.findAll(filters);
  }

  static async obtenerSolicitudPorNoDocumento(noDocumento: string): Promise<ISolicitudCompra | null> {
    if (!noDocumento || noDocumento.trim() === '') {
      throw new Error('El número de documento es obligatorio.');
    }
    return await SolicitudCompraRepository.findByNoDocumento(noDocumento);
  }

  static async obtenerSolicitudCompleta(noDocumento: string): Promise<ISolicitudCompraCompleta | null> {
    if (!noDocumento || noDocumento.trim() === '') {
      throw new Error('El número de documento es obligatorio.');
    }
    return await SolicitudCompraRepository.findByNoDocumentoCompleto(noDocumento.trim());
  }

  static async obtenerDetalles(noDocumento: string): Promise<ISolicitudCompraDetalle[]> {
    if (!noDocumento || noDocumento.trim() === '') {
      throw new Error('El número de documento es obligatorio.');
    }
    return await SolicitudCompraRepository.findDetallesByNoDocumento(noDocumento.trim());
  }

  static async actualizarSolicitud(
    noDocumento: string,
    data: IUpdateSolicitudCompraDTO
  ): Promise<ISolicitudCompraCompleta> {
    const existing = await this.obtenerSolicitudPorNoDocumento(noDocumento);
    if (!existing) {
      throw new Error(`La solicitud de compra ${noDocumento} no existe.`);
    }

    if (data.detalles && data.detalles.length > 0) {
      for (const det of data.detalles) {
        if (det.cantidadAprobada < 0) {
          throw new Error(`La cantidad aprobada no puede ser menor a 0 (Detalle #${det.idDetalle}).`);
        }
      }
    }

    return await SolicitudCompraRepository.update(noDocumento.trim(), data);
  }

  static async aprobarSolicitud(
    noDocumento: string,
    dto: IAprobarSolicitudDTO
  ): Promise<ISolicitudCompraCompleta> {
    const existing = await this.obtenerSolicitudPorNoDocumento(noDocumento);
    if (!existing) {
      throw new Error(`La solicitud de compra ${noDocumento} no existe.`);
    }

    const detalles = await this.obtenerDetalles(noDocumento);
    if (detalles.length === 0) {
      throw new Error(`La solicitud ${noDocumento} no contiene artículos para aprobar.`);
    }

    if (dto.detalles && dto.detalles.length > 0) {
      const algunAprobado = dto.detalles.some((d) => d.cantidadAprobada > 0);
      if (!algunAprobado) {
        throw new Error('Debe aprobar al menos 1 unidad en algún artículo de la solicitud.');
      }
      for (const d of dto.detalles) {
        if (d.cantidadAprobada < 0) {
          throw new Error('Las cantidades aprobadas no pueden ser negativas.');
        }
      }
    }

    return await SolicitudCompraRepository.aprobar(noDocumento.trim(), dto);
  }

  static async rechazarSolicitud(
    noDocumento: string,
    dto: IRechazarSolicitudDTO
  ): Promise<ISolicitudCompraCompleta> {
    const existing = await this.obtenerSolicitudPorNoDocumento(noDocumento);
    if (!existing) {
      throw new Error(`La solicitud de compra ${noDocumento} no existe.`);
    }

    if (!dto.motivoRechazo || dto.motivoRechazo.trim() === '') {
      throw new Error('Debe proporcionar un motivo de rechazo o denegación.');
    }

    return await SolicitudCompraRepository.rechazar(noDocumento.trim(), dto);
  }

  static async crearSolicitud(data: import('@erp/contracts').ISolicitudCompraCreateDTO): Promise<ISolicitudCompra> {
    if (!data.detalles || data.detalles.length === 0) {
      throw new Error('La solicitud debe tener al menos un detalle.');
    }

    // Para efectos de prueba sin secuencia PL/SQL conocida: generar ID alfanumérico basado en timestamp/random
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const noDocumento = `SOL-2026-${randomSuffix}`;

    await SolicitudCompraRepository.create(data, noDocumento);

    // Recuperar la solicitud recién creada para devolverla completa
    const solicitudCreada = await this.obtenerSolicitudPorNoDocumento(noDocumento);
    if (!solicitudCreada) {
      throw new Error('Error al recuperar la solicitud creada de la base de datos.');
    }
    
    return solicitudCreada;
  }
}

