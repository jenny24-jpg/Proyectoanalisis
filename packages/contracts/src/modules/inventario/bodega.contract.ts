export interface IBodega {
  bodIdBodega: number;
  bodCodigo: string;
  bodNombre: string;
  bodIdSucursal: number;
  bodIdEncargado?: number | null;
  bodDireccion?: string | null;
  bodPermiteVentas: number;
  bodActivo: number;
}

export interface ICreateBodegaDTO {
  bodCodigo: string;
  bodNombre: string;
  bodIdSucursal?: number;
  bodIdEncargado?: number | null;
  bodDireccion?: string | null;
  bodPermiteVentas?: number;
  bodActivo?: number;
}

export interface IUpdateBodegaDTO {
  bodCodigo?: string;
  bodNombre?: string;
  bodIdSucursal?: number;
  bodIdEncargado?: number | null;
  bodDireccion?: string | null;
  bodPermiteVentas?: number;
  bodActivo?: number;
}

export interface IBodegaFilterParams {
  nombre?: string;
  codigo?: string;
  activo?: number;
}
