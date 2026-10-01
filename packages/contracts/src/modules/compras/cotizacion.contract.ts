import type { IProveedor } from './proveedor.contract.js';
export type { IProveedor };

export const ESTADOS_COTIZACION = ['PENDIENTE', 'GANADORA', 'RECHAZADA', 'ADJUDICADA'] as const;
export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];

export interface IDetalleCotizacion {
  dcoIdDetalleCotizacion: number;
  dcoIdCotizacion: number;
  dcoCodigoArticulo: string;
  artDescripcion?: string | null;
  dcoCantidadCotizada: number;
  dcoPrecioUnitario: number;
  dcoSubtotalLinea: number;
}

export interface IDetalleCotizacionInputDTO {
  codigoArticulo: string;
  descripcionArticulo?: string;
  cantidadCotizada: number | string;
  precioUnitario: number | string;
  subtotalLinea?: number;
}

export interface ICotizacion {
  cotIdCotizacion: number;
  cotNoDocumentoSolicitud: string;
  cotIdProveedor: number;
  cotPrecioTotal: number;
  cotTiempoEntregaDias?: number | null;
  cotCondicionPagoDias?: number | null;
  cotRutaArchivoPdf?: string | null;
  cotArchivoPdf?: string | Uint8Array | null;
  cotEsExcepcionUnico: number;
  cotEstadoAdjudicacion?: string | null;
  cotNombreProveedor?: string | null;
  cotNitProveedor?: string | null;
  detalles?: IDetalleCotizacion[];
}

export interface ICreateCotizacionDTO {
  cotNoDocumentoSolicitud: string;
  cotIdProveedor: number;
  cotPrecioTotal: number;
  cotTiempoEntregaDias?: number | null;
  cotCondicionPagoDias?: number | null;
  cotRutaArchivoPdf?: string | null;
  cotArchivoPdf?: string | Uint8Array | null;
  cotEsExcepcionUnico?: number;
  cotEstadoAdjudicacion?: string | null;
  detalles?: IDetalleCotizacionInputDTO[];
}

export interface IUpdateCotizacionDTO {
  cotNoDocumentoSolicitud?: string;
  cotIdProveedor?: number;
  cotPrecioTotal?: number;
  cotTiempoEntregaDias?: number | null;
  cotCondicionPagoDias?: number | null;
  cotRutaArchivoPdf?: string | null;
  cotArchivoPdf?: string | Uint8Array | null;
  cotEsExcepcionUnico?: number;
  cotEstadoAdjudicacion?: string | null;
  detalles?: IDetalleCotizacionInputDTO[];
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
  rutaArchivoPdf?: string | null;
  archivoPdfNombre?: string | null;
  detalles?: IDetalleCotizacionInputDTO[];
}

export interface ISaveMatrizCotizacionesDTO {
  noSolicitud: string;
  esExcepcionUnico: boolean;
  justificacionExcepcion?: string;
  cotizaciones: ISaveMatrizItemDTO[];
  eliminarCotizacionIds?: number[];
}
