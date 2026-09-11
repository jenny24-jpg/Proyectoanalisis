export interface IUbicacion {
  ubiIdUbicacion: number;
  ubiIdBodega: number;
  ubiCodigoUbicacion: string;
  ubiPasillo?: string | null;
  ubiRack?: string | null;
  ubiNivel?: string | null;
  ubiActivo: number;
  bodNombre?: string;
}

export interface ICreateUbicacionDTO {
  ubiIdBodega: number;
  ubiCodigoUbicacion: string;
  ubiPasillo?: string | null;
  ubiRack?: string | null;
  ubiNivel?: string | null;
  ubiActivo?: number;
}

export interface IUpdateUbicacionDTO {
  ubiIdBodega?: number;
  ubiCodigoUbicacion?: string;
  ubiPasillo?: string | null;
  ubiRack?: string | null;
  ubiNivel?: string | null;
  ubiActivo?: number;
}

export interface IUbicacionFilterParams {
  codigo?: string;
  idBodega?: number;
  activo?: number;
}
