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
 * Helper para extraer Buffer de un archivo binario o string base64
 */
export function extractBufferFromData(val: any): Buffer | null {
  if (!val) return null;
  if (Buffer.isBuffer(val)) return val;
  if (val instanceof Uint8Array) return Buffer.from(val);
  if (typeof val === 'string') {
    const raw = val.includes(',') ? val.split(',')[1] : val;
    try {
      return Buffer.from(raw, 'base64');
    } catch {
      return null;
    }
  }
  return null;
}

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
  COT_RUTA_ARCHIVO_PDF?: string | null;
  COT_ARCHIVO_BLOB?: Buffer | Uint8Array | null;
  COT_ES_EXCEPCION_UNICO?: number | string | null;
  COT_ESTADO_ADJUDICACION?: string | null;
  PRO_NOMBRE_ENTIDAD?: string | null;
  PRO_NIT?: string | null;
}

/**
 * Mapea una fila cruda de Oracle DB hacia la entidad de dominio ICotizacion
 */
function mapRowToCotizacion(row: ICotizacionDbRow, detalles: any[] = []): ICotizacion {
  const ruta = row.COT_RUTA_ARCHIVO_PDF ? String(row.COT_RUTA_ARCHIVO_PDF) : null;
  return {
    cotIdCotizacion: Number(row.COT_ID_COTIZACION),
    cotNoDocumentoSolicitud: String(row.COT_NO_DOCUMENTO_SOLICITUD),
    cotIdProveedor: Number(row.COT_ID_PROVEEDOR),
    cotPrecioTotal: Number(row.COT_PRECIO_TOTAL),
    cotTiempoEntregaDias: row.COT_TIEMPO_ENTREGA_DIAS !== null && row.COT_TIEMPO_ENTREGA_DIAS !== undefined ? Number(row.COT_TIEMPO_ENTREGA_DIAS) : null,
    cotCondicionPagoDias: row.COT_CONDICION_PAGO_DIAS !== null && row.COT_CONDICION_PAGO_DIAS !== undefined ? Number(row.COT_CONDICION_PAGO_DIAS) : null,
    cotRutaArchivoPdf: ruta,
    cotArchivoPdf: ruta,
    cotEsExcepcionUnico: Number(row.COT_ES_EXCEPCION_UNICO ?? 0),
    cotEstadoAdjudicacion: row.COT_ESTADO_ADJUDICACION ?? 'PENDIENTE',
    cotNombreProveedor: row.PRO_NOMBRE_ENTIDAD ?? null,
    cotNitProveedor: row.PRO_NIT ?? null,
    detalles: detalles || [],
  };
}


/**
 * Repositorio de Acceso a Datos para Cotizaciones en Oracle DB.
 * Maneja consultas SQL preparadas con binds para prevenir inyección SQL.
 */
export class CotizacionRepository {
  /**
   * Obtiene los detalles (desglose por artículo) de una cotización desde CMP_DETALLE_COTIZACION
   */
  static async findDetalles(cotId: number): Promise<any[]> {
    const sql = `
      SELECT 
        d.DCO_ID_DETALLE_COTIZACION,
        d.DCO_ID_COTIZACION,
        d.DCO_CODIGO_ARTICULO,
        a.ART_DESCRIPCION,
        d.DCO_CANTIDAD_COTIZADA,
        d.DCO_PRECIO_UNITARIO,
        d.DCO_SUBTOTAL_LINEA,
        d.DCO_OBSERVACIONES,
        d.DCO_ES_SUSTITUTO
      FROM CMP_DETALLE_COTIZACION d
      LEFT JOIN CMP_ARTICULO a ON d.DCO_CODIGO_ARTICULO = a.ART_CODIGO_ARTICULO
      WHERE d.DCO_ID_COTIZACION = :cotId
      ORDER BY d.DCO_ID_DETALLE_COTIZACION ASC
    `;
    try {
      const res = await execute<any>(sql, { cotId });
      return (res.rows || []).map((r: any) => ({
        dcoIdDetalleCotizacion: Number(r.DCO_ID_DETALLE_COTIZACION),
        dcoIdCotizacion: Number(r.DCO_ID_COTIZACION),
        dcoCodigoArticulo: String(r.DCO_CODIGO_ARTICULO),
        artDescripcion: r.ART_DESCRIPCION ? String(r.ART_DESCRIPCION) : null,
        dcoCantidadCotizada: Number(r.DCO_CANTIDAD_COTIZADA),
        dcoPrecioUnitario: Number(r.DCO_PRECIO_UNITARIO),
        dcoSubtotalLinea: Number(r.DCO_SUBTOTAL_LINEA),
        dcoObservaciones: r.DCO_OBSERVACIONES ? String(r.DCO_OBSERVACIONES) : null,
        dcoEsSustituto: Number(r.DCO_ES_SUSTITUTO || 0),
      }));
    } catch (_e) {
      return [];
    }
  }

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
        c.COT_RUTA_ARCHIVO_PDF,
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
    const cotizaciones = (result.rows || []).map((r) => mapRowToCotizacion(r));

    // Cargar detalles de líneas de cada cotización
    for (const cot of cotizaciones) {
      cot.detalles = await this.findDetalles(cot.cotIdCotizacion);
    }

    return cotizaciones;
  }

  /**
   * Busca una cotización por su clave primaria.
   */
  static async findById(id: number, _includePdf: boolean = false): Promise<ICotizacion | null> {
    const sql = `
      SELECT 
        c.COT_ID_COTIZACION,
        c.COT_NO_DOCUMENTO_SOLICITUD,
        c.COT_ID_PROVEEDOR,
        c.COT_PRECIO_TOTAL,
        c.COT_TIEMPO_ENTREGA_DIAS,
        c.COT_CONDICION_PAGO_DIAS,
        c.COT_RUTA_ARCHIVO_PDF,
        c.COT_ES_EXCEPCION_UNICO,
        c.COT_ESTADO_ADJUDICACION,
        p.PRO_NOMBRE_ENTIDAD,
        p.PRO_NIT
      FROM CMP_COTIZACION c
      LEFT JOIN PROVEEDOR p ON c.COT_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
      WHERE c.COT_ID_COTIZACION = :id
    `;

    const result = await execute<ICotizacionDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    const cot = mapRowToCotizacion(result.rows[0]);
    cot.detalles = await this.findDetalles(id);
    return cot;
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
   * Inserta una cotización individual con cálculo seguro del próximo ID y guardado BLOB.
   */
  static async create(data: ICreateCotizacionDTO): Promise<ICotizacion> {
    const rawPdf = data.cotArchivoPdf || (data as any).archivoPdf;
    const pdfBuffer = extractBufferFromData(rawPdf);
    const rutaPdf = (data as any).archivoPdfNombre || data.cotRutaArchivoPdf || (pdfBuffer ? 'cotizacion_adjunta.pdf' : null);

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
          COT_RUTA_ARCHIVO_PDF,
          COT_ARCHIVO_BLOB,
          COT_ES_EXCEPCION_UNICO,
          COT_ESTADO_ADJUDICACION
        ) VALUES (
          :newId,
          :noSolicitud,
          :idProveedor,
          :precioTotal,
          :tiempoEntrega,
          :condicionPago,
          :rutaPdf,
          :blobPdf,
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
        rutaPdf,
        blobPdf: pdfBuffer || null,
        esExcepcion: data.cotEsExcepcionUnico ?? 0,
        estadoAdjudicacion: data.cotEstadoAdjudicacion ?? 'PENDIENTE',
      };

      await conn.execute(sql, binds);

      if (data.detalles && data.detalles.length > 0) {
        for (const d of data.detalles) {
          const cant = Number(d.cantidadCotizada || 0);
          const precio = Number(d.precioUnitario || 0);
          const subtotal = Number(d.subtotalLinea ?? +(cant * precio).toFixed(2));
          const obs = d.observaciones ? String(d.observaciones).trim() : null;
          const esSust = d.esSustituto ? 1 : 0;
          await conn.execute(
            `INSERT INTO CMP_DETALLE_COTIZACION (
              DCO_ID_COTIZACION,
              DCO_CODIGO_ARTICULO,
              DCO_CANTIDAD_COTIZADA,
              DCO_PRECIO_UNITARIO,
              DCO_SUBTOTAL_LINEA,
              DCO_OBSERVACIONES,
              DCO_ES_SUSTITUTO
            ) VALUES (
              :cotId,
              :codArt,
              :cant,
              :precio,
              :subtotal,
              :obs,
              :esSust
            )`,
            {
              cotId: newId,
              codArt: d.codigoArticulo,
              cant,
              precio,
              subtotal,
              obs,
              esSust,
            }
          );
        }
      }

      return {
        cotIdCotizacion: newId,
        cotNoDocumentoSolicitud: data.cotNoDocumentoSolicitud,
        cotIdProveedor: data.cotIdProveedor,
        cotPrecioTotal: data.cotPrecioTotal,
        cotTiempoEntregaDias: data.cotTiempoEntregaDias ?? null,
        cotCondicionPagoDias: data.cotCondicionPagoDias ?? null,
        cotRutaArchivoPdf: rutaPdf,
        cotArchivoPdf: rutaPdf,
        cotEsExcepcionUnico: data.cotEsExcepcionUnico ?? 0,
        cotEstadoAdjudicacion: data.cotEstadoAdjudicacion ?? 'PENDIENTE',
      };
    });
  }

  /**
   * Actualiza los campos especificados de una cotización existente y su BLOB.
   */
  static async update(id: number, data: IUpdateCotizacionDTO): Promise<ICotizacion | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const rawPdf = data.cotArchivoPdf || (data as any).archivoPdf;
    const pdfBuffer = extractBufferFromData(rawPdf);
    let rutaPdf: string | null | undefined = undefined;

    if (pdfBuffer) {
      rutaPdf = (data as any).archivoPdfNombre || data.cotRutaArchivoPdf || `cotizacion_${id}.pdf`;
    } else if (data.cotRutaArchivoPdf !== undefined) {
      rutaPdf = data.cotRutaArchivoPdf;
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

    if (rutaPdf !== undefined) {
      setClauses.push('COT_RUTA_ARCHIVO_PDF = :rutaPdf');
      binds.rutaPdf = rutaPdf;
    }

    if (pdfBuffer) {
      setClauses.push('COT_ARCHIVO_BLOB = :pdfBlob');
      binds.pdfBlob = pdfBuffer;
    }


    if (data.cotEsExcepcionUnico !== undefined) {
      setClauses.push('COT_ES_EXCEPCION_UNICO = :esExcepcion');
      binds.esExcepcion = data.cotEsExcepcionUnico;
    }

    if (data.cotEstadoAdjudicacion !== undefined) {
      setClauses.push('COT_ESTADO_ADJUDICACION = :estadoAdjudicacion');
      binds.estadoAdjudicacion = data.cotEstadoAdjudicacion;
    }

    await withTransaction(async (conn) => {
      if (setClauses.length > 0) {
        const sql = `
          UPDATE CMP_COTIZACION
          SET ${setClauses.join(', ')}
          WHERE COT_ID_COTIZACION = :id
        `;
        await conn.execute(sql, binds);
      }

      if (data.detalles !== undefined) {
        try {
          await conn.execute(`DELETE FROM CMP_DETALLE_COTIZACION WHERE DCO_ID_COTIZACION = :id`, { id });
          for (const d of data.detalles) {
            const cant = Number(d.cantidadCotizada || 0);
            const precio = Number(d.precioUnitario || 0);
            const subtotal = Number(d.subtotalLinea ?? +(cant * precio).toFixed(2));
            const obs = d.observaciones ? String(d.observaciones).trim() : null;
            const esSust = d.esSustituto ? 1 : 0;
            await conn.execute(
              `INSERT INTO CMP_DETALLE_COTIZACION (
                DCO_ID_COTIZACION,
                DCO_CODIGO_ARTICULO,
                DCO_CANTIDAD_COTIZADA,
                DCO_PRECIO_UNITARIO,
                DCO_SUBTOTAL_LINEA,
                DCO_OBSERVACIONES,
                DCO_ES_SUSTITUTO
              ) VALUES (
                :cotId,
                :codArt,
                :cant,
                :precio,
                :subtotal,
                :obs,
                :esSust
              )`,
              {
                cotId: id,
                codArt: d.codigoArticulo,
                cant,
                precio,
                subtotal,
                obs,
                esSust,
              }
            );
          }
        } catch (_e) {}
      }
    });

    return await this.findById(id);
  }

  /**
   * Elimina una cotización desvinculando de forma segura registros dependientes.
   */
  static async delete(id: number): Promise<boolean> {
    if (!id || id <= 0) return true;

    await withTransaction(async (conn) => {
      // 1. Eliminar líneas de detalle en CMP_DETALLE_COTIZACION
      try {
        await conn.execute(`DELETE FROM CMP_DETALLE_COTIZACION WHERE DCO_ID_COTIZACION = :id`, { id });
      } catch (_e) {}

      // 2. Desacoplar referencias foráneas en CMP_ORDEN_COMPRA
      try {
        await conn.execute(`ALTER TABLE CMP_ORDEN_COMPRA MODIFY OCO_ID_COTIZACION_GANADORA NULL`);
      } catch (_err) {}

      try {
        await conn.execute(
          `UPDATE CMP_ORDEN_COMPRA SET OCO_ID_COTIZACION_GANADORA = NULL WHERE OCO_ID_COTIZACION_GANADORA = :id`,
          { id }
        );
      } catch (_err) {}

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
        let rutaPdf: string | null = item.rutaArchivoPdf || item.archivoPdfNombre || null;
        if (!rutaPdf && typeof item.archivoPdf === 'string' && item.archivoPdf.length <= 255) {
          rutaPdf = item.archivoPdf;
        }

        const isRawBase64 = item.archivoPdf && (Buffer.isBuffer(item.archivoPdf) || (typeof item.archivoPdf === 'string' && item.archivoPdf.length > 255));

        if (item.idCotizacion && item.idCotizacion > 0) {
          // Verificar si existe en la base de datos
          const checkRes = await conn.execute<any>(
            `SELECT COT_ID_COTIZACION, COT_RUTA_ARCHIVO_PDF, COT_ESTADO_ADJUDICACION FROM CMP_COTIZACION WHERE COT_ID_COTIZACION = :id`,
            { id: item.idCotizacion }
          );

          if (checkRes.rows && checkRes.rows.length > 0) {
            const existingAdj = checkRes.rows[0].COT_ESTADO_ADJUDICACION ? String(checkRes.rows[0].COT_ESTADO_ADJUDICACION) : 'PENDIENTE';
            const pdfBuffer = isRawBase64 ? extractBufferFromData(item.archivoPdf) : null;
            if (pdfBuffer) {
              rutaPdf = item.archivoPdfNombre || `cotizacion_${item.idCotizacion}.pdf`;
            } else if (!rutaPdf) {
              rutaPdf = checkRes.rows[0].COT_RUTA_ARCHIVO_PDF ? String(checkRes.rows[0].COT_RUTA_ARCHIVO_PDF) : null;
            }

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
                COT_ESTADO_ADJUDICACION = :estadoAdj
                ${rutaPdf !== null ? ', COT_RUTA_ARCHIVO_PDF = :rutaPdf' : ''}
                ${pdfBuffer ? ', COT_ARCHIVO_BLOB = :pdfBlob' : ''}
              WHERE COT_ID_COTIZACION = :id
            `;
            const binds: Record<string, any> = {
              noSol: dto.noSolicitud,
              idProv: item.idProveedor,
              precio: item.precioTotal,
              entrega: item.tiempoEntregaDias ?? null,
              condicion: item.condicionPagoDias ?? null,
              esExcepcion,
              estadoAdj: existingAdj,
              id: item.idCotizacion,
            };
            if (rutaPdf !== null) binds.rutaPdf = rutaPdf;
            if (pdfBuffer) binds.pdfBlob = pdfBuffer;

            await conn.execute(updateSql, binds);

            if (item.detalles && item.detalles.length > 0) {
              try {
                await conn.execute(`DELETE FROM CMP_DETALLE_COTIZACION WHERE DCO_ID_COTIZACION = :id`, { id: item.idCotizacion });
                for (const d of item.detalles) {
                  const cant = Number(d.cantidadCotizada || 0);
                  const precio = Number(d.precioUnitario || 0);
                  const subtotal = Number(d.subtotalLinea ?? +(cant * precio).toFixed(2));
                  const obs = d.observaciones ? String(d.observaciones).trim() : null;
                  const esSust = d.esSustituto ? 1 : 0;
                  if (esSust && d.codigoArticulo) {
                    try {
                      let finalCodArt = String(d.codigoArticulo).trim().toUpperCase();
                      const chkArt = await conn.execute<any>(
                        `SELECT ART_CODIGO_ARTICULO FROM CMP_ARTICULO WHERE UPPER(ART_CODIGO_ARTICULO) = UPPER(:codArt)`,
                        { codArt: finalCodArt }
                      );

                      const catId = d.idCategoria ? Number(d.idCategoria) : 1;
                      const marId = d.idMarca ? Number(d.idMarca) : 1;
                      const umeId = d.idUnidadMedida ? Number(d.idUnidadMedida) : 1;

                      if (!chkArt.rows || chkArt.rows.length === 0) {
                        await conn.execute(
                          `INSERT INTO CMP_ARTICULO (
                            ART_CODIGO_ARTICULO,
                            ART_DESCRIPCION,
                            ART_ID_CATEGORIA,
                            ART_ID_MARCA,
                            ART_ID_UNIDAD_COMPRA,
                            ART_ID_UNIDAD_VENTA,
                            ART_MANEJA_LOTE,
                            ART_ACTIVO
                          ) VALUES (
                            :codArt,
                            :descArt,
                            :catId,
                            :marId,
                            :umeId,
                            :umeId,
                            0,
                            0
                          )`,
                          {
                            codArt: finalCodArt,
                            descArt: d.descripcionArticulo || `Producto Sustituto (${finalCodArt})`,
                            catId,
                            marId,
                            umeId,
                          }
                        );
                      }
                    } catch (errProv) {
                      console.warn(`[CotizacionRepository] Error al registrar artículo sustituto provisional inactivo:`, errProv);
                    }
                  }

                  await conn.execute(
                    `INSERT INTO CMP_DETALLE_COTIZACION (
                      DCO_ID_COTIZACION,
                      DCO_CODIGO_ARTICULO,
                      DCO_CANTIDAD_COTIZADA,
                      DCO_PRECIO_UNITARIO,
                      DCO_SUBTOTAL_LINEA,
                      DCO_OBSERVACIONES,
                      DCO_ES_SUSTITUTO
                    ) VALUES (
                      :cotId,
                      :codArt,
                      :cant,
                      :precio,
                      :subtotal,
                      :obs,
                      :esSust
                    )`,
                    {
                      cotId: item.idCotizacion,
                      codArt: d.codigoArticulo,
                      cant,
                      precio,
                      subtotal,
                      obs,
                      esSust,
                    }
                  );
                }
              } catch (_e) {}
            }

            continue;
          }
        }

        // INSERT nueva cotización
        const nextIdRes = await conn.execute<any>(
          `SELECT NVL(MAX(COT_ID_COTIZACION), 0) + 1 AS NEXT_ID FROM CMP_COTIZACION`
        );
        const rows = nextIdRes.rows || [];
        const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;
        const pdfBuffer = isRawBase64 ? extractBufferFromData(item.archivoPdf) : null;
        if (pdfBuffer) {
          rutaPdf = item.archivoPdfNombre || `cotizacion_${newId}.pdf`;
        }

        const insertSql = `
          INSERT INTO CMP_COTIZACION (
            COT_ID_COTIZACION,
            COT_NO_DOCUMENTO_SOLICITUD,
            COT_ID_PROVEEDOR,
            COT_PRECIO_TOTAL,
            COT_TIEMPO_ENTREGA_DIAS,
            COT_CONDICION_PAGO_DIAS,
            COT_RUTA_ARCHIVO_PDF,
            COT_ARCHIVO_BLOB,
            COT_ES_EXCEPCION_UNICO,
            COT_ESTADO_ADJUDICACION
          ) VALUES (
            :newId,
            :noSol,
            :idProv,
            :precio,
            :entrega,
            :condicion,
            :rutaPdf,
            :pdfBlob,
            :esExcepcion,
            :estadoAdj
          )
        `;
        await conn.execute(insertSql, {
          newId,
          noSol: dto.noSolicitud,
          idProv: item.idProveedor,
          precio: item.precioTotal,
          entrega: item.tiempoEntregaDias ?? null,
          condicion: item.condicionPagoDias ?? null,
          rutaPdf: rutaPdf ?? null,
          pdfBlob: pdfBuffer || null,
          esExcepcion,
          estadoAdj: 'PENDIENTE',
        });

        if (item.detalles && item.detalles.length > 0) {
          try {
            for (const d of item.detalles) {
              const cant = Number(d.cantidadCotizada || 0);
              const precio = Number(d.precioUnitario || 0);
              const subtotal = Number(d.subtotalLinea ?? +(cant * precio).toFixed(2));
              const obs = d.observaciones ? String(d.observaciones).trim() : null;
              const esSust = d.esSustituto ? 1 : 0;
              if (esSust && d.codigoArticulo) {
                try {
                  let finalCodArt = String(d.codigoArticulo).trim().toUpperCase();
                  const chkArt = await conn.execute<any>(
                    `SELECT ART_CODIGO_ARTICULO FROM CMP_ARTICULO WHERE UPPER(ART_CODIGO_ARTICULO) = UPPER(:codArt)`,
                    { codArt: finalCodArt }
                  );

                  const catId = d.idCategoria ? Number(d.idCategoria) : 1;
                  const marId = d.idMarca ? Number(d.idMarca) : 1;
                  const umeId = d.idUnidadMedida ? Number(d.idUnidadMedida) : 1;

                  if (!chkArt.rows || chkArt.rows.length === 0) {
                    await conn.execute(
                      `INSERT INTO CMP_ARTICULO (
                        ART_CODIGO_ARTICULO,
                        ART_DESCRIPCION,
                        ART_ID_CATEGORIA,
                        ART_ID_MARCA,
                        ART_ID_UNIDAD_COMPRA,
                        ART_ID_UNIDAD_VENTA,
                        ART_MANEJA_LOTE,
                        ART_ACTIVO
                      ) VALUES (
                        :codArt,
                        :descArt,
                        :catId,
                        :marId,
                        :umeId,
                        :umeId,
                        0,
                        0
                      )`,
                      {
                        codArt: finalCodArt,
                        descArt: d.descripcionArticulo || `Producto Sustituto (${finalCodArt})`,
                        catId,
                        marId,
                        umeId,
                      }
                    );
                  }
                } catch (errProv) {
                  console.warn(`[CotizacionRepository] Error al registrar artículo sustituto provisional inactivo:`, errProv);
                }
              }

              await conn.execute(
                `INSERT INTO CMP_DETALLE_COTIZACION (
                  DCO_ID_COTIZACION,
                  DCO_CODIGO_ARTICULO,
                  DCO_CANTIDAD_COTIZADA,
                  DCO_PRECIO_UNITARIO,
                  DCO_SUBTOTAL_LINEA,
                  DCO_OBSERVACIONES,
                  DCO_ES_SUSTITUTO
                ) VALUES (
                  :cotId,
                  :codArt,
                  :cant,
                  :precio,
                  :subtotal,
                  :obs,
                  :esSust
                )`,
                {
                  cotId: newId,
                  codArt: d.codigoArticulo,
                  cant,
                  precio,
                  subtotal,
                  obs,
                  esSust,
                }
              );
            }
          } catch (_e) {}
        }
      }

      // 3. Actualizar estado y ciclo de vida de la solicitud atómicamente a EN_PROCESO (Etapa 3: Selección)
      try {
        const estRes = await conn.execute<any>(
          `SELECT EST_ID_ESTADO FROM CMP_ESTADO WHERE UPPER(EST_NOMBRE_ESTADO) IN ('EN_PROCESO', 'EN PROCESO', 'COTIZADA') AND ROWNUM = 1`
        );
        const estId = estRes.rows?.[0]?.EST_ID_ESTADO ? Number(estRes.rows[0].EST_ID_ESTADO) : 3;
        const totalCotizado = dto.cotizaciones.reduce((acc, c) => Math.max(acc, Number(c.precioTotal || 0)), 0);

        await conn.execute(
          `UPDATE CMP_SOLICITUD_COMPRA 
           SET SOL_ID_ESTADO = :estId,
               SOL_MONTO_TOTAL_ESTIMADO = CASE WHEN :totalCotizado > 0 THEN :totalCotizado ELSE SOL_MONTO_TOTAL_ESTIMADO END
           WHERE TRIM(UPPER(SOL_NO_DOCUMENTO)) = TRIM(UPPER(:noSol))`,
          { estId, totalCotizado, noSol: dto.noSolicitud }
        );

        if (dto.esExcepcionUnico && dto.justificacionExcepcion) {
          const justNota = `[PROVEEDOR UNICO]: ${dto.justificacionExcepcion.trim()}`;
          await conn.execute(
            `UPDATE CMP_SOLICITUD_COMPRA
             SET SOL_NOTAS = CASE 
                               WHEN SOL_NOTAS IS NULL THEN :justNota 
                               WHEN INSTR(SOL_NOTAS, :justNota) = 0 THEN SUBSTR(SOL_NOTAS || ' | ' || :justNota, 1, 500)
                               ELSE SOL_NOTAS 
                             END
             WHERE TRIM(UPPER(SOL_NO_DOCUMENTO)) = TRIM(UPPER(:noSol))`,
            { justNota, noSol: dto.noSolicitud }
          );
        }
      } catch (errEst) {
        console.error(`[CotizacionRepository.saveMatriz] Error al actualizar estado de la solicitud:`, errEst);
      }

      // 4. Consultar y retornar las cotizaciones vigentes para esta solicitud
      const resFinal = await conn.execute<ICotizacionDbRow>(
        `SELECT 
          c.COT_ID_COTIZACION,
          c.COT_NO_DOCUMENTO_SOLICITUD,
          c.COT_ID_PROVEEDOR,
          c.COT_PRECIO_TOTAL,
          c.COT_TIEMPO_ENTREGA_DIAS,
          c.COT_CONDICION_PAGO_DIAS,
          c.COT_RUTA_ARCHIVO_PDF,
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

      return (resFinal.rows || []).map((r) => mapRowToCotizacion(r));
    });
  }

  /**
   * Adjudica formalmente una cotización como ganadora para una solicitud.
   * Marca la cotización ganadora como 'GANADORA', las demás de la solicitud como 'RECHAZADA',
   * y registra la justificación en las notas correspondientes.
   */
  static async adjudicar(idCotizacion: number, noSolicitud: string, justificacion?: string): Promise<ICotizacion> {
    return await withTransaction(async (conn) => {
      // 0. Creación Diferida en CMP_ARTICULO para productos sustitutos o códigos no registrados
      try {
        const detGanRes = await conn.execute<any>(
          `SELECT 
            DCO_CODIGO_ARTICULO,
            DCO_OBSERVACIONES,
            DCO_ES_SUSTITUTO,
            DCO_CANTIDAD_COTIZADA,
            DCO_PRECIO_UNITARIO
           FROM CMP_DETALLE_COTIZACION
           WHERE DCO_ID_COTIZACION = :idCotizacion`,
          { idCotizacion }
        );

        if (detGanRes.rows && detGanRes.rows.length > 0) {
          for (const d of detGanRes.rows) {
            const codArt = d.DCO_CODIGO_ARTICULO ? String(d.DCO_CODIGO_ARTICULO).trim() : '';
            if (!codArt) continue;

            const existArt = await conn.execute<any>(
              `SELECT ART_CODIGO_ARTICULO FROM CMP_ARTICULO WHERE UPPER(ART_CODIGO_ARTICULO) = UPPER(:codArt)`,
              { codArt }
            );

            if (existArt.rows && existArt.rows.length > 0) {
              // Si el artículo ya existía (ej. insertado como INACTIVO 0 al cotizar sustituto), activarlo formalmente
              await conn.execute(
                `UPDATE CMP_ARTICULO 
                 SET ART_ACTIVO = 1 
                 WHERE UPPER(ART_CODIGO_ARTICULO) = UPPER(:codArt)`,
                { codArt }
              );
            } else {
              let catId = 1;
              try {
                const catRes = await conn.execute<any>(`SELECT CAT_ID_CATEGORIA FROM CMP_CATEGORIA WHERE CAT_ACTIVO = 1 AND ROWNUM = 1`);
                if (catRes.rows?.[0]?.CAT_ID_CATEGORIA) catId = Number(catRes.rows[0].CAT_ID_CATEGORIA);
              } catch (_e) {}

              let marId = 1;
              try {
                const marRes = await conn.execute<any>(`SELECT MAR_ID_MARCA FROM CMP_MARCA WHERE MAR_ACTIVO = 1 AND ROWNUM = 1`);
                if (marRes.rows?.[0]?.MAR_ID_MARCA) marId = Number(marRes.rows[0].MAR_ID_MARCA);
              } catch (_e) {}

              let umeId = 1;
              try {
                const umeRes = await conn.execute<any>(`SELECT UME_ID_UNIDAD FROM CMP_UNIDAD_MEDIDA WHERE UME_ACTIVO = 1 AND ROWNUM = 1`);
                if (umeRes.rows?.[0]?.UME_ID_UNIDAD) umeId = Number(umeRes.rows[0].UME_ID_UNIDAD);
              } catch (_e) {}

              const descArt = d.DCO_OBSERVACIONES && String(d.DCO_OBSERVACIONES).trim()
                ? String(d.DCO_OBSERVACIONES).trim()
                : `Producto Sustituto (${codArt})`;

              await conn.execute(
                `INSERT INTO CMP_ARTICULO (
                  ART_CODIGO_ARTICULO,
                  ART_DESCRIPCION,
                  ART_ID_CATEGORIA,
                  ART_ID_MARCA,
                  ART_ID_UNIDAD_COMPRA,
                  ART_ID_UNIDAD_VENTA,
                  ART_MANEJA_LOTE,
                  ART_ACTIVO
                ) VALUES (
                  :codArt,
                  :descArt,
                  :catId,
                  :marId,
                  :umeId,
                  :umeId,
                  0,
                  1
                )`,
                {
                  codArt,
                  descArt,
                  catId,
                  marId,
                  umeId,
                }
              );
            }
          }
        }
      } catch (errSubst) {
        console.warn(`[CotizacionRepository.adjudicar]: Advertencia al procesar artículos sustitutos diferidos:`, errSubst);
      }

      // 1. Marcar como GANADORA la seleccionada
      await conn.execute(
        `UPDATE CMP_COTIZACION 
         SET COT_ESTADO_ADJUDICACION = 'GANADORA' 
         WHERE COT_ID_COTIZACION = :idCotizacion`,
        { idCotizacion }
      );

      // 2. Marcar como RECHAZADA las demás cotizaciones de la solicitud
      await conn.execute(
        `UPDATE CMP_COTIZACION 
         SET COT_ESTADO_ADJUDICACION = 'RECHAZADA' 
         WHERE COT_NO_DOCUMENTO_SOLICITUD = :noSolicitud 
           AND COT_ID_COTIZACION <> :idCotizacion`,
        { noSolicitud, idCotizacion }
      );

      // 3. Actualizar la solicitud: asegurar estado EN_PROCESO (ID 3), actualizar monto y registrar nota [ADJUDICADA]
      const dictamenTexto = justificacion && justificacion.trim() ? justificacion.trim() : 'Adjudicación de oferta ganadora';
      const nota = `[ADJUDICADA]: Cotización #${idCotizacion} seleccionada. ${dictamenTexto}`;
      await conn.execute(
        `UPDATE CMP_SOLICITUD_COMPRA 
         SET SOL_ID_ESTADO = 3,
             SOL_MONTO_TOTAL_ESTIMADO = NVL(
               (SELECT COT_PRECIO_TOTAL FROM CMP_COTIZACION WHERE COT_ID_COTIZACION = :idCotizacion),
               SOL_MONTO_TOTAL_ESTIMADO
             ),
             SOL_NOTAS = CASE WHEN SOL_NOTAS IS NULL THEN :nota ELSE SUBSTR(SOL_NOTAS || ' | ' || :nota, 1, 500) END
         WHERE SOL_NO_DOCUMENTO = :noSolicitud`,
        { nota, idCotizacion, noSolicitud }
      );

      // 4. Retornar la cotización actualizada
      const res = await conn.execute<ICotizacionDbRow>(
        `SELECT 
          c.COT_ID_COTIZACION,
          c.COT_NO_DOCUMENTO_SOLICITUD,
          c.COT_ID_PROVEEDOR,
          c.COT_PRECIO_TOTAL,
          c.COT_TIEMPO_ENTREGA_DIAS,
          c.COT_CONDICION_PAGO_DIAS,
          c.COT_RUTA_ARCHIVO_PDF,
          c.COT_ES_EXCEPCION_UNICO,
          c.COT_ESTADO_ADJUDICACION,
          p.PRO_NOMBRE_ENTIDAD,
          p.PRO_NIT
        FROM CMP_COTIZACION c
        LEFT JOIN PROVEEDOR p ON c.COT_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
        WHERE c.COT_ID_COTIZACION = :idCotizacion`,
        { idCotizacion }
      );

      if (!res.rows || res.rows.length === 0) {
        throw new Error(`No se encontró la cotización #${idCotizacion}`);
      }

      return mapRowToCotizacion(res.rows[0]);
    });
  }

  /**
   * Obtiene el archivo PDF binario (BLOB) almacenado en la base de datos Oracle
   */
  static async findPdfBlob(id: number): Promise<{ buffer: Buffer | null; filename: string }> {
    const sql = `
      SELECT 
        COT_ARCHIVO_BLOB,
        COT_RUTA_ARCHIVO_PDF
      FROM CMP_COTIZACION
      WHERE COT_ID_COTIZACION = :id
    `;
    try {
      const result = await execute<any>(sql, { id });
      if (!result.rows || result.rows.length === 0) {
        return { buffer: null, filename: `cotizacion_${id}.pdf` };
      }
      const row = result.rows[0];
      const blob = row.COT_ARCHIVO_BLOB;
      const filename = row.COT_RUTA_ARCHIVO_PDF || `cotizacion_${id}.pdf`;

      let buffer: Buffer | null = null;
      if (Buffer.isBuffer(blob)) {
        buffer = blob;
      } else if (blob instanceof Uint8Array) {
        buffer = Buffer.from(blob);
      }
      return { buffer, filename };
    } catch (err) {
      console.error(`[CotizacionRepository.findPdfBlob Error ${id}]:`, err);
      return { buffer: null, filename: `cotizacion_${id}.pdf` };
    }
  }
}

