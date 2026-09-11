export interface IMovimientoInventarioDetalleCreateDTO {
  codigoArticulo: string;
  cantidad: number;
  costoUnitario?: number; // Para entradas puede ser necesario, o se asume costo promedio local
}

export interface IMovimientoInventarioCreateDTO {
  tipoMovimiento: 'AJU_ENTRADA' | 'AJU_SALIDA' | 'TRF_SALIDA' | 'TRF_ENTRADA';
  idBodegaOrigen: number;
  idBodegaDestino?: number; // Requerido si es TRF_SALIDA
  idUsuario: number;
  observaciones?: string;
  detalles: IMovimientoInventarioDetalleCreateDTO[];
}
