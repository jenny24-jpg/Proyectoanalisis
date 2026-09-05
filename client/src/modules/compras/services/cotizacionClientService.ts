import {
  ICotizacion,
  ICreateCotizacionDTO,
  IUpdateCotizacionDTO,
  ICotizacionFilterParams,
  IProveedor,
  ISaveMatrizCotizacionesDTO,
  ISaveMatrizItemDTO,
} from '@erp/contracts';

const API_BASE = '/api/compras/cotizaciones';

export interface ICotizacionMatrizProveedorInput {
  idCotizacion?: number;
  nombreProveedor: string;
  idProveedor?: number;
  precioTotal: number | string;
  tiempoEntregaDias: number | string;
  plazoPago: string;
  archivoPdfBase64: string | null;
  archivoPdfNombre: string | null;
}

export class CotizacionClientService {
  /**
   * Obtiene el catálogo de proveedores activos desde la tabla PROVEEDOR de Oracle
   */
  static async getProveedores(): Promise<IProveedor[]> {
    try {
      const response = await fetch(`${API_BASE}/proveedores`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al obtener proveedores de la BD`);
      }
      const resData = await response.json();
      return resData.data || [];
    } catch (error) {
      console.error('[CotizacionClientService.getProveedores Error]:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista completa de cotizaciones desde la base de datos Oracle
   */
  static async getCotizaciones(filters: ICotizacionFilterParams = {}): Promise<ICotizacion[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.noSolicitud) queryParams.append('noSolicitud', filters.noSolicitud);
      if (filters.idProveedor) queryParams.append('idProveedor', String(filters.idProveedor));
      if (filters.estadoAdjudicacion) queryParams.append('estadoAdjudicacion', filters.estadoAdjudicacion);

      const url = `${API_BASE}?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al obtener cotizaciones de la BD`);
      }

      const resData = await response.json();
      return resData.data || [];
    } catch (error) {
      console.error('[CotizacionClientService.getCotizaciones Error]:', error);
      throw error;
    }
  }

  /**
   * Obtiene una cotización por su ID
   */
  static async getCotizacionById(id: number, downloadPdf: boolean = false): Promise<ICotizacion | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}?downloadPdf=${downloadPdf}`);
      if (!response.ok) return null;
      const resData = await response.json();
      return resData.data || null;
    } catch (error) {
      console.error('[CotizacionClientService.getCotizacionById Error]:', error);
      return null;
    }
  }

  /**
   * Crea una cotización individual en la base de datos Oracle
   */
  static async createCotizacion(data: ICreateCotizacionDTO): Promise<ICotizacion> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Error HTTP ${response.status} al guardar cotización`;
      throw new Error(errorMessage);
    }

    const resData = await response.json();
    return resData.data;
  }

  /**
   * Actualiza una cotización existente en la base de datos Oracle
   */
  static async updateCotizacion(id: number, data: IUpdateCotizacionDTO): Promise<ICotizacion> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Error HTTP ${response.status} al actualizar cotización`;
      throw new Error(errorMessage);
    }

    const resData = await response.json();
    return resData.data;
  }

  /**
   * Guarda de manera atómica la Matriz de Cotizaciones en Oracle DB bajo una sola transacción.
   * Procesa de forma limpia inserciones de nuevas, actualizaciones de existentes y eliminación de descartadas.
   */
  static async saveMatrizCotizaciones(
    noSolicitud: string,
    proveedores: ICotizacionMatrizProveedorInput[],
    esExcepcionUnico: boolean,
    justificacion: string,
    deletedCotizacionIds: number[] = []
  ): Promise<ICotizacion[]> {
    const proveedoresAProcesar = esExcepcionUnico ? [proveedores[0]] : proveedores;
    const itemsDto: ISaveMatrizItemDTO[] = [];

    for (const prov of proveedoresAProcesar) {
      // Si la tarjeta está vacía o sin proveedor, no se procesa
      if (!prov.idProveedor || prov.precioTotal === '' || prov.precioTotal === null) {
        continue;
      }

      let condicionDias: number | null = null;
      if (prov.plazoPago) {
        const parsed = parseInt(String(prov.plazoPago), 10);
        if (!isNaN(parsed)) condicionDias = parsed;
      }

      let entregaDias: number | null = null;
      if (prov.tiempoEntregaDias !== '' && prov.tiempoEntregaDias !== null && prov.tiempoEntregaDias !== undefined) {
        const parsed = Number(prov.tiempoEntregaDias);
        if (!isNaN(parsed)) entregaDias = parsed;
      }

      itemsDto.push({
        idCotizacion: prov.idCotizacion,
        idProveedor: prov.idProveedor,
        precioTotal: Number(prov.precioTotal || 0),
        tiempoEntregaDias: entregaDias,
        condicionPagoDias: condicionDias,
        archivoPdf: prov.archivoPdfBase64,
      });
    }

    // Filtrar IDs descartados eliminando duplicados
    const uniqueDeleteIds = Array.from(new Set(deletedCotizacionIds.filter(id => typeof id === 'number' && id > 0)));

    const payload: ISaveMatrizCotizacionesDTO = {
      noSolicitud,
      esExcepcionUnico,
      justificacionExcepcion: justificacion,
      cotizaciones: itemsDto,
      eliminarCotizacionIds: uniqueDeleteIds,
    };

    const response = await fetch(`${API_BASE}/matriz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Error HTTP ${response.status} al procesar matriz de cotizaciones`;
      throw new Error(errorMessage);
    }

    const resData = await response.json();
    return resData.data || [];
  }

  /**
   * Elimina una cotización por ID en Oracle DB
   */
  static async deleteCotizacion(id: number): Promise<boolean> {
    if (!id || id <= 0) return true;

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Error HTTP ${response.status} al eliminar la cotización`;
      throw new Error(errorMessage);
    }
    return true;
  }
}
