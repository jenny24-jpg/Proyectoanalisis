export interface IConductor {
  conIdConductor: number;
  conIdEmpleado: number;
  conNombreEmpleado?: string;
  conDpi: string;
  conTipoLicencia: 'A' | 'B' | 'C' | 'M';
  conNoLicencia: string;
  conFechaVencimientoLic: string;
  conEstado: 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO';
}

export interface IEmpleadoOption {
  idEmpleado: number;
  nombreCompleto: string;
  dpi?: string | null;
}

export interface ICreateConductorDTO {
  conIdEmpleado: number;
  conDpi: string;
  conTipoLicencia: 'A' | 'B' | 'C' | 'M';
  conNoLicencia: string;
  conFechaVencimientoLic: string;
  conEstado?: 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO';
}

export interface IUpdateConductorDTO {
  conIdEmpleado?: number;
  conDpi?: string;
  conTipoLicencia?: 'A' | 'B' | 'C' | 'M';
  conNoLicencia?: string;
  conFechaVencimientoLic?: string;
  conEstado?: 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO';
}

export interface IConductorFilterParams {
  dpi?: string;
  tipoLicencia?: string;
  estado?: string;
  search?: string;
}
