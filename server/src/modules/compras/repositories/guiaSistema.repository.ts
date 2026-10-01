import { execute, withTransaction } from '../../../config/database.js';
import {
  IGuiaSistema,
  ICrearGuiaSistemaDTO,
  IActualizarGuiaSistemaDTO,
  IFiltroGuiaSistemaParams,
} from '@erp/contracts';

interface IGuiaSistemaDbRow {
  GUI_ID_GUIA: number | string;
  GUI_TITULO: string;
  GUI_DESCRIPCION?: string | null;
  GUI_TIPO_CONTENIDO: 'IMAGEN' | 'VIDEO' | 'DOCUMENTO' | 'PDF' | 'PRESENTACION';
  GUI_URL_RECURSO: string;
  GUI_MODULO_DESTINO?: string | null;
  GUI_ACTIVO: number | string;
  GUI_NOMBRE_ARCHIVO?: string | null;
  GUI_ARCHIVO_BLOB?: Buffer | null;
}

function mapRowToGuia(row: IGuiaSistemaDbRow): IGuiaSistema {
  const id = Number(row.GUI_ID_GUIA);
  let url = String(row.GUI_URL_RECURSO || '');
  if (!url || url.trim() === '' || url.startsWith('/uploads/')) {
    url = `/api/compras/guias/${id}/archivo`;
  }

  return {
    guiIdGuia: id,
    guiTitulo: String(row.GUI_TITULO),
    guiDescripcion: row.GUI_DESCRIPCION ? String(row.GUI_DESCRIPCION) : null,
    guiTipoContenido: row.GUI_TIPO_CONTENIDO,
    guiUrlRecurso: url,
    guiModuloDestino: row.GUI_MODULO_DESTINO ? String(row.GUI_MODULO_DESTINO) : 'GENERAL',
    guiActivo: Number(row.GUI_ACTIVO ?? 1),
    guiNombreArchivo: row.GUI_NOMBRE_ARCHIVO ? String(row.GUI_NOMBRE_ARCHIVO) : null,
    tieneArchivo: Boolean(row.GUI_NOMBRE_ARCHIVO || row.GUI_ARCHIVO_BLOB),
  };
}

export class GuiaSistemaRepository {
  /**
   * Obtiene la lista de guías activas con filtros opcionales por módulo y tipo de contenido
   */
  static async findAll(filters: IFiltroGuiaSistemaParams = {}): Promise<IGuiaSistema[]> {
    let sql = `
      SELECT 
        GUI_ID_GUIA,
        GUI_TITULO,
        GUI_DESCRIPCION,
        GUI_TIPO_CONTENIDO,
        GUI_URL_RECURSO,
        GUI_MODULO_DESTINO,
        GUI_ACTIVO,
        GUI_NOMBRE_ARCHIVO
      FROM CMP_GUIA_SISTEMA
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.activo !== undefined) {
      sql += ` AND GUI_ACTIVO = :filtroActivo`;
      binds.filtroActivo = filters.activo;
    } else {
      sql += ` AND GUI_ACTIVO = 1`;
    }

    if (filters.moduloDestino && filters.moduloDestino !== 'TODOS') {
      sql += ` AND (UPPER(GUI_MODULO_DESTINO) = :filtroModulo OR UPPER(GUI_MODULO_DESTINO) = 'GENERAL')`;
      binds.filtroModulo = filters.moduloDestino.toUpperCase();
    }

    if (filters.tipoContenido && filters.tipoContenido !== 'TODOS') {
      sql += ` AND UPPER(GUI_TIPO_CONTENIDO) = :filtroTipo`;
      binds.filtroTipo = filters.tipoContenido.toUpperCase();
    }

    if (filters.busqueda && filters.busqueda.trim() !== '') {
      sql += ` AND (LOWER(GUI_TITULO) LIKE :filtroBusqueda OR LOWER(NVL(GUI_DESCRIPCION, ' ')) LIKE :filtroBusqueda)`;
      binds.filtroBusqueda = `%${filters.busqueda.toLowerCase().trim()}%`;
    }

    sql += ` ORDER BY GUI_ID_GUIA ASC`;

    try {
      const result = await execute<IGuiaSistemaDbRow>(sql, binds);
      return (result.rows || []).map(mapRowToGuia);
    } catch (err) {
      console.warn('[GuiaSistemaRepository.findAll Warning]:', err);
      return [];
    }
  }

  /**
   * Obtiene una guía específica por su ID
   */
  static async findById(id: number): Promise<IGuiaSistema | null> {
    const sql = `
      SELECT 
        GUI_ID_GUIA,
        GUI_TITULO,
        GUI_DESCRIPCION,
        GUI_TIPO_CONTENIDO,
        GUI_URL_RECURSO,
        GUI_MODULO_DESTINO,
        GUI_ACTIVO,
        GUI_NOMBRE_ARCHIVO
      FROM CMP_GUIA_SISTEMA
      WHERE GUI_ID_GUIA = :guiId
    `;
    try {
      const result = await execute<IGuiaSistemaDbRow>(sql, { guiId: id });
      if (!result.rows || result.rows.length === 0) return null;
      return mapRowToGuia(result.rows[0]);
    } catch (err) {
      console.error(`[GuiaSistemaRepository.findById Error ${id}]:`, err);
      return null;
    }
  }

  /**
   * Obtiene el archivo BLOB directamente desde la base de datos Oracle
   */
  static async findArchivoBlob(id: number): Promise<{ blob: Buffer | null; filename: string; tipo: string } | null> {
    const sql = `
      SELECT GUI_ID_GUIA, GUI_TITULO, GUI_TIPO_CONTENIDO, GUI_NOMBRE_ARCHIVO, GUI_ARCHIVO_BLOB
      FROM CMP_GUIA_SISTEMA
      WHERE GUI_ID_GUIA = :guiId
    `;
    const result = await execute<{
      GUI_ID_GUIA: number;
      GUI_TITULO: string;
      GUI_TIPO_CONTENIDO: string;
      GUI_NOMBRE_ARCHIVO?: string | null;
      GUI_ARCHIVO_BLOB?: Buffer | null;
    }>(sql, { guiId: id });

    if (!result.rows || result.rows.length === 0) return null;

    const row = result.rows[0];
    const tipo = row.GUI_TIPO_CONTENIDO || 'DOCUMENTO';
    let defaultExt = '.pdf';
    if (tipo.toUpperCase() === 'PRESENTACION') defaultExt = '.pptx';
    if (tipo.toUpperCase() === 'IMAGEN') defaultExt = '.png';

    const filename = row.GUI_NOMBRE_ARCHIVO || `Guia_${row.GUI_ID_GUIA}${defaultExt}`;

    return {
      blob: row.GUI_ARCHIVO_BLOB || null,
      filename,
      tipo,
    };
  }

  /**
   * Registra una nueva guía multimedia del sistema con persistencia BLOB en Oracle
   */
  static async create(dto: ICrearGuiaSistemaDTO): Promise<IGuiaSistema> {
    let fileBuffer: Buffer | null = dto.archivoBlob || null;
    if (!fileBuffer && dto.archivoBase64 && dto.archivoBase64.length > 20) {
      try {
        const cleanBase64 = dto.archivoBase64.includes('base64,')
          ? dto.archivoBase64.split('base64,')[1]
          : dto.archivoBase64;
        fileBuffer = Buffer.from(cleanBase64, 'base64');
      } catch (_e) {
        fileBuffer = null;
      }
    }

    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(GUI_ID_GUIA), 0) + 1 AS NEXT_ID FROM CMP_GUIA_SISTEMA`
      );
      const nextId = Number(nextIdRes.rows?.[0]?.NEXT_ID || 1);

      let urlRecurso = dto.guiUrlRecurso?.trim() || '';
      if (fileBuffer) {
        urlRecurso = `/api/compras/guias/${nextId}/archivo`;
      }

      const nombreArchivo = dto.nombreArchivo || (fileBuffer ? `Guia_${nextId}.pdf` : null);

      const sql = `
        INSERT INTO CMP_GUIA_SISTEMA (
          GUI_ID_GUIA,
          GUI_TITULO,
          GUI_DESCRIPCION,
          GUI_TIPO_CONTENIDO,
          GUI_URL_RECURSO,
          GUI_MODULO_DESTINO,
          GUI_ACTIVO,
          GUI_NOMBRE_ARCHIVO,
          GUI_ARCHIVO_BLOB
        ) VALUES (
          :guiId,
          :guiTitulo,
          :guiDescripcion,
          :guiTipoContenido,
          :guiUrlRecurso,
          :guiModuloDestino,
          :guiActivo,
          :nombreArchivo,
          :archivoBlob
        )
      `;

      await conn.execute(sql, {
        guiId: nextId,
        guiTitulo: dto.guiTitulo.trim(),
        guiDescripcion: dto.guiDescripcion?.trim() || null,
        guiTipoContenido: dto.guiTipoContenido || 'DOCUMENTO',
        guiUrlRecurso: urlRecurso,
        guiModuloDestino: (dto.guiModuloDestino || 'COMPRAS').toUpperCase().trim(),
        guiActivo: dto.guiActivo ?? 1,
        nombreArchivo,
        archivoBlob: fileBuffer,
      });

      return {
        guiIdGuia: nextId,
        guiTitulo: dto.guiTitulo.trim(),
        guiDescripcion: dto.guiDescripcion?.trim() || null,
        guiTipoContenido: dto.guiTipoContenido,
        guiUrlRecurso: urlRecurso,
        guiModuloDestino: (dto.guiModuloDestino || 'COMPRAS').toUpperCase().trim(),
        guiActivo: dto.guiActivo ?? 1,
        guiNombreArchivo: nombreArchivo,
        tieneArchivo: Boolean(fileBuffer),
      };
    });
  }

  /**
   * Actualiza los datos de una guía existente
   */
  static async update(id: number, dto: IActualizarGuiaSistemaDTO): Promise<IGuiaSistema | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    let fileBuffer: Buffer | null = dto.archivoBlob || null;
    if (!fileBuffer && dto.archivoBase64 && dto.archivoBase64.length > 20) {
      try {
        const cleanBase64 = dto.archivoBase64.includes('base64,')
          ? dto.archivoBase64.split('base64,')[1]
          : dto.archivoBase64;
        fileBuffer = Buffer.from(cleanBase64, 'base64');
      } catch (_e) {
        fileBuffer = null;
      }
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { guiId: id };

    if (dto.guiTitulo !== undefined) {
      setClauses.push('GUI_TITULO = :guiTitulo');
      binds.guiTitulo = dto.guiTitulo.trim();
    }
    if (dto.guiDescripcion !== undefined) {
      setClauses.push('GUI_DESCRIPCION = :guiDescripcion');
      binds.guiDescripcion = dto.guiDescripcion?.trim() || null;
    }
    if (dto.guiTipoContenido !== undefined) {
      setClauses.push('GUI_TIPO_CONTENIDO = :guiTipoContenido');
      binds.guiTipoContenido = dto.guiTipoContenido;
    }
    if (dto.guiUrlRecurso !== undefined) {
      setClauses.push('GUI_URL_RECURSO = :guiUrlRecurso');
      binds.guiUrlRecurso = dto.guiUrlRecurso;
    }
    if (dto.guiModuloDestino !== undefined) {
      setClauses.push('GUI_MODULO_DESTINO = :guiModuloDestino');
      binds.guiModuloDestino = dto.guiModuloDestino.toUpperCase().trim();
    }
    if (dto.guiActivo !== undefined) {
      setClauses.push('GUI_ACTIVO = :guiActivo');
      binds.guiActivo = dto.guiActivo;
    }
    if (fileBuffer) {
      setClauses.push('GUI_ARCHIVO_BLOB = :archivoBlob');
      binds.archivoBlob = fileBuffer;
      if (dto.nombreArchivo) {
        setClauses.push('GUI_NOMBRE_ARCHIVO = :nombreArchivo');
        binds.nombreArchivo = dto.nombreArchivo;
      }
      setClauses.push('GUI_URL_RECURSO = :autoUrl');
      binds.autoUrl = `/api/compras/guias/${id}/archivo`;
    }

    if (setClauses.length > 0) {
      const sql = `UPDATE CMP_GUIA_SISTEMA SET ${setClauses.join(', ')} WHERE GUI_ID_GUIA = :guiId`;
      await withTransaction(async (conn) => {
        await conn.execute(sql, binds);
      });
    }

    return await this.findById(id);
  }

  /**
   * Desactiva / Elimina lógicamente una guía del sistema
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await withTransaction(async (conn) => {
        await conn.execute(`UPDATE CMP_GUIA_SISTEMA SET GUI_ACTIVO = 0 WHERE GUI_ID_GUIA = :guiId`, { guiId: id });
      });
      return true;
    } catch (_e) {
      return false;
    }
  }
}

