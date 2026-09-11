export const ESTADOS_SOLICITUD = [
  'SOLICITADO',
  'APROBADO',
  'EN_COTIZACION',
  'RECHAZADO',
  'FINALIZADO',
] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export interface ISolicitudCompra {
  solNoDocumento: string;
  solIdUsuarioResponsable: number;
  solNombreResponsable?: string | null;
  solIdDepartamento: number;
  solNombreDepartamento?: string | null;
  solNombreEntidad?: string | null;
  solFecha: string | Date;
  solNotas?: string | null;
  solMontoTotalEstimado: number;
  solIdEstado: number;
  solNombreEstado?: string | null;
}

export interface ISolicitudCompraFilterParams {
  noDocumento?: string;
  idDepartamento?: number;
  idEstado?: number;
}

export interface ISolicitudCompraDetalleCreateDTO {
  codigoArticulo?: string;
  cantidadPedida: number;
  isNuevo: boolean;
  nombreArticuloNuevo?: string;
}

export interface ISolicitudCompraCreateDTO {
  idUsuarioResponsable: number;
  idDepartamento: number;
  notas?: string;
  detalles: ISolicitudCompraDetalleCreateDTO[];
}

export interface ISolicitudCompraDetalle {
  dsoIdDetalleSolicitud: number;
  dsoNoDocumento: string;
  dsoCodigoArticulo: string;
  artDescripcion?: string | null;
  umeNombreUnidad?: string | null;
  umeAbreviatura?: string | null;
  dsoCantidadPedida: number;
  dsoCantidadAprobada: number;
}

export interface ISolicitudCompraCompleta extends ISolicitudCompra {
  detalles: ISolicitudCompraDetalle[];
}

export interface IUpdateSolicitudDetalleItemDTO {
  idDetalle: number;
  cantidadPedida?: number;
  cantidadAprobada: number;
}

export interface IUpdateSolicitudCompraDTO {
  notas?: string;
  detalles?: IUpdateSolicitudDetalleItemDTO[];
}

export interface IAprobarSolicitudDTO {
  notasAprobacion?: string;
  detalles?: IUpdateSolicitudDetalleItemDTO[];
}

export interface IRechazarSolicitudDTO {
  motivoRechazo: string;
}

