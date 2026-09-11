import {
  IUnidadMedida,
  ICreateUnidadMedidaDTO,
  IUpdateUnidadMedidaDTO,
  IUnidadMedidaFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/compras/unidades-medida';

export class UnidadMedidaClientService {
  static async getUnidadesMedida(filters: IUnidadMedidaFilterParams = {}): Promise<IUnidadMedida[]> {
    const queryParams = new URLSearchParams();
    if (filters.nombre) queryParams.append('nombre', filters.nombre);
    if (filters.abreviatura) queryParams.append('abreviatura', filters.abreviatura);
    if (filters.activo !== undefined) queryParams.append('activo', String(filters.activo));

    const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener la lista de unidades de medida`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getUnidadMedidaById(id: number): Promise<IUnidadMedida | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createUnidadMedida(data: ICreateUnidadMedidaDTO): Promise<IUnidadMedida> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar la unidad de medida');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateUnidadMedida(id: number, data: IUpdateUnidadMedidaDTO): Promise<IUnidadMedida> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar la unidad de medida');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteUnidadMedida(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar la unidad de medida');
    }

    const resData = await response.json();
    return resData.data || { deleted: true, deactivated: false, message: 'Unidad de medida eliminada exitosamente' };
  }
}
