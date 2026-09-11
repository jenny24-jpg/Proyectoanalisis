import {
  IEstado,
  ICreateEstadoDTO,
  IUpdateEstadoDTO,
  IEstadoFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/compras/estados';

export class EstadoClientService {
  static async getEstados(filters: IEstadoFilterParams = {}): Promise<IEstado[]> {
    const queryParams = new URLSearchParams();
    if (filters.nombre) queryParams.append('nombre', filters.nombre);

    const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener la lista de estados`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getEstadoById(id: number): Promise<IEstado | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createEstado(data: ICreateEstadoDTO): Promise<IEstado> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar el estado');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateEstado(id: number, data: IUpdateEstadoDTO): Promise<IEstado> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar el estado');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteEstado(id: number): Promise<{ deleted: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar el estado');
    }

    const resData = await response.json();
    return resData.data || { deleted: true, message: 'Estado eliminado exitosamente' };
  }
}
