export interface IEstado {
  estIdEstado: number;
  estNombreEstado: string;
}

export interface ICreateEstadoDTO {
  estNombreEstado: string;
}

export interface IUpdateEstadoDTO {
  estNombreEstado?: string;
}

export interface IEstadoFilterParams {
  nombre?: string;
}
