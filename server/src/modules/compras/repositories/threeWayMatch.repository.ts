import { execute, withTransaction } from '../../../config/database.js';
import {
  IFacturaCxP,
  IThreeWayMatchData,
  ILiquidarThreeWayMatchDTO,
  IFacturaFilterParams,
  IItemThreeWayComparison,
  IThreeWayComparisonSummary,
} from '@erp/contracts';
import { SolicitudCompraRepository } from './solicitudCompra.repository.js';
import { OrdenCompraRepository } from './ordenCompra.repository.js';
import { CotizacionRepository } from './cotizacion.repository.js';
import { RecepcionBodegaRepository } from './recepcionBodega.repository.js';

interface IFacturaCxPDbRow {
  FAC_NO_FACTURA: string;
  FAC_ID_PROVEEDOR: number | string;
  PRO_NOMBRE_ENTIDAD?: string | null;
  PRO_NIT?: string | null;
  FAC_NO_PO: string;
  FAC_NO_RECEPCION: string;
  FAC_FECHA_FACTURA: Date | string;
  FAC_SUBTOTAL: number | string;
  FAC_MONTO_IVA: number | string;
  FAC_TOTAL_FACTURA: number | string;
  FAC_RUTA_ARCHIVO_PDF?: string | null;
  FAC_ID_ESTADO: number | string;
  EST_NOMBRE_ESTADO?: string | null;
}

function mapRowToFactura(row: IFacturaCxPDbRow): IFacturaCxP {
  return {
    facNoFactura: String(row.FAC_NO_FACTURA),
    facIdProveedor: Number(row.FAC_ID_PROVEEDOR),
    proNombreEntidad: row.PRO_NOMBRE_ENTIDAD ? String(row.PRO_NOMBRE_ENTIDAD) : `Proveedor #${row.FAC_ID_PROVEEDOR}`,
    proNit: row.PRO_NIT ? String(row.PRO_NIT) : null,
    facNoPo: String(row.FAC_NO_PO),
    facNoRecepcion: String(row.FAC_NO_RECEPCION),
    facFechaFactura: row.FAC_FECHA_FACTURA,
    facSubtotal: Number(row.FAC_SUBTOTAL || 0),
    facMontoIva: Number(row.FAC_MONTO_IVA || 0),
    facTotalFactura: Number(row.FAC_TOTAL_FACTURA || 0),
    facRutaArchivoPdf: row.FAC_RUTA_ARCHIVO_PDF ? String(row.FAC_RUTA_ARCHIVO_PDF) : null,
    facIdEstado: Number(row.FAC_ID_ESTADO),
    estNombreEstado: row.EST_NOMBRE_ESTADO ? String(row.EST_NOMBRE_ESTADO) : 'LIQUIDADA',
  };
}

export class ThreeWayMatchRepository {
  /**
   * Consulta todas las facturas CXP registradas
   */
  static async findAllFacturas(filters: IFacturaFilterParams = {}): Promise<IFacturaCxP[]> {
    let sql = `
      SELECT 
        f.FAC_NO_FACTURA,
        f.FAC_ID_PROVEEDOR,
        p.PRO_NOMBRE_ENTIDAD,
        p.PRO_NIT,
        f.FAC_NO_PO,
        f.FAC_NO_RECEPCION,
        f.FAC_FECHA_FACTURA,
        f.FAC_SUBTOTAL,
        f.FAC_MONTO_IVA,
        f.FAC_TOTAL_FACTURA,
        f.FAC_RUTA_ARCHIVO_PDF,
        f.FAC_ID_ESTADO,
        e.EST_NOMBRE_ESTADO
      FROM CMP_FACTURA_CXP f
      LEFT JOIN PROVEEDOR p ON f.FAC_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
      LEFT JOIN CMP_ESTADO e ON f.FAC_ID_ESTADO = e.EST_ID_ESTADO
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.noFactura) {
      sql += ` AND f.FAC_NO_FACTURA LIKE :noFac`;
      binds.noFac = `%${filters.noFactura}%`;
    }

    if (filters.noPo) {
      sql += ` AND f.FAC_NO_PO = :noPo`;
      binds.noPo = filters.noPo;
    }

    if (filters.noRecepcion) {
      sql += ` AND f.FAC_NO_RECEPCION = :noRec`;
      binds.noRec = filters.noRecepcion;
    }

    if (filters.idProveedor) {
      sql += ` AND f.FAC_ID_PROVEEDOR = :idPro`;
      binds.idPro = filters.idProveedor;
    }

    sql += ` ORDER BY f.FAC_FECHA_FACTURA DESC, f.FAC_NO_FACTURA DESC`;

    const result = await execute<IFacturaCxPDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToFactura);
  }

  /**
   * Busca una factura CXP por su número oficial
   */
  static async findFacturaByNoFactura(noFactura: string): Promise<IFacturaCxP | null> {
    const list = await this.findAllFacturas({ noFactura });
    return list.length > 0 ? list[0] : null;
  }

  /**
   * Busca una factura CXP por número de PO
   */
  static async findFacturaByNoPo(noPo: string): Promise<IFacturaCxP | null> {
    const list = await this.findAllFacturas({ noPo });
    return list.length > 0 ? list[0] : null;
  }

  /**
   * Obtiene la estructura consolidada para la conciliación tripartita (3-Way Match)
   * cruzando Solicitud, Cotización Adjudicada, Orden de Compra, Recepción en Bodega y Factura.
   */
  static async getThreeWayMatchData(noDocOrPo: string): Promise<IThreeWayMatchData> {
    // 1. Obtener la solicitud
    let solicitud = await SolicitudCompraRepository.findByNoDocumento(noDocOrPo);
    let noPo = noDocOrPo;

    if (!solicitud) {
      // Intentar buscar si vino un noPo
      const poRes = await execute<any>(
        `SELECT c.COT_NO_DOCUMENTO_SOLICITUD AS NO_SOL
         FROM CMP_ORDEN_COMPRA o
         JOIN CMP_COTIZACION c ON o.OCO_ID_COTIZACION_GANADORA = c.COT_ID_COTIZACION
         WHERE o.OCO_NO_PO = :noPo`,
        { noPo: noDocOrPo }
      );
      const noSol = poRes.rows?.[0]?.NO_SOL || poRes.rows?.[0]?.[0];
      if (noSol) {
        solicitud = await SolicitudCompraRepository.findByNoDocumento(noSol);
      }
    }

    if (!solicitud) {
      throw new Error(`No se encontró la solicitud de compra para el identificador ${noDocOrPo}`);
    }

    // 2. Obtener la Orden de Compra emitida
    const ordenCompra = await OrdenCompraRepository.findBySolicitud(solicitud.solNoDocumento);
    if (ordenCompra) {
      noPo = ordenCompra.ocoNoPo;
    }

    // 3. Obtener la cotización adjudicada
    let cotizacion: any = null;
    if (ordenCompra && ordenCompra.ocoIdCotizacionGanadora) {
      cotizacion = await CotizacionRepository.findById(ordenCompra.ocoIdCotizacionGanadora);
    } else {
      const cotList = await CotizacionRepository.findAll({ noSolicitud: solicitud.solNoDocumento });
      cotizacion = cotList.find(c => (c.cotEstadoAdjudicacion || '').toUpperCase() === 'GANADORA' || (c.cotEstadoAdjudicacion || '').toUpperCase() === 'ADJUDICADA') || cotList[0] || null;
    }

    // 4. Obtener la recepción en bodega
    let recepcionBodega = null;
    if (ordenCompra) {
      recepcionBodega = await RecepcionBodegaRepository.findByNoPo(ordenCompra.ocoNoPo);
    }

    // 5. Obtener si ya existe factura registrada
    let facturaExistente: IFacturaCxP | null = null;
    if (ordenCompra) {
      facturaExistente = await this.findFacturaByNoPo(ordenCompra.ocoNoPo);
    }

    // 6. Construir cruce y comparativa tripartita item por item
    const itemsMap = new Map<string, IItemThreeWayComparison>();

    // Cargar ítems de la Orden de Compra
    if (ordenCompra && ordenCompra.detalles) {
      let lineNum = 1;
      for (const det of ordenCompra.detalles) {
        const cod = det.docCodigoArticulo;
        const cantPo = Number(det.docCantidadPedida || 0);
        const prePo = Number(det.docPrecioUnitario || 0);
        const subPo = Number(det.docTotalLinea || +(cantPo * prePo).toFixed(2));

        itemsMap.set(cod, {
          idDetalleOc: (det as any).docIdDetalleOrdenCompra || (det as any).idDetalleOrdenCompra,
          numeroLinea: lineNum++,
          codigoArticulo: cod,
          descripcionArticulo: det.artDescripcion || cod,
          unidadMedida: (det as any).umeNombreUnidad || (det as any).unidadMedida || 'UNIDAD',
          cantidadPedidaPo: cantPo,
          cantidadRecibidaBodega: 0,
          cantidadFacturada: cantPo, // Base por defecto
          precioUnitarioCotizado: prePo,
          precioUnitarioPo: prePo,
          precioUnitarioFactura: prePo,
          subtotalPo: subPo,
          subtotalRecepcion: 0,
          subtotalFactura: subPo,
          diferenciaCantidad: cantPo,
          diferenciaPrecio: 0,
          diferenciaMonto: subPo,
          esConforme: false,
          resultadoTresVias: 'PENDIENTE',
        });
      }
    }

    // Cruzar con los ítems recibidos en Bodega
    if (recepcionBodega && recepcionBodega.detalles) {
      for (const det of recepcionBodega.detalles) {
        const cod = det.dreCodigoArticulo;
        const cantRec = Number(det.dreCantidadRecibida || 0);
        const preUnit = Number(det.precioUnitario || det.drePrecioUnitario || 0);
        const subRec = Number(det.totalLinea || +(cantRec * preUnit).toFixed(2));

        const existing = itemsMap.get(cod);
        if (existing) {
          existing.idDetalleRecepcion = det.dreIdDetalleRecepcion;
          if (det.umeNombreUnidad) existing.unidadMedida = det.umeNombreUnidad;
          existing.cantidadRecibidaBodega = cantRec;
          existing.subtotalRecepcion = subRec;
          existing.cantidadFacturada = cantRec; // Sugerir facturar lo recibido
          existing.subtotalFactura = +(cantRec * existing.precioUnitarioPo).toFixed(2);
          existing.diferenciaCantidad = existing.cantidadPedidaPo - cantRec;
          existing.diferenciaPrecio = +(existing.precioUnitarioPo - existing.precioUnitarioFactura).toFixed(2);
          existing.diferenciaMonto = +(existing.subtotalPo - existing.subtotalFactura).toFixed(2);

          const cantOk = existing.cantidadPedidaPo === cantRec;
          const preOk = Math.abs(existing.precioUnitarioPo - existing.precioUnitarioFactura) < 0.001;

          existing.esConforme = cantOk && preOk;
          if (cantOk && preOk) {
            existing.resultadoTresVias = 'CONFORME';
          } else if (!cantOk && !preOk) {
            existing.resultadoTresVias = 'DISCREPANCIA_AMBAS';
          } else if (!cantOk) {
            existing.resultadoTresVias = 'DISCREPANCIA_CANTIDAD';
          } else {
            existing.resultadoTresVias = 'DISCREPANCIA_PRECIO';
          }
        } else {
          itemsMap.set(cod, {
            idDetalleRecepcion: det.dreIdDetalleRecepcion,
            numeroLinea: itemsMap.size + 1,
            codigoArticulo: cod,
            descripcionArticulo: det.artDescripcion || cod,
            unidadMedida: det.umeNombreUnidad || 'UNIDAD',
            cantidadPedidaPo: 0,
            cantidadRecibidaBodega: cantRec,
            cantidadFacturada: cantRec,
            precioUnitarioCotizado: preUnit,
            precioUnitarioPo: preUnit,
            precioUnitarioFactura: preUnit,
            subtotalPo: 0,
            subtotalRecepcion: subRec,
            subtotalFactura: subRec,
            diferenciaCantidad: -cantRec,
            diferenciaPrecio: 0,
            diferenciaMonto: -subRec,
            esConforme: false,
            resultadoTresVias: 'DISCREPANCIA_CANTIDAD',
          });
        }
      }
    }

    const items = Array.from(itemsMap.values());

    // 7. Calcular totales consolidados
    const montoCot = Number(cotizacion?.cotPrecioTotal || ordenCompra?.ocoTotal || 0);
    const montoPo = Number(ordenCompra?.ocoTotal || 0);
    const montoRec = Number(recepcionBodega?.rboTotalFacturar || 0);

    let subtotalFactura = facturaExistente
      ? facturaExistente.facSubtotal
      : (ordenCompra?.ocoSubtotal != null
        ? ordenCompra.ocoSubtotal
        : (recepcionBodega?.rboSubtotalRecibido != null ? recepcionBodega.rboSubtotalRecibido : 0));

    let ivaFactura = facturaExistente
      ? facturaExistente.facMontoIva
      : (ordenCompra?.ocoMontoIva != null
        ? ordenCompra.ocoMontoIva
        : (recepcionBodega?.rboIvaRecibido != null ? recepcionBodega.rboIvaRecibido : +(subtotalFactura * 0.12).toFixed(2)));

    let montoFactura = facturaExistente
      ? facturaExistente.facTotalFactura
      : (ordenCompra?.ocoTotal != null
        ? ordenCompra.ocoTotal
        : (recepcionBodega?.rboTotalFacturar != null ? recepcionBodega.rboTotalFacturar : +(subtotalFactura + ivaFactura).toFixed(2)));

    const variacionMonto = +(montoFactura - montoPo).toFixed(2);
    const variacionPorcentaje = montoPo > 0 ? +((variacionMonto / montoPo) * 100).toFixed(2) : 0;
    const cantidadesCoinciden = items.length > 0 && items.every(it => it.cantidadPedidaPo === it.cantidadRecibidaBodega);
    const preciosCoinciden = items.length > 0 && items.every(it => Math.abs(it.precioUnitarioPo - it.precioUnitarioFactura) < 0.001);
    const esConforme = Math.abs(variacionMonto) <= 0.01 && cantidadesCoinciden && preciosCoinciden;

    const comparison: IThreeWayComparisonSummary = {
      montoCotizacion: montoCot,
      montoOrdenCompra: montoPo,
      montoRecepcionBodega: montoRec,
      montoFactura,
      subtotalFactura,
      ivaFactura,
      variacionMonto,
      variacionPorcentaje,
      toleranciaPermitidaPct: 0.00,
      cantidadesCoinciden,
      preciosCoinciden,
      esConforme,
      tipoDiscrepancia: esConforme ? 'NINGUNA' : (!cantidadesCoinciden && !preciosCoinciden ? 'AMBAS' : (!cantidadesCoinciden ? 'CANTIDAD' : 'PRECIO')),
      items,
    };

    // Determinar estado general del ciclo de compras
    let estadoCiclo: 'PENDIENTE_BODEGA' | 'LISTO_PARA_CONCILIAR' | 'LIQUIDADO_CXP' = 'PENDIENTE_BODEGA';
    if (facturaExistente) {
      estadoCiclo = 'LIQUIDADO_CXP';
    } else if (recepcionBodega) {
      estadoCiclo = 'LISTO_PARA_CONCILIAR';
    }

    return {
      solicitud,
      cotizacion,
      ordenCompra,
      recepcionBodega,
      facturaExistente,
      comparison,
      estadoCiclo,
    };
  }

  /**
   * Liquida y autoriza formalmente el 3-Way Match registrando la Factura en CMP_FACTURA_CXP,
   * guardando los resultados a nivel de línea en CXP_DOCUMENTO y CXP_DOCUMENTO_DETALLE,
   * y cerrando el ciclo de compras (Etapa 6/6 completada).
   */
  static async liquidar(dto: ILiquidarThreeWayMatchDTO): Promise<IThreeWayMatchData> {
    const noFacturaFinal = dto.noFactura.trim();

    // Obtener datos consolidados previos
    const preMatch = await this.getThreeWayMatchData(dto.noDocumentoSolicitud);
    const comparisonItems = dto.items && dto.items.length > 0 ? dto.items : preMatch.comparison.items;

    await withTransaction(async (conn) => {
      // 1. Verificar si la factura ya existe en CMP_FACTURA_CXP
      const checkFac = await conn.execute<any>(
        `SELECT COUNT(*) AS CNT FROM CMP_FACTURA_CXP WHERE FAC_NO_FACTURA = :noFac`,
        { noFac: noFacturaFinal }
      );
      const exists = Number(checkFac.rows?.[0]?.CNT || checkFac.rows?.[0]?.[0] || 0) > 0;

      if (exists) {
        throw new Error(`La factura ${noFacturaFinal} ya se encuentra registrada en el sistema.`);
      }

      // 2. Insertar en CMP_FACTURA_CXP
      const insertFacSql = `
        INSERT INTO CMP_FACTURA_CXP (
          FAC_NO_FACTURA,
          FAC_ID_PROVEEDOR,
          FAC_NO_PO,
          FAC_NO_RECEPCION,
          FAC_FECHA_FACTURA,
          FAC_SUBTOTAL,
          FAC_MONTO_IVA,
          FAC_TOTAL_FACTURA,
          FAC_RUTA_ARCHIVO_PDF,
          FAC_ID_ESTADO
        ) VALUES (
          :noFac,
          :idProv,
          :noPo,
          :noRec,
          SYSDATE,
          :subtotal,
          :iva,
          :total,
          :pdfPath,
          5
        )
      `;

      await conn.execute(insertFacSql, {
        noFac: noFacturaFinal,
        idProv: dto.idProveedor,
        noPo: dto.noPo,
        noRec: dto.noRecepcion,
        subtotal: Number(dto.subtotalFactura || 0),
        iva: Number(dto.montoIvaFactura || 0),
        total: Number(dto.totalFactura || 0),
        pdfPath: dto.rutaArchivoPdf || null,
      });

      // 3. Insertar en CXP_DOCUMENTO y CXP_DOCUMENTO_DETALLE (Estructura formal CXP)
      try {
        const docIdRes = await conn.execute<any>(`SELECT NVL(MAX(ID_DOCUMENTO), 0) + 1 AS NEXT_ID FROM CXP_DOCUMENTO`);
        const idDocumento = Number(docIdRes.rows?.[0]?.NEXT_ID || 1);

        const difCantGlobal = comparisonItems.reduce((acc, it) => acc + Math.abs(it.diferenciaCantidad || 0), 0);
        const difPrecioGlobal = comparisonItems.reduce((acc, it) => acc + Math.abs(it.diferenciaPrecio || 0), 0);
        const difTotalGlobal = Math.abs(dto.totalFactura - (preMatch.ordenCompra?.ocoTotal || dto.totalFactura));
        const resTresViasGlobal = (difCantGlobal === 0 && difPrecioGlobal === 0 && difTotalGlobal < 0.01) ? 'CONFORME' : 'DISCREPANCIA';

        await conn.execute(
          `INSERT INTO CXP_DOCUMENTO (
            ID_DOCUMENTO,
            ID_PROVEEDOR,
            ID_SUCURSAL,
            NO_FACTURA_COMPRA,
            NO_ORDEN_COMPRA,
            NO_RECEPCION,
            TIPO_DOCUMENTO,
            NATURALEZA,
            ORIGEN_INGRESO,
            TIPO_REGISTRO,
            FECHA_DOCUMENTO,
            FECHA_RECEPCION,
            DIAS_CREDITO,
            MONEDA,
            TIPO_CAMBIO,
            SUBTOTAL,
            DESCUENTO_TOTAL,
            IMPUESTO_TOTAL,
            RETENCION_TOTAL,
            RECARGO_TOTAL,
            GASTO_ADICIONAL_TOTAL,
            DIFERENCIA_REDONDEO,
            TOTAL_BRUTO,
            TOTAL_NETO,
            TOTAL_LOCAL,
            MONTO_APLICADO,
            SALDO_PENDIENTE,
            CAPITAL_CUOTA,
            INTERES_CUOTA,
            COMISION_CUOTA,
            RESULTADO_TRES_VIAS,
            DIFERENCIA_CANTIDAD,
            DIFERENCIA_PRECIO,
            DIFERENCIA_IMPUESTO,
            DIFERENCIA_TOTAL,
            PRIORIDAD,
            ESTADO_CONTABLE,
            ESTADO,
            POSIBLE_DUPLICADO,
            CREADO_POR,
            FECHA_CREACION
          ) VALUES (
            :idDoc,
            :idProv,
            1,
            :noFac,
            :noPo,
            :noRec,
            'FACTURA',
            'D',
            'COMPRAS',
            'AUTOMATICO',
            SYSDATE,
            SYSTIMESTAMP,
            30,
            'GTQ',
            1,
            :subtotal,
            0,
            :iva,
            0,
            0,
            0,
            0,
            :total,
            :total,
            :total,
            0,
            :total,
            0,
            0,
            0,
            :resTresVias,
            :difCant,
            :difPrecio,
            0,
            :difTotal,
            'MEDIA',
            'PENDIENTE',
            'LIQUIDADO',
            'N',
            1,
            SYSTIMESTAMP
          )`,
          {
            idDoc: idDocumento,
            idProv: dto.idProveedor,
            noFac: noFacturaFinal,
            noPo: dto.noPo,
            noRec: dto.noRecepcion,
            subtotal: Number(dto.subtotalFactura || 0),
            iva: Number(dto.montoIvaFactura || 0),
            total: Number(dto.totalFactura || 0),
            resTresVias: resTresViasGlobal,
            difCant: difCantGlobal,
            difPrecio: difPrecioGlobal,
            difTotal: difTotalGlobal,
          }
        );

        let lineaIdx = 1;
        for (const it of comparisonItems) {
          const detIdRes = await conn.execute<any>(`SELECT NVL(MAX(ID_DETALLE), 0) + 1 AS NEXT_ID FROM CXP_DOCUMENTO_DETALLE`);
          const idDetalle = Number(detIdRes.rows?.[0]?.NEXT_ID || lineaIdx);

          const cantOrd = Number(it.cantidadPedidaPo || 0);
          const cantRec = Number(it.cantidadRecibidaBodega || 0);
          const cantFact = Number(it.cantidadFacturada || cantRec || cantOrd);
          const preOrd = Number(it.precioUnitarioPo || 0);
          const preFact = Number(it.precioUnitarioFactura || preOrd);
          const subLinea = Number(it.subtotalFactura || +(cantFact * preFact).toFixed(2));
          const impLinea = +(subLinea * 0.12).toFixed(2);
          const totLinea = +(subLinea + impLinea).toFixed(2);
          const difCant = +(cantOrd - cantRec);
          const difPre = +(preOrd - preFact).toFixed(2);

          let resLinea = it.resultadoTresVias || 'CONFORME';
          if (!it.resultadoTresVias) {
            if (cantOrd !== cantRec && Math.abs(preOrd - preFact) > 0.001) {
              resLinea = 'DISCREPANCIA_AMBAS';
            } else if (cantOrd !== cantRec) {
              resLinea = 'DISCREPANCIA_CANTIDAD';
            } else if (Math.abs(preOrd - preFact) > 0.001) {
              resLinea = 'DISCREPANCIA_PRECIO';
            }
          }

          await conn.execute(
            `INSERT INTO CXP_DOCUMENTO_DETALLE (
              ID_DETALLE,
              ID_DOCUMENTO,
              CODIGO_ARTICULO,
              NUMERO_LINEA,
              DESCRIPCION,
              CANTIDAD,
              UNIDAD_MEDIDA,
              PRECIO_UNITARIO,
              DESCUENTO,
              SUBTOTAL,
              IMPUESTO,
              RETENCION,
              TOTAL_LINEA,
              CANTIDAD_ORDENADA,
              CANTIDAD_RECIBIDA,
              CANTIDAD_FACTURADA,
              PRECIO_ORDENADO,
              PRECIO_FACTURADO,
              DIFERENCIA_CANTIDAD,
              DIFERENCIA_PRECIO,
              RESULTADO_TRES_VIAS
            ) VALUES (
              :idDet,
              :idDoc,
              :codArt,
              :numLinea,
              :descrip,
              :cant,
              :und,
              :preUnit,
              0,
              :subtotal,
              :impuesto,
              0,
              :totalLinea,
              :cantOrd,
              :cantRec,
              :cantFact,
              :preOrd,
              :preFact,
              :difCant,
              :difPre,
              :resLinea
            )`,
            {
              idDet: idDetalle,
              idDoc: idDocumento,
              codArt: it.codigoArticulo,
              numLinea: lineaIdx++,
              descrip: it.descripcionArticulo || it.codigoArticulo,
              cant: cantFact,
              und: it.unidadMedida || 'UNIDAD',
              preUnit: preFact,
              subtotal: subLinea,
              impuesto: impLinea,
              totalLinea: totLinea,
              cantOrd,
              cantRec,
              cantFact,
              preOrd,
              preFact,
              difCant,
              difPre,
              resLinea,
            }
          );
        }
      } catch (cxpErr) {
        console.warn('[ThreeWayMatchRepository.liquidar] Warning al guardar en CXP_DOCUMENTO/DETALLE:', cxpErr);
      }

      // 4. Actualizar la Orden de Compra a estado LIQUIDADO / CERRADO (ID 5)
      await conn.execute(
        `UPDATE CMP_ORDEN_COMPRA 
         SET OCO_ID_ESTADO = 5 
         WHERE OCO_NO_PO = :noPo`,
        { noPo: dto.noPo }
      );

      // 5. Actualizar la Solicitud de Compra a estado final CERRADA / 3-WAY MATCH (ID 5)
      const notasExtra = dto.notasLiquidacion ? ` | Notas: ${dto.notasLiquidacion.trim()}` : '';
      const notaLiquidacion = `[3-WAY MATCH LIQUIDADO]: Factura ${noFacturaFinal} conciliada exitosamente por Q ${Number(dto.totalFactura).toFixed(2)}${notasExtra}`;

      await conn.execute(
        `UPDATE CMP_SOLICITUD_COMPRA 
         SET SOL_ID_ESTADO = 5,
             SOL_NOTAS = CASE WHEN SOL_NOTAS IS NULL THEN :nota ELSE SUBSTR(SOL_NOTAS || ' | ' || :nota, 1, 500) END
         WHERE SOL_NO_DOCUMENTO = :noSol`,
        {
          nota: notaLiquidacion,
          noSol: dto.noDocumentoSolicitud,
        }
      );

      return noFacturaFinal;
    });

    // 6. Retornar el resumen consolidado actualizado una vez que la transacción está 100% comprometida (COMMIT)
    return await this.getThreeWayMatchData(dto.noDocumentoSolicitud);
  }
}
