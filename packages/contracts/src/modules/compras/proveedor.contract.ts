export interface IProveedor {
  proIdProveedor: number;
  proNit: string | null;
  proNombreEntidad: string;
  proActivo: number;
}

export interface ICreateProveedorDTO {
  proNit: string;
  proNombreEntidad: string;
  proActivo?: number;
}

export interface IUpdateProveedorDTO {
  proNit?: string | null;
  proNombreEntidad?: string;
  proActivo?: number;
}

export interface IProveedorFilterParams {
  nombre?: string;
  nit?: string;
  activo?: number;
}
