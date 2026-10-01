import { GuiaSistemaRepository } from '../repositories/guiaSistema.repository.js';
import {
  IGuiaSistema,
  ICrearGuiaSistemaDTO,
  IActualizarGuiaSistemaDTO,
  IFiltroGuiaSistemaParams,
} from '@erp/contracts';

/**
 * Valida que los enlaces externos provengan exclusivamente de Google Drive o YouTube
 */
export function isValidGuiaMediaUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Permitir endpoints de API internos para descarga de BLOB
  if (trimmed.startsWith('/api/') || trimmed.startsWith('http://localhost') || trimmed.startsWith('https://')) {
    if (trimmed.includes('/api/compras/guias/')) return true;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();

    // Google Drive
    if (host === 'drive.google.com' || host.endsWith('.drive.google.com') || host === 'docs.google.com') {
      return true;
    }

    // YouTube
    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtu.be' ||
      host.endsWith('.youtube.com')
    ) {
      return true;
    }

    return false;
  } catch (_e) {
    return false;
  }
}

export class GuiaSistemaService {
  static async obtenerGuías(filtros: IFiltroGuiaSistemaParams = {}): Promise<IGuiaSistema[]> {
    return await GuiaSistemaRepository.findAll(filtros);
  }

  static async obtenerGuiaPorId(id: number): Promise<IGuiaSistema | null> {
    if (!id || id <= 0) throw new Error('ID de guía inválido.');
    return await GuiaSistemaRepository.findById(id);
  }

  static async crearGuia(dto: ICrearGuiaSistemaDTO): Promise<IGuiaSistema> {
    if (!dto.guiTitulo || dto.guiTitulo.trim() === '') {
      throw new Error('El título de la guía es requerido.');
    }
    if (!dto.guiTipoContenido) {
      throw new Error('El tipo de contenido (PDF, PRESENTACION, VIDEO, etc.) es requerido.');
    }

    const tipo = dto.guiTipoContenido.toUpperCase();

    // Regla 1: Si es VIDEO -> No permitir carga de archivo, exigir URL pública válida de YouTube o Google Drive
    if (tipo === 'VIDEO') {
      if (dto.archivoBlob || dto.archivoBase64) {
        throw new Error('Para guías de tipo VIDEO no se permite la carga directa de archivos. Debe proporcionar un enlace externo.');
      }
      if (!dto.guiUrlRecurso || dto.guiUrlRecurso.trim() === '') {
        throw new Error('Debe proporcionar obligatoriamente un enlace externo de YouTube o Google Drive para guías de Video.');
      }
      if (!isValidGuiaMediaUrl(dto.guiUrlRecurso)) {
        throw new Error(
          'El enlace multimedia para Video debe provenir exclusivamente de Google Drive (drive.google.com) o YouTube (youtube.com / youtu.be).'
        );
      }
    }

    // Regla 2: Si es PDF o PRESENTACION o DOCUMENTO -> Exigir archivo obligatorio (para persistir como BLOB)
    if (tipo === 'PDF' || tipo === 'PRESENTACION' || tipo === 'DOCUMENTO' || tipo === 'IMAGEN') {
      const tieneBuffer = dto.archivoBlob && Buffer.isBuffer(dto.archivoBlob) && dto.archivoBlob.length > 0;
      const tieneBase64 = dto.archivoBase64 && dto.archivoBase64.length > 20;

      if (!tieneBuffer && !tieneBase64 && (!dto.guiUrlRecurso || dto.guiUrlRecurso.trim() === '')) {
        throw new Error(`Para guías de tipo ${tipo} es obligatorio cargar el archivo correspondiente para su almacenamiento en base de datos.`);
      }
    }

    return await GuiaSistemaRepository.create(dto);
  }

  static async actualizarGuia(id: number, dto: IActualizarGuiaSistemaDTO): Promise<IGuiaSistema | null> {
    if (!id || id <= 0) throw new Error('ID de guía inválido.');

    if (dto.guiTipoContenido) {
      const tipo = dto.guiTipoContenido.toUpperCase();
      if (tipo === 'VIDEO') {
        if (dto.archivoBlob || dto.archivoBase64) {
          throw new Error('Para guías de tipo VIDEO no se permite la carga directa de archivos. Debe proporcionar un enlace externo.');
        }
        if (dto.guiUrlRecurso && !isValidGuiaMediaUrl(dto.guiUrlRecurso)) {
          throw new Error(
            'El enlace multimedia para Video debe provenir exclusivamente de Google Drive (drive.google.com) o YouTube (youtube.com / youtu.be).'
          );
        }
      }
    } else if (dto.guiUrlRecurso && !isValidGuiaMediaUrl(dto.guiUrlRecurso)) {
      throw new Error(
        'El enlace multimedia debe provenir exclusivamente de Google Drive (drive.google.com) o YouTube (youtube.com / youtu.be).'
      );
    }

    return await GuiaSistemaRepository.update(id, dto);
  }

  static async eliminarGuia(id: number): Promise<boolean> {
    if (!id || id <= 0) throw new Error('ID de guía inválido.');
    return await GuiaSistemaRepository.delete(id);
  }
}

