import { SolicitudCompraRepository } from '../repositories/solicitudCompra.repository.js';
import { ISolicitudCompra, ISolicitudCompraFilterParams } from '@erp/contracts';

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
}
