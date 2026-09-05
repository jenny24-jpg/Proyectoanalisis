export interface ISolicitudCompra {
  solNoDocumento: string;
  solIdUsuarioResponsable: number;
  solNombreResponsable?: string | null;
  solIdDepartamento: number;
  solNombreDepartamento?: string | null;
  solNombreEntidad?: string | null;
  solFecha: string | Date;
  solNotas?: string | null;
  solMontoTotalEstimado: number;
  solIdEstado: number;
  solNombreEstado?: string | null;
}

export interface ISolicitudCompraFilterParams {
  noDocumento?: string;
  idDepartamento?: number;
  idEstado?: number;
}
