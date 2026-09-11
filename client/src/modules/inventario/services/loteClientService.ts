import {
  ILote,
  ICreateLoteDTO,
  IUpdateLoteDTO,
  ILoteFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/inventario/lotes';

export class LoteClientService {
  static async getLotes(filters: ILoteFilterParams = {}): Promise<ILote[]> {
    const queryParams = new URLSearchParams();
    if (filters.numeroLote) queryParams.append('numeroLote', filters.numeroLote);
    if (filters.codigoArticulo) queryParams.append('codigoArticulo', filters.codigoArticulo);
    if (filters.estado) queryParams.append('estado', filters.estado);

    const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Error al obtener lotes`);
    const resData = await response.json();
    return resData.data || [];
  }

  static async getLoteById(id: number): Promise<ILote | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createLote(data: ICreateLoteDTO): Promise<ILote> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar lote');
    }
    const resData = await response.json();
    return resData.data;
  }

  static async updateLote(id: number, data: IUpdateLoteDTO): Promise<ILote> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar lote');
    }
    const resData = await response.json();
    return resData.data;
  }

  static async deleteLote(id: number): Promise<{ deleted: boolean; blocked: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar lote');
    }
    const resData = await response.json();
    return resData.data || { deleted: true, blocked: false, message: 'Lote eliminado exitosamente' };
  }
}
