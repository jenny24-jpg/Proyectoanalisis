import {
  IProveedor,
  ICreateProveedorDTO,
  IUpdateProveedorDTO,
  IProveedorFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/compras/proveedores';

export class ProveedorClientService {
  static async getProveedores(filters: IProveedorFilterParams = {}): Promise<IProveedor[]> {
    const queryParams = new URLSearchParams();
    if (filters.nombre) queryParams.append('nombre', filters.nombre);
    if (filters.nit) queryParams.append('nit', filters.nit);
    if (filters.activo !== undefined) queryParams.append('activo', String(filters.activo));

    const url = `${API_BASE}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener la lista de proveedores`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getProveedorById(id: number): Promise<IProveedor | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createProveedor(data: ICreateProveedorDTO): Promise<IProveedor> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar el proveedor');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateProveedor(id: number, data: IUpdateProveedorDTO): Promise<IProveedor> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar el proveedor');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteProveedor(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar el proveedor');
    }

    const resData = await response.json();
    return resData.data || { deleted: true, deactivated: false, message: 'Proveedor eliminado exitosamente' };
  }
}
