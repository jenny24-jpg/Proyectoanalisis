import {
  IBodega,
  ICreateBodegaDTO,
  IUpdateBodegaDTO,
  IBodegaFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/inventario/bodegas';

export class BodegaClientService {
  static async getBodegas(filters: IBodegaFilterParams = {}): Promise<IBodega[]> {
    const queryParams = new URLSearchParams();
    if (filters.nombre) queryParams.append('nombre', filters.nombre);
    if (filters.codigo) queryParams.append('codigo', filters.codigo);
    if (filters.activo !== undefined) queryParams.append('activo', String(filters.activo));

    const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener la lista de bodegas`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getBodegaById(id: number): Promise<IBodega | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createBodega(data: ICreateBodegaDTO): Promise<IBodega> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar la bodega');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateBodega(id: number, data: IUpdateBodegaDTO): Promise<IBodega> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar la bodega');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteBodega(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar la bodega');
    }

    const resData = await response.json();
    return resData.data || { deleted: true, deactivated: false, message: 'Bodega eliminada exitosamente' };
  }
}
