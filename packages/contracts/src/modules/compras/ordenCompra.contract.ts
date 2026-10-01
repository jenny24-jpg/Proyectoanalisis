export interface IOrdenCompra {
  ocoNoPo: string;
  ocoIdCotizacionGanadora: number;
  ocoFechaEmision: string | Date;
  ocoSubtotal: number;
  ocoMontoIva: number;
  ocoTotal: number;
  ocoRutaPdfPo?: string | null;
  ocoIdEstado: number;
  // Propiedades enriquecidas con JOINs a Cotización, Proveedor y Solicitud
  solNoDocumento?: string | null;
  proNombreEntidad?: string | null;
  proNit?: string | null;
  depNombreDepartamento?: string | null;
  solMontoTotalEstimado?: number | null;
  estNombreEstado?: string | null;
  cotTiempoEntregaDias?: number | null;
  cotCondicionPagoDias?: number | null;
}

export interface IDetalleOrdenCompra {
  docIdDetallePo: number;
  docNoPo: string;
  docCodigoArticulo: string;
  artDescripcion?: string | null;
  umeNombreUnidad?: string | null;
  docCantidadPedida: number;
  docPrecioUnitario: number;
  docTotalLinea: number;
}

export interface IOrdenCompraCompleta extends IOrdenCompra {
  detalles: IDetalleOrdenCompra[];
}

export interface IAutorizarPresupuestoDTO {
  noDocumento: string;
  idCotizacionGanadora?: number;
  partidaPresupuestaria?: string;
  centroCosto?: string;
  notasAutorizacion?: string;
  subtotal?: number;
  montoIva?: number;
  total?: number;
}

export interface IRechazarPresupuestoDTO {
  noDocumento: string;
  motivoRechazo: string;
}

export interface IOrdenCompraFilterParams {
  noPo?: string;
  noDocumentoSolicitud?: string;
  idEstado?: number;
}
