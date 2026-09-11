import { ITomaFisicaCreateDTO, IGuardarConteoDTO, ITomaFisicaResponseDTO } from '@erp/contracts';

const API_BASE = '/api/inventario/toma-fisica';

export class TomaFisicaClientService {
  static async aperturar(payload: ITomaFisicaCreateDTO): Promise<{ success: boolean; message: string; idToma?: number }> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al aperturar la toma física');
    return data;
  }

  static async getActiva(idBodega: number): Promise<ITomaFisicaResponseDTO | null> {
    const res = await fetch(`${API_BASE}/activa/${idBodega}`);
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al buscar toma activa');
    return data;
  }

  static async guardarConteo(idToma: number, payload: IGuardarConteoDTO): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/${idToma}/conteo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al guardar el conteo');
    return data;
  }
}
