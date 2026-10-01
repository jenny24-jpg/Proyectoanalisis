export const ESTADOS_SOLICITUD = [
  'PENDIENTE',
  'SOLICITADO',
  'APROBADO',
  'APROBADA',
  'EN_COTIZACION',
  'RECHAZADO',
  'RECHAZADA',
  'FINALIZADO',
  'CERRADA',
] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export type PipelineStageKey =
  | 'aprobacion'
  | 'matriz'
  | 'seleccion'
  | 'presupuesto'
  | 'bodega'
  | '3way'
  | 'rechazada';

export interface IPipelineProgressInfo {
  etapaActual: PipelineStageKey;
  porcentaje: number;
  pasoActual: number;
  totalPasos: number;
  esRechazada: boolean;
  esCompletada: boolean;
  etapaDetenida?: string;
  badgeTexto: string;
  subtitulo: string;
}

/**
 * Determina si una solicitud de compra se encuentra en estado rechazada o cancelada,
 * evaluando tanto el nombre del estado como las notas asociadas.
 */
export function isSolicitudRechazada(solicitud?: {
  solNombreEstado?: string | null;
  solNotas?: string | null;
  solIdEstado?: number;
  [key: string]: any;
} | null): boolean {
  if (!solicitud) return false;
  const nombre = (solicitud.solNombreEstado || (solicitud as any).estado || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const notas = (solicitud.solNotas || (solicitud as any).notas || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return (
    nombre.includes('RECHAZAD') ||
    nombre.includes('DENEGAD') ||
    nombre.includes('CANCELAD') ||
    nombre.includes('ANULAD') ||
    notas.includes('[RECHAZADA]') ||
    notas.includes('RECHAZADA')
  );
}

/**
 * Calcula la etapa actual y porcentaje de avance del ciclo de compras para una solicitud.
 * Si la solicitud está rechazada, el ciclo se detiene completamente (0% de avance, etapa 'rechazada',
 * no se marca como completada y queda detenida en Aprobación).
 */
export function calcularEtapaPipeline(solicitud?: {
  solNombreEstado?: string | null;
  solNotas?: string | null;
  solIdEstado?: number;
  [key: string]: any;
} | null): IPipelineProgressInfo {
  if (isSolicitudRechazada(solicitud)) {
    return {
      etapaActual: 'rechazada',
      porcentaje: 0,
      pasoActual: 0,
      totalPasos: 6,
      esRechazada: true,
      esCompletada: false,
      etapaDetenida: 'Aprobación',
      badgeTexto: 'Rechazada',
      subtitulo: 'Ciclo Detenido',
    };
  }

  const estado = (solicitud?.solNombreEstado || (solicitud as any)?.estado || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    estado.includes('FINALIZ') ||
    estado.includes('3WAY') ||
    estado.includes('LIQUID') ||
    estado.includes('CERRAD')
  ) {
    return {
      etapaActual: '3way',
      porcentaje: 100,
      pasoActual: 6,
      totalPasos: 6,
      esRechazada: false,
      esCompletada: true,
      badgeTexto: 'Finalizada',
      subtitulo: 'Ciclo Completo',
    };
  }

  if (
    estado.includes('BODEGA') ||
    estado.includes('RECEPC') ||
    estado.includes('ALMACEN') ||
    estado.includes('RECIBID')
  ) {
    return {
      etapaActual: 'bodega',
      porcentaje: 83,
      pasoActual: 5,
      totalPasos: 6,
      esRechazada: false,
      esCompletada: false,
      badgeTexto: 'Recepción',
      subtitulo: 'Bodega',
    };
  }

  if (estado.includes('PRESUP') || estado.includes('ORDEN') || estado.includes('PO')) {
    return {
      etapaActual: 'presupuesto',
      porcentaje: 66,
      pasoActual: 4,
      totalPasos: 6,
      esRechazada: false,
      esCompletada: false,
      badgeTexto: 'Presupuesto',
      subtitulo: 'Validación Presupuesto',
    };
  }

  if (
    estado.includes('COTIZAD') ||
    estado.includes('SELECCION') ||
    estado.includes('EVALUAC') ||
    estado.includes('EN_PROCESO') ||
    estado.includes('PROCESO')
  ) {
    return {
      etapaActual: 'seleccion',
      porcentaje: 50,
      pasoActual: 3,
      totalPasos: 6,
      esRechazada: false,
      esCompletada: false,
      badgeTexto: 'Selección',
      subtitulo: 'Selección Cotización',
    };
  }

  if (estado.includes('APROBAD') || estado.includes('MATRIZ')) {
    return {
      etapaActual: 'matriz',
      porcentaje: 33,
      pasoActual: 2,
      totalPasos: 6,
      esRechazada: false,
      esCompletada: false,
      badgeTexto: 'Aprobada',
      subtitulo: 'Matriz de Cotizaciones',
    };
  }

  // Por defecto: Pendiente de Aprobación Inicial (Paso 1)
  return {
    etapaActual: 'aprobacion',
    porcentaje: 16,
    pasoActual: 1,
    totalPasos: 6,
    esRechazada: false,
    esCompletada: false,
    badgeTexto: 'Pendiente',
    subtitulo: 'Aprobación Inicial',
  };
}

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
  tieneCotizacionGanadora?: boolean;
  tienePo?: boolean;
  tieneRecepcion?: boolean;
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
  idUnidadMedida?: number;
  idCategoria?: number;
  idMarca?: number;
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

