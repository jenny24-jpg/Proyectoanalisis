import {
  IMarca,
  ICreateMarcaDTO,
  IUpdateMarcaDTO,
  IMarcaFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/inventario/marcas';

export class MarcaClientService {
  static async getMarcas(filters: IMarcaFilterParams = {}): Promise<IMarca[]> {
    const queryParams = new URLSearchParams();
    if (filters.nombre) queryParams.append('nombre', filters.nombre);
    if (filters.activo !== undefined) queryParams.append('activo', String(filters.activo));

    const url = `${API_BASE}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener marcas`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getMarcaById(id: number): Promise<IMarca | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createMarca(data: ICreateMarcaDTO): Promise<IMarca> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al crear la marca');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateMarca(id: number, data: IUpdateMarcaDTO): Promise<IMarca> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar la marca');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteMarca(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar la marca');
    }

    const resData = await response.json();
    return resData.data || { deleted: true, deactivated: false, message: 'Marca eliminada exitosamente' };
  }
}
