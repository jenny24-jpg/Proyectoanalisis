import { ISolicitudCompra, ISolicitudCompraFilterParams } from '@erp/contracts';

const API_BASE = '/api/compras/solicitudes';

export class SolicitudCompraClientService {
  /**
   * Obtiene la lista de solicitudes de compra desde la base de datos Oracle
   */
  static async getSolicitudes(filters: ISolicitudCompraFilterParams = {}): Promise<ISolicitudCompra[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.noDocumento) queryParams.append('noDocumento', filters.noDocumento);
      if (filters.idDepartamento) queryParams.append('idDepartamento', String(filters.idDepartamento));
      if (filters.idEstado) queryParams.append('idEstado', String(filters.idEstado));

      const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al consultar las solicitudes en la base de datos`);
      }

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        return resData.data;
      }
      return [];
    } catch (error) {
      console.error('[SolicitudCompraClientService.getSolicitudes Error]:', error);
      throw error;
    }
  }

  /**
   * Obtiene una solicitud de compra por su número de documento desde la base de datos Oracle
   */
  static async getSolicitudByNoDocumento(noDocumento: string): Promise<ISolicitudCompra | null> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noDocumento)}`);
      if (!response.ok) return null;
      const resData = await response.json();
      return resData.data || null;
    } catch (error) {
      console.error('[SolicitudCompraClientService.getSolicitudByNoDocumento Error]:', error);
      return null;
    }
  }
}
