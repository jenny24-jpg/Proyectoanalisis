// packages/contracts/src/modules/inventario.ts

export interface IArticulo {
  ART_CODIGO_ARTICULO: string;
  ART_DESCRIPCION: string;
  ART_ID_CATEGORIA: number;
  ART_ID_MARCA: number;
  ART_ID_UNIDAD_COMPRA: number;
  ART_ID_UNIDAD_VENTA: number;
  ART_MANEJA_LOTE: number; // 0 o 1
  ART_ACTIVO: number;      // 0 o 1
}

// Interfaz específica para cuando queramos actualizar solo la descripción
export interface IActualizarArticuloDTO {
  ART_DESCRIPCION: string;
}


// packages/contracts/src/modules/inventario/inventario.ts

export interface IArticulo {
  ART_CODIGO_ARTICULO: string;
  ART_DESCRIPCION: string;
  ART_ID_CATEGORIA: number;
  ART_ID_MARCA: number;
  ART_ID_UNIDAD_COMPRA: number;
  ART_ID_UNIDAD_VENTA: number;
  ART_MANEJA_LOTE: number;
  ART_ACTIVO: number;
  STOCK_TOTAL?: number;
}

export interface IActualizarArticuloDTO {
  ART_DESCRIPCION: string;
}

// 👇 ESTO ES LO NUEVO QUE DEBES AGREGAR 👇
export interface ICrearArticuloDTO {
  ART_CODIGO_ARTICULO: string;
  ART_DESCRIPCION: string;
  ART_ID_CATEGORIA: number;
  ART_ID_MARCA: number;
  ART_ID_UNIDAD_COMPRA: number;
  ART_ID_UNIDAD_VENTA: number;
  ART_MANEJA_LOTE: number;
}
