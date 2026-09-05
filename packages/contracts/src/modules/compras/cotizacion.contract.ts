export interface IProveedor {
  proIdProveedor: number;
  proNit: string | null;
  proNombreEntidad: string;
  proActivo: number;
}

export const ESTADOS_COTIZACION = ['PENDIENTE', 'GANADORA', 'RECHAZADA', 'ADJUDICADA'] as const;
export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];

export interface ICotizacion {
  cotIdCotizacion: number;
  cotNoDocumentoSolicitud: string;
  cotIdProveedor: number;
  cotPrecioTotal: number;
  cotTiempoEntregaDias?: number | null;
  cotCondicionPagoDias?: number | null;
  cotArchivoPdf?: string | Uint8Array | null;
  cotEsExcepcionUnico: number;
  cotEstadoAdjudicacion?: string | null;
  cotNombreProveedor?: string | null;
  cotNitProveedor?: string | null;
}

export interface ICreateCotizacionDTO {
  cotNoDocumentoSolicitud: string;
  cotIdProveedor: number;
  cotPrecioTotal: number;
  cotTiempoEntregaDias?: number | null;
  cotCondicionPagoDias?: number | null;
  cotArchivoPdf?: string | Uint8Array | null;
  cotEsExcepcionUnico?: number;
  cotEstadoAdjudicacion?: string | null;
}

export interface IUpdateCotizacionDTO {
  cotNoDocumentoSolicitud?: string;
  cotIdProveedor?: number;
  cotPrecioTotal?: number;
  cotTiempoEntregaDias?: number | null;
  cotCondicionPagoDias?: number | null;
  cotArchivoPdf?: string | Uint8Array | null;
  cotEsExcepcionUnico?: number;
  cotEstadoAdjudicacion?: string | null;
}

export interface ICotizacionFilterParams {
  noSolicitud?: string;
  idProveedor?: number;
  estadoAdjudicacion?: string;
}

export interface ISaveMatrizItemDTO {
  idCotizacion?: number;
  idProveedor: number;
  precioTotal: number;
  tiempoEntregaDias?: number | null;
  condicionPagoDias?: number | null;
  archivoPdf?: string | Uint8Array | null;
}

export interface ISaveMatrizCotizacionesDTO {
  noSolicitud: string;
  esExcepcionUnico: boolean;
  justificacionExcepcion?: string;
  cotizaciones: ISaveMatrizItemDTO[];
  eliminarCotizacionIds?: number[];
}
