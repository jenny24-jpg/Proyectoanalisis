export interface IUnidadMedida {
  umeIdUnidad: number;
  umeNombreUnidad: string;
  umeAbreviatura: string;
  umeActivo: number;
}

export interface ICreateUnidadMedidaDTO {
  umeNombreUnidad: string;
  umeAbreviatura: string;
  umeActivo?: number;
}

export interface IUpdateUnidadMedidaDTO {
  umeNombreUnidad?: string;
  umeAbreviatura?: string;
  umeActivo?: number;
}

export interface IUnidadMedidaFilterParams {
  nombre?: string;
  abreviatura?: string;
  activo?: number;
}
