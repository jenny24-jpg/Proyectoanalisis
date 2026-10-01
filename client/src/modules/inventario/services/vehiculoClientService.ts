import {
  IVehiculo,
  ICreateVehiculoDTO,
  IUpdateVehiculoDTO,
  IVehiculoFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/inventario/vehiculos';

export class VehiculoClientService {
  static async getVehiculos(filters: IVehiculoFilterParams = {}): Promise<IVehiculo[]> {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.placa) queryParams.append('placa', filters.placa);
    if (filters.marca) queryParams.append('marca', filters.marca);
    if (filters.estado && filters.estado !== 'TODOS') queryParams.append('estado', filters.estado);

    const url = `${API_BASE}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener vehículos`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getVehiculoById(id: number): Promise<IVehiculo | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createVehiculo(data: ICreateVehiculoDTO): Promise<IVehiculo> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar vehículo');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateVehiculo(id: number, data: IUpdateVehiculoDTO): Promise<IVehiculo> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar vehículo');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteVehiculo(id: number): Promise<{ message: string; deactivated?: boolean }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar vehículo');
    }

    const resData = await response.json();
    return {
      message: resData.message || 'Vehículo eliminado exitosamente',
      deactivated: resData.deactivated,
    };
  }
}
