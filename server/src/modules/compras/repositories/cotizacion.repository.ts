import { execute, withTransaction } from '../../../config/database.js';
import {
  ICotizacion,
  ICreateCotizacionDTO,
  IUpdateCotizacionDTO,
  ICotizacionFilterParams,
  IProveedor,
  ISaveMatrizCotizacionesDTO,
} from '@erp/contracts';

/**
 * Estructura interna de los registros devueltos por Oracle DB para CMP_COTIZACION
 */
interface ICotizacionDbRow {
  COT_ID_COTIZACION: number | string;
  COT_NO_DOCUMENTO_SOLICITUD: string;
  COT_ID_PROVEEDOR: number | string;
  COT_PRECIO_TOTAL: number | string;
  COT_TIEMPO_ENTREGA_DIAS?: number | string | null;
  COT_CONDICION_PAGO_DIAS?: number | string | null;
  COT_ARCHIVO_PDF?: Buffer | Uint8Array | string | null;
  COT_ES_EXCEPCION_UNICO?: number | string | null;
  COT_ESTADO_ADJUDICACION?: string | null;
  PRO_NOMBRE_ENTIDAD?: string | null;
  PRO_NIT?: string | null;
}

/**
 * Mapea una fila cruda de Oracle DB hacia la entidad de dominio ICotizacion
 */
function mapRowToCotizacion(row: ICotizacionDbRow): ICotizacion {
  return {
    cotIdCotizacion: Number(row.COT_ID_COTIZACION),
    cotNoDocumentoSolicitud: String(row.COT_NO_DOCUMENTO_SOLICITUD),
    cotIdProveedor: Number(row.COT_ID_PROVEEDOR),
    cotPrecioTotal: Number(row.COT_PRECIO_TOTAL),
    cotTiempoEntregaDias: row.COT_TIEMPO_ENTREGA_DIAS !== null && row.COT_TIEMPO_ENTREGA_DIAS !== undefined ? Number(row.COT_TIEMPO_ENTREGA_DIAS) : null,
    cotCondicionPagoDias: row.COT_CONDICION_PAGO_DIAS !== null && row.COT_CONDICION_PAGO_DIAS !== undefined ? Number(row.COT_CONDICION_PAGO_DIAS) : null,
    cotArchivoPdf: row.COT_ARCHIVO_PDF ?? null,
    cotEsExcepcionUnico: Number(row.COT_ES_EXCEPCION_UNICO ?? 0),
    cotEstadoAdjudicacion: row.COT_ESTADO_ADJUDICACION ?? 'PENDIENTE',
    cotNombreProveedor: row.PRO_NOMBRE_ENTIDAD ?? null,
    cotNitProveedor: row.PRO_NIT ?? null,
  };
}

/**
 * Repositorio de Acceso a Datos para Cotizaciones en Oracle DB.
 * Maneja consultas SQL preparadas con binds para prevenir inyección SQL.
 */
export class CotizacionRepository {
  /**
   * Consulta todas las cotizaciones con filtros dinámicos y JOIN a PROVEEDOR.
   */
  static async findAll(filters: ICotizacionFilterParams = {}): Promise<ICotizacion[]> {
    let sql = `
      SELECT 
        c.COT_ID_COTIZACION,
        c.COT_NO_DOCUMENTO_SOLICITUD,
        c.COT_ID_PROVEEDOR,
        c.COT_PRECIO_TOTAL,
        c.COT_TIEMPO_ENTREGA_DIAS,
        c.COT_CONDICION_PAGO_DIAS,
        c.COT_ES_EXCEPCION_UNICO,
        c.COT_ESTADO_ADJUDICACION,
        p.PRO_NOMBRE_ENTIDAD,
        p.PRO_NIT
      FROM CMP_COTIZACION c
      LEFT JOIN PROVEEDOR p ON c.COT_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.noSolicitud) {
      sql += ` AND c.COT_NO_DOCUMENTO_SOLICITUD = :noSolicitud`;
      binds.noSolicitud = filters.noSolicitud;
    }

    if (filters.idProveedor) {
      sql += ` AND c.COT_ID_PROVEEDOR = :idProveedor`;
      binds.idProveedor = filters.idProveedor;
    }

    if (filters.estadoAdjudicacion) {
      sql += ` AND c.COT_ESTADO_ADJUDICACION = :estadoAdjudicacion`;
      binds.estadoAdjudicacion = filters.estadoAdjudicacion;
    }

    sql += ` ORDER BY c.COT_ID_COTIZACION DESC`;

    const result = await execute<ICotizacionDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToCotizacion);
  }

  /**
   * Busca una cotización por su clave primaria.
   */
  static async findById(id: number, includePdf: boolean = false): Promise<ICotizacion | null> {
    const pdfField = includePdf ? ', c.COT_ARCHIVO_PDF' : '';
    const sql = `
      SELECT 
        c.COT_ID_COTIZACION,
        c.COT_NO_DOCUMENTO_SOLICITUD,
        c.COT_ID_PROVEEDOR,
        c.COT_PRECIO_TOTAL,
        c.COT_TIEMPO_ENTREGA_DIAS,
        c.COT_CONDICION_PAGO_DIAS,
        c.COT_ES_EXCEPCION_UNICO,
        c.COT_ESTADO_ADJUDICACION,
        p.PRO_NOMBRE_ENTIDAD,
        p.PRO_NIT
        ${pdfField}
      FROM CMP_COTIZACION c
      LEFT JOIN PROVEEDOR p ON c.COT_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
      WHERE c.COT_ID_COTIZACION = :id
    `;

    const result = await execute<ICotizacionDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToCotizacion(result.rows[0]);
  }

  /**
   * Consulta el catálogo de proveedores activos registrados en Oracle DB.
   */
  static async findProveedoresActivos(): Promise<IProveedor[]> {
    const sql = `
      SELECT PRO_ID_PROVEEDOR, PRO_NIT, PRO_NOMBRE_ENTIDAD, PRO_ACTIVO
      FROM PROVEEDOR
      WHERE PRO_ACTIVO = 1
      ORDER BY PRO_NOMBRE_ENTIDAD ASC
    `;
    const result = await execute<any>(sql);
    return (result.rows || []).map((row: any) => ({
      proIdProveedor: Number(row.PRO_ID_PROVEEDOR),
      proNit: row.PRO_NIT ? String(row.PRO_NIT) : null,
      proNombreEntidad: String(row.PRO_NOMBRE_ENTIDAD),
      proActivo: Number(row.PRO_ACTIVO),
    }));
  }

  /**
   * Inserta una cotización individual con cálculo seguro del próximo ID.
   */
  static async create(data: ICreateCotizacionDTO): Promise<ICotizacion> {
    let pdfBuffer: Buffer | null = null;
    if (data.cotArchivoPdf) {
      if (Buffer.isBuffer(data.cotArchivoPdf)) {
        pdfBuffer = data.cotArchivoPdf;
      } else if (typeof data.cotArchivoPdf === 'string') {
        pdfBuffer = Buffer.from(data.cotArchivoPdf, 'base64');
      } else if (data.cotArchivoPdf instanceof Uint8Array) {
        pdfBuffer = Buffer.from(data.cotArchivoPdf);
      }
    }

    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(`SELECT NVL(MAX(COT_ID_COTIZACION), 0) + 1 AS NEXT_ID FROM CMP_COTIZACION`);
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_COTIZACION (
          COT_ID_COTIZACION,
          COT_NO_DOCUMENTO_SOLICITUD,
          COT_ID_PROVEEDOR,
          COT_PRECIO_TOTAL,
          COT_TIEMPO_ENTREGA_DIAS,
          COT_CONDICION_PAGO_DIAS,
          COT_ARCHIVO_PDF,
          COT_ES_EXCEPCION_UNICO,
          COT_ESTADO_ADJUDICACION
        ) VALUES (
          :newId,
          :noSolicitud,
          :idProveedor,
          :precioTotal,
          :tiempoEntrega,
          :condicionPago,
          :archivoPdf,
          :esExcepcion,
          :estadoAdjudicacion
        )
      `;

      const binds: Record<string, any> = {
        newId,
        noSolicitud: data.cotNoDocumentoSolicitud,
        idProveedor: data.cotIdProveedor,
        precioTotal: data.cotPrecioTotal,
        tiempoEntrega: data.cotTiempoEntregaDias ?? null,
        condicionPago: data.cotCondicionPagoDias ?? null,
        archivoPdf: pdfBuffer,
        esExcepcion: data.cotEsExcepcionUnico ?? 0,
        estadoAdjudicacion: data.cotEstadoAdjudicacion ?? 'PENDIENTE',
      };

      await conn.execute(sql, binds);

      return {
        cotIdCotizacion: newId,
        cotNoDocumentoSolicitud: data.cotNoDocumentoSolicitud,
        cotIdProveedor: data.cotIdProveedor,
        cotPrecioTotal: data.cotPrecioTotal,
        cotTiempoEntregaDias: data.cotTiempoEntregaDias ?? null,
        cotCondicionPagoDias: data.cotCondicionPagoDias ?? null,
        cotArchivoPdf: pdfBuffer,
        cotEsExcepcionUnico: data.cotEsExcepcionUnico ?? 0,
        cotEstadoAdjudicacion: data.cotEstadoAdjudicacion ?? 'PENDIENTE',
      };
    });
  }

  /**
   * Actualiza los campos especificados de una cotización existente.
   */
  static async update(id: number, data: IUpdateCotizacionDTO): Promise<ICotizacion | null> {
    const existing = await this.findById(id, true);
    if (!existing) {
      return null;
    }

    let pdfBuffer: Buffer | null | undefined = undefined;
    if (data.cotArchivoPdf !== undefined) {
      if (data.cotArchivoPdf === null) {
        pdfBuffer = null;
      } else if (Buffer.isBuffer(data.cotArchivoPdf)) {
        pdfBuffer = data.cotArchivoPdf;
      } else if (typeof data.cotArchivoPdf === 'string') {
        pdfBuffer = Buffer.from(data.cotArchivoPdf, 'base64');
      } else if (data.cotArchivoPdf instanceof Uint8Array) {
        pdfBuffer = Buffer.from(data.cotArchivoPdf);
      }
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.cotNoDocumentoSolicitud !== undefined) {
      setClauses.push('COT_NO_DOCUMENTO_SOLICITUD = :noSolicitud');
      binds.noSolicitud = data.cotNoDocumentoSolicitud;
    }

    if (data.cotIdProveedor !== undefined) {
      setClauses.push('COT_ID_PROVEEDOR = :idProveedor');
      binds.idProveedor = data.cotIdProveedor;
    }

    if (data.cotPrecioTotal !== undefined) {
      setClauses.push('COT_PRECIO_TOTAL = :precioTotal');
      binds.precioTotal = data.cotPrecioTotal;
    }

    if (data.cotTiempoEntregaDias !== undefined) {
      setClauses.push('COT_TIEMPO_ENTREGA_DIAS = :tiempoEntrega');
      binds.tiempoEntrega = data.cotTiempoEntregaDias;
    }

    if (data.cotCondicionPagoDias !== undefined) {
      setClauses.push('COT_CONDICION_PAGO_DIAS = :condicionPago');
      binds.condicionPago = data.cotCondicionPagoDias;
    }

    if (pdfBuffer !== undefined) {
      setClauses.push('COT_ARCHIVO_PDF = :archivoPdf');
      binds.archivoPdf = pdfBuffer;
    }

    if (data.cotEsExcepcionUnico !== undefined) {
      setClauses.push('COT_ES_EXCEPCION_UNICO = :esExcepcion');
      binds.esExcepcion = data.cotEsExcepcionUnico;
    }

    if (data.cotEstadoAdjudicacion !== undefined) {
      setClauses.push('COT_ESTADO_ADJUDICACION = :estadoAdjudicacion');
      binds.estadoAdjudicacion = data.cotEstadoAdjudicacion;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE CMP_COTIZACION
      SET ${setClauses.join(', ')}
      WHERE COT_ID_COTIZACION = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina una cotización desvinculando de forma segura registros dependientes.
   */
  static async delete(id: number): Promise<boolean> {
    if (!id || id <= 0) return true;

    await withTransaction(async (conn) => {
      // 1. Asegurar que la columna sea NULLABLE si estaba definida como NOT NULL
      try {
        await conn.execute(`ALTER TABLE CMP_ORDEN_COMPRA MODIFY OCO_ID_COTIZACION_GANADORA NULL`);
      } catch (_err) {
        // Ignorar si ya es NULLABLE
      }

      // 2. Desacoplar referencias foráneas en CMP_ORDEN_COMPRA
      try {
        await conn.execute(
          `UPDATE CMP_ORDEN_COMPRA SET OCO_ID_COTIZACION_GANADORA = NULL WHERE OCO_ID_COTIZACION_GANADORA = :id`,
          { id }
        );
      } catch (_err) {
        // Ignorar si la tabla no existe
      }

      // 3. Eliminar la cotización de CMP_COTIZACION
      await conn.execute(
        `DELETE FROM CMP_COTIZACION WHERE COT_ID_COTIZACION = :id`,
        { id }
      );
    });

    return true;
  }

  /**
   * Ejecuta en una única transacción atómica el guardado de la Matriz (DELETE, UPDATE, INSERT).
   */
  static async saveMatriz(dto: ISaveMatrizCotizacionesDTO): Promise<ICotizacion[]> {
    return await withTransaction(async (conn) => {
      // 1. Procesar eliminaciones si existen
      if (dto.eliminarCotizacionIds && dto.eliminarCotizacionIds.length > 0) {
        for (const delId of dto.eliminarCotizacionIds) {
          if (delId && delId > 0) {
            try {
              await conn.execute(`ALTER TABLE CMP_ORDEN_COMPRA MODIFY OCO_ID_COTIZACION_GANADORA NULL`);
            } catch (_e) {}

            try {
              await conn.execute(
                `UPDATE CMP_ORDEN_COMPRA SET OCO_ID_COTIZACION_GANADORA = NULL WHERE OCO_ID_COTIZACION_GANADORA = :delId`,
                { delId }
              );
            } catch (_e) {}

            await conn.execute(
              `DELETE FROM CMP_COTIZACION WHERE COT_ID_COTIZACION = :delId`,
              { delId }
            );
          }
        }
      }

      // 2. Procesar inserciones y actualizaciones
      const esExcepcion = dto.esExcepcionUnico ? 1 : 0;

      for (const item of dto.cotizaciones) {
        let pdfBuffer: Buffer | null = null;
        if (item.archivoPdf) {
          if (Buffer.isBuffer(item.archivoPdf)) {
            pdfBuffer = item.archivoPdf;
          } else if (typeof item.archivoPdf === 'string') {
            pdfBuffer = Buffer.from(item.archivoPdf, 'base64');
          } else if (item.archivoPdf instanceof Uint8Array) {
            pdfBuffer = Buffer.from(item.archivoPdf);
          }
        }

        if (item.idCotizacion && item.idCotizacion > 0) {
          // Verificar si existe en la base de datos
          const checkRes = await conn.execute<any>(
            `SELECT COT_ID_COTIZACION FROM CMP_COTIZACION WHERE COT_ID_COTIZACION = :id`,
            { id: item.idCotizacion }
          );

          if (checkRes.rows && checkRes.rows.length > 0) {
            // UPDATE
            const updateSql = `
              UPDATE CMP_COTIZACION
              SET 
                COT_NO_DOCUMENTO_SOLICITUD = :noSol,
                COT_ID_PROVEEDOR = :idProv,
                COT_PRECIO_TOTAL = :precio,
                COT_TIEMPO_ENTREGA_DIAS = :entrega,
                COT_CONDICION_PAGO_DIAS = :condicion,
                COT_ES_EXCEPCION_UNICO = :esExcepcion,
                COT_ESTADO_ADJUDICACION = 'PENDIENTE'
                ${pdfBuffer ? ', COT_ARCHIVO_PDF = :pdf' : ''}
              WHERE COT_ID_COTIZACION = :id
            `;
            const binds: Record<string, any> = {
              noSol: dto.noSolicitud,
              idProv: item.idProveedor,
              precio: item.precioTotal,
              entrega: item.tiempoEntregaDias ?? null,
              condicion: item.condicionPagoDias ?? null,
              esExcepcion,
              id: item.idCotizacion,
            };
            if (pdfBuffer) binds.pdf = pdfBuffer;

            await conn.execute(updateSql, binds);
            continue;
          }
        }

        // INSERT nueva cotización
        const nextIdRes = await conn.execute<any>(
          `SELECT NVL(MAX(COT_ID_COTIZACION), 0) + 1 AS NEXT_ID FROM CMP_COTIZACION`
        );
        const rows = nextIdRes.rows || [];
        const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

        const insertSql = `
          INSERT INTO CMP_COTIZACION (
            COT_ID_COTIZACION,
            COT_NO_DOCUMENTO_SOLICITUD,
            COT_ID_PROVEEDOR,
            COT_PRECIO_TOTAL,
            COT_TIEMPO_ENTREGA_DIAS,
            COT_CONDICION_PAGO_DIAS,
            COT_ARCHIVO_PDF,
            COT_ES_EXCEPCION_UNICO,
            COT_ESTADO_ADJUDICACION
          ) VALUES (
            :newId,
            :noSol,
            :idProv,
            :precio,
            :entrega,
            :condicion,
            :pdf,
            :esExcepcion,
            'PENDIENTE'
          )
        `;
        await conn.execute(insertSql, {
          newId,
          noSol: dto.noSolicitud,
          idProv: item.idProveedor,
          precio: item.precioTotal,
          entrega: item.tiempoEntregaDias ?? null,
          condicion: item.condicionPagoDias ?? null,
          pdf: pdfBuffer,
          esExcepcion,
        });
      }

      // 3. Consultar y retornar las cotizaciones vigentes para esta solicitud
      const resFinal = await conn.execute<ICotizacionDbRow>(
        `SELECT 
          c.COT_ID_COTIZACION,
          c.COT_NO_DOCUMENTO_SOLICITUD,
          c.COT_ID_PROVEEDOR,
          c.COT_PRECIO_TOTAL,
          c.COT_TIEMPO_ENTREGA_DIAS,
          c.COT_CONDICION_PAGO_DIAS,
          c.COT_ES_EXCEPCION_UNICO,
          c.COT_ESTADO_ADJUDICACION,
          p.PRO_NOMBRE_ENTIDAD,
          p.PRO_NIT
        FROM CMP_COTIZACION c
        LEFT JOIN PROVEEDOR p ON c.COT_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
        WHERE c.COT_NO_DOCUMENTO_SOLICITUD = :noSol
        ORDER BY c.COT_ID_COTIZACION ASC`,
        { noSol: dto.noSolicitud }
      );

      return (resFinal.rows || []).map(mapRowToCotizacion);
    });
  }
}
