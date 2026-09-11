export interface IMarca {
  marIdMarca: number;
  marNombreMarca: string;
  marActivo: number;
}

export interface ICreateMarcaDTO {
  marNombreMarca: string;
  marActivo?: number;
}

export interface IUpdateMarcaDTO {
  marNombreMarca?: string;
  marActivo?: number;
}

export interface IMarcaFilterParams {
  nombre?: string;
  activo?: number;
}
