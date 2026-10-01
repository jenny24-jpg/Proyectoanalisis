import { ISolicitudCompra } from './solicitudCompra.contract.js';
import { ICotizacion } from './cotizacion.contract.js';
import { IOrdenCompraCompleta } from './ordenCompra.contract.js';
import { IRecepcionBodegaCompleta } from './recepcionBodega.contract.js';

export interface IFacturaCxP {
  facNoFactura: string;
  facIdProveedor: number;
  proNombreEntidad?: string | null;
  proNit?: string | null;
  facNoPo: string;
  facNoRecepcion: string;
  facFechaFactura: Date | string;
  facSubtotal: number;
  facMontoIva: number;
  facTotalFactura: number;
  facRutaArchivoPdf?: string | null;
  facIdEstado: number;
  estNombreEstado?: string | null;
}

export interface IItemThreeWayComparison {
  idDetalleOc?: number;
  idDetalleRecepcion?: number;
  numeroLinea?: number;
  codigoArticulo: string;
  descripcionArticulo: string;
  unidadMedida?: string;
  cantidadPedidaPo: number;
  cantidadRecibidaBodega: number;
  cantidadFacturada: number;
  precioUnitarioCotizado: number;
  precioUnitarioPo: number;
  precioUnitarioFactura: number;
  subtotalPo: number;
  subtotalRecepcion: number;
  subtotalFactura: number;
  diferenciaCantidad: number;
  diferenciaPrecio?: number;
  diferenciaMonto: number;
  esConforme: boolean;
  resultadoTresVias: 'CONFORME' | 'DISCREPANCIA_PRECIO' | 'DISCREPANCIA_CANTIDAD' | 'DISCREPANCIA_AMBAS' | 'NO_CONFORME' | string;
}

export interface IThreeWayComparisonSummary {
  montoCotizacion: number;
  montoOrdenCompra: number;
  montoRecepcionBodega: number;
  montoFactura: number;
  subtotalFactura: number;
  ivaFactura: number;
  variacionMonto: number;
  variacionPorcentaje: number;
  toleranciaPermitidaPct: number;
  cantidadesCoinciden: boolean;
  preciosCoinciden: boolean;
  esConforme: boolean;
  tipoDiscrepancia?: 'NINGUNA' | 'CANTIDAD' | 'PRECIO' | 'AMBAS';
  items: IItemThreeWayComparison[];
}

export interface IThreeWayMatchData {
  solicitud: ISolicitudCompra;
  cotizacion: ICotizacion | null;
  ordenCompra: IOrdenCompraCompleta | null;
  recepcionBodega: IRecepcionBodegaCompleta | null;
  facturaExistente: IFacturaCxP | null;
  comparison: IThreeWayComparisonSummary;
  estadoCiclo: 'PENDIENTE_BODEGA' | 'LISTO_PARA_CONCILIAR' | 'LIQUIDADO_CXP';
}

export interface ILiquidarThreeWayMatchDTO {
  noPo: string;
  noRecepcion: string;
  noDocumentoSolicitud: string;
  noFactura: string;
  idProveedor: number;
  fechaFactura: string;
  subtotalFactura: number;
  montoIvaFactura: number;
  totalFactura: number;
  rutaArchivoPdf?: string;
  notasLiquidacion?: string;
  toleranciaAceptada?: boolean;
  items?: IItemThreeWayComparison[];
}

export interface IFacturaFilterParams {
  noFactura?: string;
  noPo?: string;
  noRecepcion?: string;
  idProveedor?: number;
  idEstado?: number;
}
