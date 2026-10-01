export interface IVehiculo {
  vehIdVehiculo: number;
  vehPlaca: string;
  vehMarca: string;
  vehModelo: string;
  vehAnio?: number | null;
  vehEstado: 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA';
}

export interface ICreateVehiculoDTO {
  vehPlaca: string;
  vehMarca: string;
  vehModelo: string;
  vehAnio?: number | null;
  vehEstado?: 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA';
}

export interface IUpdateVehiculoDTO {
  vehPlaca?: string;
  vehMarca?: string;
  vehModelo?: string;
  vehAnio?: number | null;
  vehEstado?: 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA';
}

export interface IVehiculoFilterParams {
  placa?: string;
  marca?: string;
  estado?: string;
  search?: string;
}
