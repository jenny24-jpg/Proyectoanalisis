import {
  IUbicacion,
  ICreateUbicacionDTO,
  IUpdateUbicacionDTO,
  IUbicacionFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/inventario/ubicaciones';

export class UbicacionClientService {
  static async getUbicaciones(filters: IUbicacionFilterParams = {}): Promise<IUbicacion[]> {
    const queryParams = new URLSearchParams();
    if (filters.codigo) queryParams.append('codigo', filters.codigo);
    if (filters.idBodega) queryParams.append('idBodega', String(filters.idBodega));
    if (filters.activo !== undefined) queryParams.append('activo', String(filters.activo));

    const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Error al obtener ubicaciones`);
    const resData = await response.json();
    return resData.data || [];
  }

  static async getUbicacionById(id: number): Promise<IUbicacion | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createUbicacion(data: ICreateUbicacionDTO): Promise<IUbicacion> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar ubicación');
    }
    const resData = await response.json();
    return resData.data;
  }

  static async updateUbicacion(id: number, data: IUpdateUbicacionDTO): Promise<IUbicacion> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar ubicación');
    }
    const resData = await response.json();
    return resData.data;
  }

  static async deleteUbicacion(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar ubicación');
    }
    const resData = await response.json();
    return resData.data || { deleted: true, deactivated: false, message: 'Ubicación eliminada exitosamente' };
  }
}
