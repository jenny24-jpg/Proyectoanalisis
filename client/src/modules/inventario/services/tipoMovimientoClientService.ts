import {
  ITipoMovimiento,
  ICreateTipoMovimientoDTO,
  IUpdateTipoMovimientoDTO,
  ITipoMovimientoFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/inventario/tipos-movimiento';

export class TipoMovimientoClientService {
  static async getTiposMovimiento(filters: ITipoMovimientoFilterParams = {}): Promise<ITipoMovimiento[]> {
    const queryParams = new URLSearchParams();
    if (filters.codigo) queryParams.append('codigo', filters.codigo);
    if (filters.descripcion) queryParams.append('descripcion', filters.descripcion);
    if (filters.naturaleza) queryParams.append('naturaleza', filters.naturaleza);
    if (filters.activo !== undefined) queryParams.append('activo', String(filters.activo));

    const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Error al obtener tipos de movimiento`);
    const resData = await response.json();
    return resData.data || [];
  }

  static async getTipoMovimientoById(id: number): Promise<ITipoMovimiento | null> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data || null;
  }

  static async createTipoMovimiento(data: ICreateTipoMovimientoDTO): Promise<ITipoMovimiento> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al registrar tipo de movimiento');
    }
    const resData = await response.json();
    return resData.data;
  }

  static async updateTipoMovimiento(id: number, data: IUpdateTipoMovimientoDTO): Promise<ITipoMovimiento> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar tipo de movimiento');
    }
    const resData = await response.json();
    return resData.data;
  }

  static async deleteTipoMovimiento(id: number): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al eliminar tipo de movimiento');
    }
    const resData = await response.json();
    return resData.data || { deleted: true, deactivated: false, message: 'Tipo de movimiento eliminado exitosamente' };
  }
}
