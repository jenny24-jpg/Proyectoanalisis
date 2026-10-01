export interface IRecepcionBodega {
  rboNoRecepcion: string;
  rboNoPo: string;
  rboIdBodega: number;
  bodNombre?: string | null;
  bodCodigo?: string | null;
  rboNombreBodega?: string | null;
  rboIdUsuarioBodega: number;
  usuarioNombre?: string | null;
  rboNombreUsuario?: string | null;
  rboFechaRecepcion: string | Date;
  rboTipoRecepcion: 'TOTAL' | 'PARCIAL' | string;
  rboSubtotalRecibido: number;
  rboIvaRecibido: number;
  rboTotalFacturar: number;
  // Transporte & Guía
  rboTipoTransporte?: 'PROPIO' | 'AJENO' | string;
  rboTransportistaNombre?: string | null;
  rboPlacaVehiculo?: string | null;
  rboModeloVehiculo?: string | null;
  rboIdEmpleadoChofer?: number | null;
  empleadoChoferNombre?: string | null;
  // Campos de Flota Propia & Transporte Ajeno (Nuevas tablas)
  rboIdVehiculo?: number | null;
  vehPlaca?: string | null;
  vehMarca?: string | null;
  vehModelo?: string | null;
  rboIdConductor?: number | null;
  condNombre?: string | null;
  conDpi?: string | null;
  conNoLicencia?: string | null;
  conTipoLicencia?: string | null;
  conFechaVencimientoLic?: Date | string | null;
  rboIdProveedorTransporte?: number | null;
  provTransporteNombre?: string | null;
  rboPlacaAjena?: string | null;
  rboModeloAjeno?: string | null;
  rboNombreArchivoPdf?: string | null;
  tieneDocumentoBlob?: boolean;
  tieneBlob?: boolean;
  // Campos complementarios
  solNoDocumento?: string | null;
  proNombreEntidad?: string | null;
  proNit?: string | null;
  guiaDespacho?: string | null;
  transportista?: string | null;
}

export interface IDetalleRecepcion {
  dreIdDetalleRecepcion: number;
  dreNoRecepcion: string;
  dreCodigoArticulo: string;
  artDescripcion?: string | null;
  dreDescripcionArticulo?: string | null;
  umeNombreUnidad?: string | null;
  dreCantidadRecibida: number;
  dreVerificadoFisicamente: number;
  idUbicacion?: number | null;
  ubiCodigoUbicacion?: string | null;
  idLote?: number | null;
  numeroLote?: string | null;
  precioUnitario?: number;
  drePrecioUnitario?: number;
  totalLinea?: number;
}

export interface IRecepcionBodegaCompleta extends IRecepcionBodega {
  detalles: IDetalleRecepcion[];
}

export interface IItemRecepcionInputDTO {
  codigoArticulo: string;
  cantidadPedida?: number;
  cantidadRecibida: number;
  verificadoFisicamente: boolean | number;
  idUbicacion?: number | null;
  idLote?: number | null;
  numeroLote?: string | null;
  fechaVencimiento?: string | null;
  costoUnitario?: number;
  precioUnitario?: number;
}

export interface IRegistrarRecepcionDTO {
  noPo: string;
  noDocumentoSolicitud?: string;
  idBodega: number;
  idUsuarioBodega?: number;
  guiaDespacho: string; // Guía de remisión / despacho
  transportista: string; // Empresa transportista o conductor
  // Campos de Transporte Propio / Ajeno
  tipoTransporte?: 'PROPIO' | 'AJENO' | string;
  rboTipoTransporte?: 'PROPIO' | 'AJENO' | string;
  transportistaNombre?: string;
  rboTransportistaNombre?: string;
  placaVehiculo?: string;
  rboPlacaVehiculo?: string;
  modeloVehiculo?: string;
  rboModeloVehiculo?: string;
  idEmpleadoChofer?: number;
  rboIdEmpleadoChofer?: number;
  // Campos Nuevos de Flota y BLOB
  idVehiculo?: number | null;
  idConductor?: number | null;
  idProveedorTransporte?: number | null;
  placaAjena?: string | null;
  modeloAjeno?: string | null;
  archivoDocumentoBase64?: string | null;
  nombreArchivoDocumento?: string | null;
  nombreArchivoPdf?: string | null;
  archivoDocumentoBuffer?: any;
  documentoBlob?: any;
  fechaLlegada?: string | Date;
  fechaEntrega?: string | Date;
  observaciones?: string;
  items?: IItemRecepcionInputDTO[];
  detalles?: IItemRecepcionInputDTO[];
}

export interface IRecepcionFilterParams {
  noRecepcion?: string;
  noPo?: string;
  idBodega?: number;
  tipoRecepcion?: string;
}

