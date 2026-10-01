import {
  IConductor,
  ICreateConductorDTO,
  IUpdateConductorDTO,
  IConductorFilterParams,
  IEmpleadoOption,
} from '@erp/contracts';

const API_BASE = '/api/inventario/conductores';

export class ConductorClientService {
  static async getConductores(filters: IConductorFilterParams = {}): Promise<IConductor[]> {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.dpi) queryParams.append('dpi', filters.dpi);
    if (filters.tipoLicencia && filters.tipoLicencia !== 'TODOS') queryParams.append('tipoLicencia', filters.tipoLicencia);
    if (filters.estado && filters.estado !== 'TODOS') queryParams.append('estado', filters.estado);

    const url = `${API_BASE}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Error al obtener conductores`);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  static async getEmpleados(): Promise<IEmpleadoOption[]> {
    const response = await fetch(`${API_BASE}/empleados`);
    if (!response.ok) return [];
    const resData = await response.json();
    return resData.data || [];
  }

  static async getConductorById(id: number): Promise<IConductor | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createConductor(data: ICreateConductorDTO): Promise<IConductor> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar conductor');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async updateConductor(id: number, data: IUpdateConductorDTO): Promise<IConductor> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar conductor');
    }

    const resData = await response.json();
    return resData.data;
  }

  static async deleteConductor(id: number): Promise<{ message: string; deactivated?: boolean }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar conductor');
    }

    const resData = await response.json();
    return {
      message: resData.message || 'Conductor eliminado exitosamente',
      deactivated: resData.deactivated,
    };
  }
}
