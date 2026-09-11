import {
  ISolicitudCompra,
  ISolicitudCompraFilterParams,
  ISolicitudCompraDetalle,
  ISolicitudCompraCompleta,
  IUpdateSolicitudCompraDTO,
  IAprobarSolicitudDTO,
  IRechazarSolicitudDTO,
} from '@erp/contracts';

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

  /**
   * Obtiene la solicitud de compra completa junto con sus detalles de artículos
   */
  static async getSolicitudCompleta(noDocumento: string): Promise<ISolicitudCompraCompleta | null> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noDocumento)}/completa`);
      if (!response.ok) return null;
      const resData = await response.json();
      return resData.data || null;
    } catch (error) {
      console.error('[SolicitudCompraClientService.getSolicitudCompleta Error]:', error);
      return null;
    }
  }

  /**
   * Obtiene las líneas de detalle de una solicitud
   */
  static async getDetalles(noDocumento: string): Promise<ISolicitudCompraDetalle[]> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noDocumento)}/detalles`);
      if (!response.ok) return [];
      const resData = await response.json();
      return Array.isArray(resData.data) ? resData.data : [];
    } catch (error) {
      console.error('[SolicitudCompraClientService.getDetalles Error]:', error);
      return [];
    }
  }

  /**
   * Actualiza notas y cantidades de una solicitud de compra
   */
  static async actualizarSolicitud(
    noDocumento: string,
    payload: IUpdateSolicitudCompraDTO
  ): Promise<ISolicitudCompraCompleta> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noDocumento)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Error al actualizar la solicitud de compra');
      }

      return resData.data;
    } catch (error) {
      console.error('[SolicitudCompraClientService.actualizarSolicitud Error]:', error);
      throw error;
    }
  }

  /**
   * Aprueba formalmente la solicitud en el backend
   */
  static async aprobarSolicitud(
    noDocumento: string,
    payload: IAprobarSolicitudDTO
  ): Promise<ISolicitudCompraCompleta> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noDocumento)}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Error al aprobar la solicitud de compra');
      }

      return resData.data;
    } catch (error) {
      console.error('[SolicitudCompraClientService.aprobarSolicitud Error]:', error);
      throw error;
    }
  }

  /**
   * Rechaza o niega la solicitud en el backend
   */
  static async rechazarSolicitud(
    noDocumento: string,
    payload: IRechazarSolicitudDTO
  ): Promise<ISolicitudCompraCompleta> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noDocumento)}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Error al rechazar la solicitud de compra');
      }

      return resData.data;
    } catch (error) {
      console.error('[SolicitudCompraClientService.rechazarSolicitud Error]:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva solicitud de compra en la base de datos Oracle
   */
  static async crearSolicitud(payload: import('@erp/contracts').ISolicitudCompraCreateDTO): Promise<ISolicitudCompra> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Error al crear la solicitud de compra');
      }

      return resData.data;
    } catch (error) {
      console.error('[SolicitudCompraClientService.crearSolicitud Error]:', error);
      throw error;
    }
  }
}

