export type TipoContenidoGuia = 'PDF' | 'PRESENTACION' | 'VIDEO' | 'DOCUMENTO' | 'IMAGEN';

export interface IGuiaSistema {
  guiIdGuia: number;
  guiTitulo: string;
  guiDescripcion?: string | null;
  guiTipoContenido: TipoContenidoGuia;
  guiUrlRecurso: string;
  guiModuloDestino?: string | null;
  guiActivo: number;
  guiNombreArchivo?: string | null;
  tieneBlob?: boolean;
  tieneArchivo?: boolean;
  fechaCreacion?: string | Date;
  guiFechaCreacion?: string | Date;
}

export interface ICrearGuiaSistemaDTO {
  guiTitulo: string;
  guiDescripcion?: string;
  guiTipoContenido: TipoContenidoGuia;
  guiUrlRecurso?: string;
  guiModuloDestino?: string;
  guiActivo?: number;
  archivoBase64?: string;
  nombreArchivo?: string;
  archivoBuffer?: any;
  archivoBlob?: any;
}

export interface IActualizarGuiaSistemaDTO {
  guiTitulo?: string;
  guiDescripcion?: string;
  guiTipoContenido?: TipoContenidoGuia;
  guiUrlRecurso?: string;
  guiModuloDestino?: string;
  guiActivo?: number;
  archivoBase64?: string;
  nombreArchivo?: string;
  archivoBuffer?: any;
  archivoBlob?: any;
}

export interface IFiltroGuiaSistemaParams {
  moduloDestino?: string;
  tipoContenido?: string;
  activo?: number;
  busqueda?: string;
}

