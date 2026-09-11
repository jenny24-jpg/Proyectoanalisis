export interface ICategoria {
  catIdCategoria: number;
  catNombreCategoria: string;
  catActivo: number;
}

export interface ICreateCategoriaDTO {
  catNombreCategoria: string;
  catActivo?: number;
}

export interface IUpdateCategoriaDTO {
  catNombreCategoria?: string;
  catActivo?: number;
}

export interface ICategoriaFilterParams {
  nombre?: string;
  activo?: number;
}
