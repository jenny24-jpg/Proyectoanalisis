import {
  IGuiaSistema,
  ICrearGuiaSistemaDTO,
  IActualizarGuiaSistemaDTO,
  IFiltroGuiaSistemaParams,
} from '@erp/contracts';

const API_BASE = '/api/compras/guias';

export class GuiaSistemaClientService {
  /**
   * Obtiene la lista de guías y tutoriales multimedia del sistema
   */
  static async getGuias(filtros: IFiltroGuiaSistemaParams = {}): Promise<IGuiaSistema[]> {
    try {
      const searchParams = new URLSearchParams();
      if (filtros.moduloDestino && filtros.moduloDestino !== 'TODOS') searchParams.append('modulo', filtros.moduloDestino);
      if (filtros.tipoContenido && filtros.tipoContenido !== 'TODOS') searchParams.append('tipo', filtros.tipoContenido);
      if (filtros.activo !== undefined) searchParams.append('activo', String(filtros.activo));
      if (filtros.busqueda) searchParams.append('busqueda', filtros.busqueda);

      const url = searchParams.toString() ? `${API_BASE}?${searchParams.toString()}` : API_BASE;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al consultar las guías del sistema');
      }
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error('[GuiaSistemaClientService.getGuias Error]:', error);
      return [];
    }
  }

  /**
   * Obtiene el detalle de una guía por su ID
   */
  static async getGuiaPorId(id: number): Promise<IGuiaSistema | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) return null;
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error(`[GuiaSistemaClientService.getGuiaPorId Error ${id}]:`, error);
      return null;
    }
  }

  /**
   * Registra una nueva guía o recurso multimedia, soportando subida de archivo BLOB
   */
  static async crearGuia(dto: ICrearGuiaSistemaDTO, archivo?: File | null): Promise<IGuiaSistema> {
    let body: any;
    let headers: Record<string, string> = {};

    if (archivo) {
      const formData = new FormData();
      formData.append('data', JSON.stringify(dto));
      formData.append('archivo', archivo);
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(dto);
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al guardar la guía del sistema');
    }

    const json = await response.json();
    return json.data;
  }

  static async createGuia(dto: ICrearGuiaSistemaDTO, archivo?: File | null): Promise<IGuiaSistema> {
    return this.crearGuia(dto, archivo);
  }

  /**
   * Actualiza una guía existente
   */
  static async actualizarGuia(id: number, dto: IActualizarGuiaSistemaDTO, archivo?: File | null): Promise<IGuiaSistema> {
    let body: any;
    let headers: Record<string, string> = {};

    if (archivo) {
      const formData = new FormData();
      formData.append('data', JSON.stringify(dto));
      formData.append('archivo', archivo);
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(dto);
    }

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers,
      body,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al actualizar la guía');
    }

    const json = await response.json();
    return json.data;
  }

  /**
   * Obtiene la URL directa del endpoint de descarga del BLOB
   */
  static getArchivoUrl(id: number): string {
    return `${API_BASE}/${id}/archivo`;
  }

  /**
   * Desactiva / Elimina una guía
   */
  static async eliminarGuia(id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) return false;
    const json = await response.json();
    return json.success;
  }

  static async deleteGuia(id: number): Promise<boolean> {
    return this.eliminarGuia(id);
  }
}

