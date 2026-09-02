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
