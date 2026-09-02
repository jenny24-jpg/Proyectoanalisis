import oracledb from 'oracledb';
import { execute, withTransaction } from '../../../config/database.js';
import { ICotizacion, ICreateCotizacionDTO, IUpdateCotizacionDTO, ICotizacionFilterParams } from '@erp/contracts';

function mapRowToCotizacion(row: any): ICotizacion {
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
  };
}

export class CotizacionRepository {
  static async findAll(filters: ICotizacionFilterParams = {}): Promise<ICotizacion[]> {
    let sql = `
      SELECT 
        COT_ID_COTIZACION,
        COT_NO_DOCUMENTO_SOLICITUD,
        COT_ID_PROVEEDOR,
        COT_PRECIO_TOTAL,
        COT_TIEMPO_ENTREGA_DIAS,
        COT_CONDICION_PAGO_DIAS,
        COT_ES_EXCEPCION_UNICO,
        COT_ESTADO_ADJUDICACION
      FROM CMP_COTIZACION
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.noSolicitud) {
      sql += ` AND COT_NO_DOCUMENTO_SOLICITUD = :noSolicitud`;
      binds.noSolicitud = filters.noSolicitud;
    }

    if (filters.idProveedor) {
      sql += ` AND COT_ID_PROVEEDOR = :idProveedor`;
      binds.idProveedor = filters.idProveedor;
    }

    if (filters.estadoAdjudicacion) {
      sql += ` AND COT_ESTADO_ADJUDICACION = :estadoAdjudicacion`;
      binds.estadoAdjudicacion = filters.estadoAdjudicacion;
    }

    sql += ` ORDER BY COT_ID_COTIZACION DESC`;

    const result = await execute<any>(sql, binds);
    return (result.rows || []).map(mapRowToCotizacion);
  }

  static async findById(id: number, includePdf: boolean = false): Promise<ICotizacion | null> {
    const pdfField = includePdf ? ', COT_ARCHIVO_PDF' : '';
    const sql = `
      SELECT 
        COT_ID_COTIZACION,
        COT_NO_DOCUMENTO_SOLICITUD,
        COT_ID_PROVEEDOR,
        COT_PRECIO_TOTAL,
        COT_TIEMPO_ENTREGA_DIAS,
        COT_CONDICION_PAGO_DIAS,
        COT_ES_EXCEPCION_UNICO,
        COT_ESTADO_ADJUDICACION
        ${pdfField}
      FROM CMP_COTIZACION
      WHERE COT_ID_COTIZACION = :id
    `;

    const result = await execute<any>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToCotizacion(result.rows[0]);
  }

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
      const sql = `
        INSERT INTO CMP_COTIZACION (
          COT_NO_DOCUMENTO_SOLICITUD,
          COT_ID_PROVEEDOR,
          COT_PRECIO_TOTAL,
          COT_TIEMPO_ENTREGA_DIAS,
          COT_CONDICION_PAGO_DIAS,
          COT_ARCHIVO_PDF,
          COT_ES_EXCEPCION_UNICO,
          COT_ESTADO_ADJUDICACION
        ) VALUES (
          :noSolicitud,
          :idProveedor,
          :precioTotal,
          :tiempoEntrega,
          :condicionPago,
          :archivoPdf,
          :esExcepcion,
          :estadoAdjudicacion
        ) RETURNING COT_ID_COTIZACION INTO :outId
      `;

      const binds: any = {
        noSolicitud: data.cotNoDocumentoSolicitud,
        idProveedor: data.cotIdProveedor,
        precioTotal: data.cotPrecioTotal,
        tiempoEntrega: data.cotTiempoEntregaDias ?? null,
        condicionPago: data.cotCondicionPagoDias ?? null,
        archivoPdf: pdfBuffer,
        esExcepcion: data.cotEsExcepcionUnico ?? 0,
        estadoAdjudicacion: data.cotEstadoAdjudicacion ?? 'PENDIENTE',
        outId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      };

      const result = await conn.execute<any>(sql, binds);
      const newId = (result.outBinds as any).outId[0];

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

  static async delete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    const sql = `DELETE FROM CMP_COTIZACION WHERE COT_ID_COTIZACION = :id`;
    await withTransaction(async (conn) => {
      await conn.execute(sql, { id });
    });

    return true;
  }
}
