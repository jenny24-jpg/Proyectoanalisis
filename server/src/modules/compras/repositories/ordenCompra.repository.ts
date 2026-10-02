import { execute, withTransaction } from '../../../config/database.js';
import {
  IOrdenCompra,
  IDetalleOrdenCompra,
  IOrdenCompraCompleta,
  IAutorizarPresupuestoDTO,
  IRechazarPresupuestoDTO,
  IOrdenCompraFilterParams,
} from '@erp/contracts';

interface IOrdenCompraDbRow {
  OCO_NO_PO: string;
  OCO_ID_COTIZACION_GANADORA: number | string;
  OCO_FECHA_EMISION: Date | string;
  OCO_SUBTOTAL: number | string;
  OCO_MONTO_IVA: number | string;
  OCO_TOTAL: number | string;
  OCO_RUTA_PDF_PO?: string | null;
  OCO_ID_ESTADO: number | string;
  SOL_NO_DOCUMENTO?: string | null;
  PRO_NOMBRE_ENTIDAD?: string | null;
  PRO_NIT?: string | null;
  DEP_NOMBRE_DEPARTAMENTO?: string | null;
  SOL_MONTO_TOTAL_ESTIMADO?: number | string | null;
  EST_NOMBRE_ESTADO?: string | null;
  COT_TIEMPO_ENTREGA_DIAS?: number | string | null;
  COT_CONDICION_PAGO_DIAS?: number | string | null;
}

function mapRowToOrdenCompra(row: IOrdenCompraDbRow): IOrdenCompra {
  return {
    ocoNoPo: String(row.OCO_NO_PO),
    ocoIdCotizacionGanadora: Number(row.OCO_ID_COTIZACION_GANADORA),
    ocoFechaEmision: row.OCO_FECHA_EMISION,
    ocoSubtotal: Number(row.OCO_SUBTOTAL || 0),
    ocoMontoIva: Number(row.OCO_MONTO_IVA || 0),
    ocoTotal: Number(row.OCO_TOTAL || 0),
    ocoRutaPdfPo: row.OCO_RUTA_PDF_PO ? String(row.OCO_RUTA_PDF_PO) : null,
    ocoIdEstado: Number(row.OCO_ID_ESTADO || 3),
    solNoDocumento: row.SOL_NO_DOCUMENTO ? String(row.SOL_NO_DOCUMENTO) : null,
    proNombreEntidad: row.PRO_NOMBRE_ENTIDAD ? String(row.PRO_NOMBRE_ENTIDAD) : null,
    proNit: row.PRO_NIT ? String(row.PRO_NIT) : null,
    depNombreDepartamento: row.DEP_NOMBRE_DEPARTAMENTO ? String(row.DEP_NOMBRE_DEPARTAMENTO) : null,
    solMontoTotalEstimado: row.SOL_MONTO_TOTAL_ESTIMADO !== null && row.SOL_MONTO_TOTAL_ESTIMADO !== undefined ? Number(row.SOL_MONTO_TOTAL_ESTIMADO) : null,
    estNombreEstado: row.EST_NOMBRE_ESTADO ? String(row.EST_NOMBRE_ESTADO) : 'AUTORIZADA',
    cotTiempoEntregaDias: row.COT_TIEMPO_ENTREGA_DIAS !== null && row.COT_TIEMPO_ENTREGA_DIAS !== undefined ? Number(row.COT_TIEMPO_ENTREGA_DIAS) : null,
    cotCondicionPagoDias: row.COT_CONDICION_PAGO_DIAS !== null && row.COT_CONDICION_PAGO_DIAS !== undefined ? Number(row.COT_CONDICION_PAGO_DIAS) : null,
  };
}

export class OrdenCompraRepository {
  /**
   * Consulta todas las órdenes de compra con datos enriquecidos de cotización, proveedor y solicitud.
   */
  static async findAll(filters: IOrdenCompraFilterParams = {}): Promise<IOrdenCompra[]> {
    let sql = `
      SELECT 
        o.OCO_NO_PO,
        o.OCO_ID_COTIZACION_GANADORA,
        o.OCO_FECHA_EMISION,
        o.OCO_SUBTOTAL,
        o.OCO_MONTO_IVA,
        o.OCO_TOTAL,
        o.OCO_RUTA_PDF_PO,
        o.OCO_ID_ESTADO,
        c.COT_NO_DOCUMENTO_SOLICITUD AS SOL_NO_DOCUMENTO,
        c.COT_TIEMPO_ENTREGA_DIAS,
        c.COT_CONDICION_PAGO_DIAS,
        p.PRO_NOMBRE_ENTIDAD,
        p.PRO_NIT,
        d.DEP_NOMBRE_DEPARTAMENTO,
        s.SOL_MONTO_TOTAL_ESTIMADO,
        e.EST_NOMBRE_ESTADO
      FROM CMP_ORDEN_COMPRA o
      LEFT JOIN CMP_COTIZACION c ON o.OCO_ID_COTIZACION_GANADORA = c.COT_ID_COTIZACION
      LEFT JOIN PROVEEDOR p ON c.COT_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
      LEFT JOIN CMP_SOLICITUD_COMPRA s ON c.COT_NO_DOCUMENTO_SOLICITUD = s.SOL_NO_DOCUMENTO
      LEFT JOIN DEPARTAMENTO d ON s.SOL_ID_DEPARTAMENTO = d.DEP_ID_DEPARTAMENTO
      LEFT JOIN CMP_ESTADO e ON o.OCO_ID_ESTADO = e.EST_ID_ESTADO
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.noPo) {
      sql += ` AND o.OCO_NO_PO = :noPo`;
      binds.noPo = filters.noPo;
    }

    if (filters.noDocumentoSolicitud) {
      sql += ` AND c.COT_NO_DOCUMENTO_SOLICITUD = :noSol`;
      binds.noSol = filters.noDocumentoSolicitud;
    }

    if (filters.idEstado) {
      sql += ` AND o.OCO_ID_ESTADO = :idEstado`;
      binds.idEstado = filters.idEstado;
    }

    sql += ` ORDER BY o.OCO_FECHA_EMISION DESC, o.OCO_NO_PO DESC`;

    const result = await execute<IOrdenCompraDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToOrdenCompra);
  }

  /**
   * Obtiene una orden de compra por su número PO junto con sus detalles.
   */
  static async findByNoPo(noPo: string): Promise<IOrdenCompraCompleta | null> {
    const list = await this.findAll({ noPo });
    if (list.length === 0) return null;
    const base = list[0];

    const detSql = `
      SELECT 
        d.DOC_ID_DETALLE_PO,
        d.DOC_NO_PO,
        d.DOC_CODIGO_ARTICULO,
        d.DOC_CANTIDAD_PEDIDA,
        d.DOC_PRECIO_UNITARIO,
        d.DOC_TOTAL_LINEA,
        a.ART_DESCRIPCION,
        u.UME_ABREVIATURA,
        u.UME_NOMBRE_UNIDAD
      FROM CMP_DETALLE_ORDEN_COMPRA d
      LEFT JOIN CMP_ARTICULO a ON d.DOC_CODIGO_ARTICULO = a.ART_CODIGO_ARTICULO
      LEFT JOIN CMP_UNIDAD_MEDIDA u ON a.ART_ID_UNIDAD_COMPRA = u.UME_ID_UNIDAD
      WHERE d.DOC_NO_PO = :noPo
      ORDER BY d.DOC_ID_DETALLE_PO ASC
    `;

    const detRes = await execute<any>(detSql, { noPo });
    const detalles: IDetalleOrdenCompra[] = (detRes.rows || []).map((row: any) => ({
      docIdDetallePo: Number(row.DOC_ID_DETALLE_PO),
      docNoPo: String(row.DOC_NO_PO),
      docCodigoArticulo: String(row.DOC_CODIGO_ARTICULO),
      artDescripcion: row.ART_DESCRIPCION ? String(row.ART_DESCRIPCION) : null,
      umeNombreUnidad: row.UME_ABREVIATURA ? String(row.UME_ABREVIATURA) : (row.UME_NOMBRE_UNIDAD ? String(row.UME_NOMBRE_UNIDAD) : 'UN'),
      docCantidadPedida: Number(row.DOC_CANTIDAD_PEDIDA),
      docPrecioUnitario: Number(row.DOC_PRECIO_UNITARIO),
      docTotalLinea: Number(row.DOC_TOTAL_LINEA),
    }));

    return {
      ...base,
      detalles,
    };
  }

  /**
   * Obtiene la orden de compra vinculada a una solicitud específica.
   */
  static async findBySolicitud(noDocumento: string): Promise<IOrdenCompraCompleta | null> {
    const list = await this.findAll({ noDocumentoSolicitud: noDocumento });
    if (list.length === 0) return null;
    return await this.findByNoPo(list[0].ocoNoPo);
  }

  /**
   * Autoriza formalmente el presupuesto para una solicitud, creando o actualizando
   * la Orden de Compra (CMP_ORDEN_COMPRA), sus líneas de detalle y avanzando la solicitud
   * hacia la siguiente etapa del ciclo (Bodega / Recepción, Estado ID 4).
   */
  static async autorizarPresupuesto(dto: IAutorizarPresupuestoDTO): Promise<IOrdenCompraCompleta> {
    const noPoFinal = await withTransaction(async (conn) => {
      // 1. Obtener la cotización ganadora para esta solicitud
      let idCotizacion = dto.idCotizacionGanadora;
      let cotPrecioTotal = dto.total || 0;

      if (!idCotizacion || idCotizacion <= 0) {
        const cotGanRes = await conn.execute<any>(
          `SELECT COT_ID_COTIZACION, COT_PRECIO_TOTAL 
           FROM CMP_COTIZACION 
           WHERE COT_NO_DOCUMENTO_SOLICITUD = :noSol 
             AND (UPPER(COT_ESTADO_ADJUDICACION) IN ('GANADORA', 'ADJUDICADA') OR COT_ES_EXCEPCION_UNICO = 1) 
             AND ROWNUM = 1`,
          { noSol: dto.noDocumento }
        );

        if (cotGanRes.rows && cotGanRes.rows.length > 0) {
          idCotizacion = Number(cotGanRes.rows[0].COT_ID_COTIZACION);
          cotPrecioTotal = Number(cotGanRes.rows[0].COT_PRECIO_TOTAL || 0);
        } else {
          // Fallback a la primera cotización si aún no fue marcada explícitamente
          const firstCot = await conn.execute<any>(
            `SELECT COT_ID_COTIZACION, COT_PRECIO_TOTAL 
             FROM CMP_COTIZACION 
             WHERE COT_NO_DOCUMENTO_SOLICITUD = :noSol 
             ORDER BY COT_PRECIO_TOTAL ASC`,
            { noSol: dto.noDocumento }
          );
          if (firstCot.rows && firstCot.rows.length > 0) {
            idCotizacion = Number(firstCot.rows[0].COT_ID_COTIZACION);
            cotPrecioTotal = Number(firstCot.rows[0].COT_PRECIO_TOTAL || 0);
          } else {
            throw new Error(`No se encontró ninguna cotización registrada para la solicitud ${dto.noDocumento}`);
          }
        }
      }

      // 2. Calcular montos financieros (Total, Subtotal e IVA 12%)
      const totalFinal = dto.total && dto.total > 0 ? dto.total : (cotPrecioTotal > 0 ? cotPrecioTotal : 0);
      const subtotalFinal = dto.subtotal !== undefined ? dto.subtotal : Number((totalFinal / 1.12).toFixed(2));
      const ivaFinal = dto.montoIva !== undefined ? dto.montoIva : Number((totalFinal - subtotalFinal).toFixed(2));

      // 3. Verificar si ya existe una PO generada para esta cotización
      const checkPoRes = await conn.execute<any>(
        `SELECT OCO_NO_PO FROM CMP_ORDEN_COMPRA WHERE OCO_ID_COTIZACION_GANADORA = :idCot`,
        { idCot: idCotizacion }
      );

      let noPoFinal = '';
      if (checkPoRes.rows && checkPoRes.rows.length > 0) {
        noPoFinal = String(checkPoRes.rows[0].OCO_NO_PO);
        // Actualizar PO existente
        await conn.execute(
          `UPDATE CMP_ORDEN_COMPRA 
           SET OCO_SUBTOTAL = :subtotal,
               OCO_MONTO_IVA = :iva,
               OCO_TOTAL = :total,
               OCO_ID_ESTADO = 4
           WHERE OCO_NO_PO = :noPo`,
          {
            subtotal: subtotalFinal,
            iva: ivaFinal,
            total: totalFinal,
            noPo: noPoFinal,
          }
        );
      } else {
        // Generar nuevo código secuencial de PO
        const countRes = await conn.execute<any>(`SELECT COUNT(*) AS CNT FROM CMP_ORDEN_COMPRA`);
        const nextNum = (countRes.rows?.[0]?.CNT ? Number(countRes.rows[0].CNT) : 0) + 1;
        const padNum = String(nextNum).padStart(4, '0');
        const year = new Date().getFullYear();
        noPoFinal = `PO-${year}-${padNum}`;

        await conn.execute(
          `INSERT INTO CMP_ORDEN_COMPRA (
            OCO_NO_PO,
            OCO_ID_COTIZACION_GANADORA,
            OCO_FECHA_EMISION,
            OCO_SUBTOTAL,
            OCO_MONTO_IVA,
            OCO_TOTAL,
            OCO_ID_ESTADO
          ) VALUES (
            :noPo,
            :idCot,
            SYSDATE,
            :subtotal,
            :iva,
            :total,
            4
          )`,
          {
            noPo: noPoFinal,
            idCot: idCotizacion,
            subtotal: subtotalFinal,
            iva: ivaFinal,
            total: totalFinal,
          }
        );
      }

      // 4. Copiar líneas de detalle de la cotización ganadora o de la solicitud a CMP_DETALLE_ORDEN_COMPRA
      const detCotRes = await conn.execute<any>(
        `SELECT 
          DCO_CODIGO_ARTICULO,
          DCO_CANTIDAD_COTIZADA,
          DCO_PRECIO_UNITARIO,
          DCO_SUBTOTAL_LINEA,
          DCO_OBSERVACIONES,
          DCO_ES_SUSTITUTO
         FROM CMP_DETALLE_COTIZACION
         WHERE DCO_ID_COTIZACION = :idCot`,
        { idCot: idCotizacion }
      );

      let itemsToInsert: { codigoArticulo: string; cantidad: number; precioUnitario: number; totalLinea: number }[] = [];

      if (detCotRes.rows && detCotRes.rows.length > 0) {
        itemsToInsert = detCotRes.rows
          .filter((r: any) => {
            const cant = Number(r.DCO_CANTIDAD_COTIZADA || 0);
            const precio = Number(r.DCO_PRECIO_UNITARIO || 0);
            const subtotal = Number(r.DCO_SUBTOTAL_LINEA || 0);
            const obs = String(r.DCO_OBSERVACIONES || '').toUpperCase();
            // Descartar líneas marcadas como sin existencias o con costo cero
            if (obs.includes('SIN EXISTENCIAS') || obs.includes('SIN STOCK') || obs.includes('AGOTADO')) {
              return false;
            }
            return cant > 0 && precio > 0 && subtotal > 0;
          })
          .map((r: any) => ({
            codigoArticulo: String(r.DCO_CODIGO_ARTICULO),
            cantidad: Number(r.DCO_CANTIDAD_COTIZADA || 1),
            precioUnitario: Number(r.DCO_PRECIO_UNITARIO || 0),
            totalLinea: Number(r.DCO_SUBTOTAL_LINEA || 0),
          }));
      } else {
        const detSolRes = await conn.execute<any>(
          `SELECT 
            DSO_CODIGO_ARTICULO,
            NVL(DSO_CANTIDAD_APROBADA, DSO_CANTIDAD_PEDIDA) AS CANTIDAD
           FROM CMP_DETALLE_SOLICITUD
           WHERE DSO_NO_DOCUMENTO_SOLICITUD = :noSol`,
          { noSol: dto.noDocumento }
        );

        const solItems = detSolRes.rows || [];
        const totalItemsCount = solItems.length;
        const precioUnitarioEstimado = totalItemsCount > 0 ? Number((subtotalFinal / totalItemsCount).toFixed(2)) : 0;

        itemsToInsert = solItems.map((item: any) => {
          const cant = Number(item.CANTIDAD || 1);
          return {
            codigoArticulo: String(item.DSO_CODIGO_ARTICULO),
            cantidad: cant,
            precioUnitario: precioUnitarioEstimado,
            totalLinea: Number((cant * precioUnitarioEstimado).toFixed(2)),
          };
        });
      }

      if (itemsToInsert.length > 0) {
        // Limpiar detalles previos de esta PO para inserción limpia
        await conn.execute(
          `DELETE FROM CMP_DETALLE_ORDEN_COMPRA WHERE DOC_NO_PO = :noPo`,
          { noPo: noPoFinal }
        );

        let nextDetIdRes = await conn.execute<any>(
          `SELECT NVL(MAX(DOC_ID_DETALLE_PO), 0) AS MAX_ID FROM CMP_DETALLE_ORDEN_COMPRA`
        );
        let currDetId = Number(nextDetIdRes.rows?.[0]?.MAX_ID || 0);

        for (const item of itemsToInsert) {
          // Garantizar que el artículo exista en CMP_ARTICULO antes de insertar el detalle de la PO
          try {
            const checkArt = await conn.execute<any>(
              `SELECT ART_CODIGO_ARTICULO FROM CMP_ARTICULO WHERE UPPER(ART_CODIGO_ARTICULO) = UPPER(:codArt)`,
              { codArt: item.codigoArticulo }
            );
            if (!checkArt.rows || checkArt.rows.length === 0) {
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
                  1,
                  1,
                  1,
                  1,
                  0,
                  1
                )`,
                {
                  codArt: item.codigoArticulo,
                  descArt: `Producto Adjudicado (${item.codigoArticulo})`,
                }
              );
            }
          } catch (_e) {}

          currDetId += 1;
          await conn.execute(
            `INSERT INTO CMP_DETALLE_ORDEN_COMPRA (
              DOC_ID_DETALLE_PO,
              DOC_NO_PO,
              DOC_CODIGO_ARTICULO,
              DOC_CANTIDAD_PEDIDA,
              DOC_PRECIO_UNITARIO,
              DOC_TOTAL_LINEA
            ) VALUES (
              :detId,
              :noPo,
              :codArt,
              :cant,
              :precioUnit,
              :totalLin
            )`,
            {
              detId: currDetId,
              noPo: noPoFinal,
              codArt: item.codigoArticulo,
              cant: item.cantidad,
              precioUnit: item.precioUnitario,
              totalLin: item.totalLinea,
            }
          );
        }
      }

      // 5. Actualizar la solicitud a estado RECIBIDA / BODEGA (ID 4) y registrar notas
      const notasExtra = dto.notasAutorizacion ? ` | Notas: ${dto.notasAutorizacion.trim()}` : '';
      const dictamenPresupuesto = `[PRESUPUESTO AUTORIZADO]: Orden de Compra ${noPoFinal} emitida formalmente${notasExtra}`;

      await conn.execute(
        `UPDATE CMP_SOLICITUD_COMPRA 
         SET SOL_ID_ESTADO = 4,
             SOL_NOTAS = CASE WHEN SOL_NOTAS IS NULL THEN :nota ELSE SUBSTR(SOL_NOTAS || ' | ' || :nota, 1, 500) END
         WHERE SOL_NO_DOCUMENTO = :noSol`,
        {
          nota: dictamenPresupuesto,
          noSol: dto.noDocumento,
        }
      );

      return noPoFinal;
    });

    // 6. Retornar la orden completa una vez que la transacción está 100% confirmada (COMMIT)
    const created = await this.findByNoPo(noPoFinal);
    if (!created) {
      throw new Error(`Error al recuperar la orden de compra ${noPoFinal} generada.`);
    }
    return created;
  }

  /**
   * Rechaza la autorización de presupuesto para una solicitud, registrando el motivo.
   */
  static async rechazarPresupuesto(dto: IRechazarPresupuestoDTO): Promise<boolean> {
    await withTransaction(async (conn) => {
      const notaRechazo = `[PRESUPUESTO RECHAZADO]: ${dto.motivoRechazo.trim()}`;
      await conn.execute(
        `UPDATE CMP_SOLICITUD_COMPRA 
         SET SOL_NOTAS = CASE WHEN SOL_NOTAS IS NULL THEN :nota ELSE SUBSTR(SOL_NOTAS || ' | ' || :nota, 1, 500) END
         WHERE SOL_NO_DOCUMENTO = :noSol`,
        {
          nota: notaRechazo,
          noSol: dto.noDocumento,
        }
      );
    });
    return true;
  }

  /**
   * Guarda o actualiza el PDF en formato BLOB en la base de datos Oracle
   */
  static async guardarPdfBlob(noPo: string, pdfBuffer: Buffer): Promise<void> {
    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE CMP_ORDEN_COMPRA 
         SET OCO_ARCHIVO_BLOB = :pdfBlob
         WHERE OCO_NO_PO = :noPo`,
        {
          pdfBlob: pdfBuffer,
          noPo: noPo.trim(),
        }
      );
    });
  }

  /**
   * Obtiene el archivo PDF en BLOB directamente desde la base de datos Oracle
   */
  static async findPdfBlob(noPo: string): Promise<{ blob: Buffer | null; filename: string } | null> {
    const sql = `
      SELECT OCO_NO_PO, OCO_ARCHIVO_BLOB
      FROM CMP_ORDEN_COMPRA
      WHERE OCO_NO_PO = :noPo
    `;
    const result = await execute<{ OCO_NO_PO: string; OCO_ARCHIVO_BLOB: Buffer | null }>(sql, {
      noPo: noPo.trim(),
    });

    if (!result.rows || result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      blob: row.OCO_ARCHIVO_BLOB || null,
      filename: `Orden_Compra_${row.OCO_NO_PO}.pdf`,
    };
  }
}

