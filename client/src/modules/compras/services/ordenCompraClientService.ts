import {
  IOrdenCompra,
  IOrdenCompraCompleta,
  IAutorizarPresupuestoDTO,
  IRechazarPresupuestoDTO,
  IOrdenCompraFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/compras/ordenes-compra';

export class OrdenCompraClientService {
  /**
   * Obtiene la lista de órdenes de compra con filtros opcionales
   */
  static async getOrdenesCompra(filters: IOrdenCompraFilterParams = {}): Promise<IOrdenCompra[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.noPo) queryParams.append('noPo', filters.noPo);
      if (filters.noDocumentoSolicitud) queryParams.append('noDocumentoSolicitud', filters.noDocumentoSolicitud);
      if (filters.idEstado) queryParams.append('idEstado', String(filters.idEstado));

      const url = `${API_BASE}?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al obtener órdenes de compra`);
      }

      const resData = await response.json();
      return resData.data || [];
    } catch (error) {
      console.error('[OrdenCompraClientService.getOrdenesCompra Error]:', error);
      throw error;
    }
  }

  /**
   * Obtiene una orden de compra por su número de PO
   */
  static async getOrdenCompraPorNoPo(noPo: string): Promise<IOrdenCompraCompleta | null> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noPo)}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al consultar la orden de compra ${noPo}`);
      }

      const resData = await response.json();
      return resData.data;
    } catch (error) {
      console.error(`[OrdenCompraClientService.getOrdenCompraPorNoPo Error ${noPo}]:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la orden de compra generada para una solicitud de compra
   */
  static async getOrdenCompraPorSolicitud(noDocumento: string): Promise<IOrdenCompraCompleta | null> {
    try {
      const response = await fetch(`${API_BASE}/solicitud/${encodeURIComponent(noDocumento)}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al consultar orden de compra para la solicitud ${noDocumento}`);
      }

      const resData = await response.json();
      return resData.data;
    } catch (error) {
      console.error(`[OrdenCompraClientService.getOrdenCompraPorSolicitud Error ${noDocumento}]:`, error);
      throw error;
    }
  }

  /**
   * Valida y autoriza el presupuesto para una solicitud de compra adjudicada,
   * emitiendo la Orden de Compra (PO) y avanzando la solicitud al paso de Bodega.
   */
  static async autorizarPresupuesto(dto: IAutorizarPresupuestoDTO): Promise<IOrdenCompraCompleta> {
    try {
      const response = await fetch(`${API_BASE}/autorizar-presupuesto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || `HTTP ${response.status}: Error al autorizar presupuesto`);
      }

      return resData.data;
    } catch (error) {
      console.error('[OrdenCompraClientService.autorizarPresupuesto Error]:', error);
      throw error;
    }
  }

  /**
   * Rechaza o devuelve la solicitud en etapa presupuestaria para ajuste de partidas o montos
   */
  static async rechazarPresupuesto(dto: IRechazarPresupuestoDTO): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/rechazar-presupuesto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || `HTTP ${response.status}: Error al rechazar presupuesto`);
      }

      return true;
    } catch (error) {
      console.error('[OrdenCompraClientService.rechazarPresupuesto Error]:', error);
      throw error;
    }
  }
}
