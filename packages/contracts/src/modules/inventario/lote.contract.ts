export type EstadoLoteType = 'ACTIVO' | 'VENCIDO' | 'BLOQUEADO' | 'AGOTADO';

export interface ILote {
  lotIdLote: number;
  lotNumeroLote: string;
  lotCodigoArticulo: string;
  lotFechaProduccion?: string | Date | null;
  lotFechaVencimiento?: string | Date | null;
  lotEstado: EstadoLoteType;
  artDescripcion?: string;
}

export interface ICreateLoteDTO {
  lotNumeroLote: string;
  lotCodigoArticulo: string;
  lotFechaProduccion?: string | Date | null;
  lotFechaVencimiento?: string | Date | null;
  lotEstado?: EstadoLoteType;
}

export interface IUpdateLoteDTO {
  lotNumeroLote?: string;
  lotCodigoArticulo?: string;
  lotFechaProduccion?: string | Date | null;
  lotFechaVencimiento?: string | Date | null;
  lotEstado?: EstadoLoteType;
}

export interface ILoteFilterParams {
  numeroLote?: string;
  codigoArticulo?: string;
  estado?: EstadoLoteType;
}
