import { OrdenCompraRepository } from '../repositories/ordenCompra.repository.js';
import {
  IOrdenCompra,
  IOrdenCompraCompleta,
  IAutorizarPresupuestoDTO,
  IRechazarPresupuestoDTO,
  IOrdenCompraFilterParams,
} from '@erp/contracts';

export class OrdenCompraService {
  static async obtenerOrdenesCompra(filters: IOrdenCompraFilterParams = {}): Promise<IOrdenCompra[]> {
    return await OrdenCompraRepository.findAll(filters);
  }

  static async obtenerPorNoPo(noPo: string): Promise<IOrdenCompraCompleta | null> {
    if (!noPo || noPo.trim() === '') {
      throw new Error('El número de orden de compra (PO) es obligatorio.');
    }
    return await OrdenCompraRepository.findByNoPo(noPo.trim());
  }

  static async obtenerPorSolicitud(noDocumento: string): Promise<IOrdenCompraCompleta | null> {
    if (!noDocumento || noDocumento.trim() === '') {
      throw new Error('El número de documento de solicitud es obligatorio.');
    }
    return await OrdenCompraRepository.findBySolicitud(noDocumento.trim());
  }

  static async autorizarPresupuesto(dto: IAutorizarPresupuestoDTO): Promise<IOrdenCompraCompleta> {
    if (!dto.noDocumento || dto.noDocumento.trim() === '') {
      throw new Error('El número de solicitud es requerido para autorizar el presupuesto.');
    }
    if (!dto.idCotizacionGanadora) {
      throw new Error('Se requiere el ID de la cotización adjudicada/ganadora.');
    }

    return await OrdenCompraRepository.autorizarPresupuesto(dto);
  }

  static async rechazarPresupuesto(dto: IRechazarPresupuestoDTO): Promise<boolean> {
    if (!dto.noDocumento || dto.noDocumento.trim() === '') {
      throw new Error('El número de solicitud es requerido para registrar el rechazo de presupuesto.');
    }
    if (!dto.motivoRechazo || dto.motivoRechazo.trim() === '') {
      throw new Error('Debe especificar el motivo o justificación del rechazo/ajuste presupuestario.');
    }

    return await OrdenCompraRepository.rechazarPresupuesto(dto);
  }
}
