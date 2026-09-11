export type NaturalezaMovimientoType = '+' | '-';

export interface ITipoMovimiento {
  tmiIdTipoMovimiento: number;
  tmiCodigo: string;
  tmiDescripcion: string;
  tmiNaturaleza: NaturalezaMovimientoType;
  tmiAfectaCosto: number;
  tmiActivo: number;
}

export interface ICreateTipoMovimientoDTO {
  tmiCodigo: string;
  tmiDescripcion: string;
  tmiNaturaleza: NaturalezaMovimientoType;
  tmiAfectaCosto?: number;
  tmiActivo?: number;
}

export interface IUpdateTipoMovimientoDTO {
  tmiCodigo?: string;
  tmiDescripcion?: string;
  tmiNaturaleza?: NaturalezaMovimientoType;
  tmiAfectaCosto?: number;
  tmiActivo?: number;
}

export interface ITipoMovimientoFilterParams {
  codigo?: string;
  descripcion?: string;
  naturaleza?: NaturalezaMovimientoType;
  activo?: number;
}
