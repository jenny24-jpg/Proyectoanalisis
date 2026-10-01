import {
  IRecepcionBodega,
  IRecepcionBodegaCompleta,
  IRegistrarRecepcionDTO,
  IRecepcionFilterParams,
} from '@erp/contracts';

const API_BASE = '/api/compras/recepciones';
const API_INVENTARIO = '/api/inventario';

export interface IBodegaOption {
  idBodega: number;
  nombre: string;
  codigo?: string;
  activo?: number;
}

export interface IUbicacionOption {
  idUbicacion: number;
  idBodega: number;
  codigo: string;
  descripcion?: string;
  pasillo?: string;
  estante?: string;
  nivel?: string;
}

export class RecepcionBodegaClientService {
  /**
   * Obtiene la lista de recepciones con filtros opcionales
   */
  static async getRecepciones(filters: IRecepcionFilterParams = {}): Promise<IRecepcionBodega[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.noRecepcion) queryParams.append('noRecepcion', filters.noRecepcion);
      if (filters.noPo) queryParams.append('noPo', filters.noPo);
      if (filters.idBodega) queryParams.append('idBodega', String(filters.idBodega));
      if (filters.tipoRecepcion) queryParams.append('tipoRecepcion', filters.tipoRecepcion);

      const url = `${API_BASE}?${queryParams.toString()}`;
      const response = await fetch(url);
      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || `HTTP ${response.status}: Error al consultar recepciones de bodega`);
      }

      return resData.data || [];
    } catch (error) {
      console.error('[RecepcionBodegaClientService.getRecepciones Error]:', error);
      throw error;
    }
  }

  /**
   * Obtiene el detalle completo de una recepción por su número
   */
  static async getRecepcionPorNoRecepcion(noRecepcion: string): Promise<IRecepcionBodegaCompleta | null> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(noRecepcion)}`);
      if (response.status === 404) return null;
      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || `HTTP ${response.status}: Error al consultar la recepción ${noRecepcion}`);
      }

      return resData.data;
    } catch (error) {
      console.error(`[RecepcionBodegaClientService.getRecepcionPorNoRecepcion Error ${noRecepcion}]:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la recepción asociada a una Orden de Compra (PO)
   */
  static async getRecepcionPorNoPo(noPo: string): Promise<IRecepcionBodegaCompleta | null> {
    try {
      const response = await fetch(`${API_BASE}/po/${encodeURIComponent(noPo)}`);
      if (response.status === 404) return null;
      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || `HTTP ${response.status}: Error al consultar la recepción para la PO ${noPo}`);
      }

      return resData.data;
    } catch (error) {
      console.error(`[RecepcionBodegaClientService.getRecepcionPorNoPo Error ${noPo}]:`, error);
      throw error;
    }
  }

  /**
   * Registra e ingresa la mercancía al almacén e inventario (Kardex), soportando subida de comprobante PDF
   */
  static async registrarRecepcion(
    dto: IRegistrarRecepcionDTO,
    archivoComprobante?: File | null
  ): Promise<IRecepcionBodegaCompleta> {
    try {
      let body: any;
      let headers: Record<string, string> = {};

      if (archivoComprobante) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(dto));
        formData.append('archivo', archivoComprobante);
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(dto);
      }

      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers,
        body,
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || `HTTP ${response.status}: Error al registrar recepción en bodega`);
      }

      return resData.data;
    } catch (error) {
      console.error('[RecepcionBodegaClientService.registrarRecepcion Error]:', error);
      throw error;
    }
  }

  /**
   * Genera la URL del documento físico / comprobante PDF almacenado en BLOB
   */
  static getDocumentoUrl(noRecepcion: string): string {
    return `${API_BASE}/${encodeURIComponent(noRecepcion)}/documento`;
  }


  /**
   * Catálogo de bodegas activas
   */
  static async getBodegas(): Promise<IBodegaOption[]> {
    try {
      const response = await fetch(`${API_INVENTARIO}/bodegas?activo=1`);
      if (!response.ok) return [];
      const resData = await response.json();
      const list = Array.isArray(resData) ? resData : resData.data || [];
      return list.map((b: any) => {
        const id = Number(b.bodIdBodega ?? b.idBodega ?? b.BOD_ID_BODEGA ?? b.id ?? 1);
        const nombre = String(b.bodNombre ?? b.nombre ?? b.BOD_NOMBRE ?? `Bodega #${id}`);
        const codigo = String(b.bodCodigo ?? b.codigo ?? b.BOD_CODIGO ?? '');
        return {
          idBodega: id,
          nombre: nombre,
          codigo: codigo,
          activo: Number(b.bodActivo ?? b.activo ?? b.BOD_ACTIVO ?? 1),
        };
      });
    } catch (error) {
      console.warn('[RecepcionBodegaClientService.getBodegas Warning]:', error);
      return [];
    }
  }

  /**
   * Catálogo de ubicaciones activas por bodega
   */
  static async getUbicaciones(idBodega?: number): Promise<IUbicacionOption[]> {
    try {
      const url = idBodega
        ? `${API_INVENTARIO}/ubicaciones?idBodega=${idBodega}&activo=1`
        : `${API_INVENTARIO}/ubicaciones?activo=1`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const resData = await response.json();
      const list = Array.isArray(resData) ? resData : resData.data || [];
      return list.map((u: any) => {
        const id = Number(u.ubiIdUbicacion ?? u.idUbicacion ?? u.UBI_ID_UBICACION ?? u.id ?? 1);
        const bodId = Number(u.ubiIdBodega ?? u.idBodega ?? u.UBI_ID_BODEGA ?? 1);
        const codigo = String(u.ubiCodigoUbicacion ?? u.codigo ?? u.UBI_CODIGO ?? u.UBI_CODIGO_UBICACION ?? `UBI-${id}`);
        const pasillo = u.ubiPasillo ?? u.pasillo ?? u.UBI_PASILLO;
        const rack = u.ubiRack ?? u.rack ?? u.estante ?? u.UBI_RACK;
        const nivel = u.ubiNivel ?? u.nivel ?? u.UBI_NIVEL;
        const desc = [
          pasillo ? `Pasillo ${pasillo}` : '',
          rack ? `Rack ${rack}` : '',
          nivel ? `Nivel ${nivel}` : '',
        ].filter(Boolean).join(', ') || u.descripcion || u.UBI_DESCRIPCION || '';

        return {
          idUbicacion: id,
          idBodega: bodId,
          codigo: codigo,
          descripcion: desc,
          pasillo: pasillo ? String(pasillo) : undefined,
          estante: rack ? String(rack) : undefined,
          nivel: nivel ? String(nivel) : undefined,
        };
      });
    } catch (error) {
      console.warn('[RecepcionBodegaClientService.getUbicaciones Warning]:', error);
      return [];
    }
  }
}
