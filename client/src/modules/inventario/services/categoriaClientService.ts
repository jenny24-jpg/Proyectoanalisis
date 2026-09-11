import {
  ICategoria,
  ICreateCategoriaDTO,
  IUpdateCategoriaDTO,
  ICategoriaFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/inventario/categorias';

export class CategoriaClientService {
  static async getCategorias(filters: ICategoriaFilterParams = {}): Promise<ICategoria[]> {
    const queryParams = new URLSearchParams();
    if (filters.nombre) queryParams.append('nombre', filters.nombre);
    if (filters.activo !== undefined) queryParams.append('activo', String(filters.activo));

    const url = `${API_BASE}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener categorías`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getCategoriaById(id: number): Promise<ICategoria | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createCategoria(data: ICreateCategoriaDTO): Promise<ICategoria> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al crear la categoría');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateCategoria(id: number, data: IUpdateCategoriaDTO): Promise<ICategoria> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar la categoría');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteCategoria(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar la categoría');
    }

    const resData = await response.json();
    return resData.data || { deleted: true, deactivated: false, message: 'Categoría eliminada exitosamente' };
  }
}
