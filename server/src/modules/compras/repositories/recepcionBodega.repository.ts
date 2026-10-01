import { execute, withTransaction } from '../../../config/database.js';
import {
  IRecepcionBodega,
  IDetalleRecepcion,
  IRecepcionBodegaCompleta,
  IRegistrarRecepcionDTO,
  IRecepcionFilterParams,
} from '@erp/contracts';

interface IRecepcionBodegaDbRow {
  RBO_NO_RECEPCION: string;
  RBO_NO_PO: string;
  RBO_ID_BODEGA: number | string;
  BOD_NOMBRE?: string | null;
  BOD_CODIGO?: string | null;
  RBO_ID_USUARIO_BODEGA: number | string;
  USUARIO_NOMBRE?: string | null;
  RBO_FECHA_RECEPCION: Date | string;
  RBO_TIPO_RECEPCION: string;
  RBO_SUBTOTAL_RECIBIDO: number | string;
  RBO_IVA_RECIBIDO: number | string;
  RBO_TOTAL_FACTURAR: number | string;
  RBO_TIPO_TRANSPORTE?: string | null;
  RBO_TRANSPORTISTA_NOMBRE?: string | null;
  RBO_PLACA_VEHICULO?: string | null;
  RBO_MODELO_VEHICULO?: string | null;
  RBO_ID_EMPLEADO_CHOFER?: number | string | null;
  RBO_ID_VEHICULO?: number | string | null;
  RBO_ID_CONDUCTOR?: number | string | null;
  RBO_ID_PROVEEDOR_TRANSPORTE?: number | string | null;
  RBO_PLACA_AJENA?: string | null;
  RBO_MODELO_AJENO?: string | null;
  RBO_NOMBRE_ARCHIVO_PDF?: string | null;
  CHOFER_NOMBRE?: string | null;
  CONDUCTOR_NOMBRE?: string | null;
  CON_DPI?: string | null;
  CON_NO_LICENCIA?: string | null;
  CON_TIPO_LICENCIA?: string | null;
  CON_FECHA_VENCIMIENTO_LIC?: Date | string | null;
  VEH_PLACA?: string | null;
  VEH_MARCA?: string | null;
  VEH_MODELO?: string | null;
  PROV_TRANSP_NOMBRE?: string | null;
  SOL_NO_DOCUMENTO?: string | null;
  PRO_NOMBRE_ENTIDAD?: string | null;
  PRO_NIT?: string | null;
  MIN_REFERENCIA_EXTERNA?: string | null;
}

interface IDetalleRecepcionDbRow {
  DRE_ID_DETALLE_RECEPCION: number | string;
  DRE_NO_RECEPCION: string;
  DRE_CODIGO_ARTICULO: string;
  ART_DESCRIPCION?: string | null;
  UME_NOMBRE_UNIDAD?: string | null;
  DRE_CANTIDAD_RECIBIDA: number | string;
  DRE_VERIFICADO_FISICAMENTE: number | string;
  DMI_ID_UBICACION?: number | string | null;
  UBI_CODIGO_UBICACION?: string | null;
  DMI_ID_LOTE?: number | string | null;
  LOT_NUMERO_LOTE?: string | null;
  DMI_COSTO_UNITARIO?: number | string | null;
  DMI_COSTO_TOTAL?: number | string | null;
}

function mapRowToRecepcion(row: IRecepcionBodegaDbRow): IRecepcionBodega {
  let guia = '';
  let transp = row.PROV_TRANSP_NOMBRE || row.RBO_TRANSPORTISTA_NOMBRE || '';
  if (row.MIN_REFERENCIA_EXTERNA) {
    const parts = row.MIN_REFERENCIA_EXTERNA.split('|');
    for (const p of parts) {
      if (p.includes('Guía:')) guia = p.replace('Guía:', '').trim();
      if (!transp && p.includes('Transp:')) transp = p.replace('Transp:', '').trim();
    }
  }

  const placaFinal = row.RBO_PLACA_VEHICULO || row.VEH_PLACA || row.RBO_PLACA_AJENA || null;
  const modeloFinal = row.RBO_MODELO_VEHICULO || (row.VEH_MARCA ? `${row.VEH_MARCA} ${row.VEH_MODELO || ''}`.trim() : row.RBO_MODELO_AJENO) || null;
  const choferNombreFinal = row.CONDUCTOR_NOMBRE || row.CHOFER_NOMBRE || null;

  return {
    rboNoRecepcion: String(row.RBO_NO_RECEPCION),
    rboNoPo: String(row.RBO_NO_PO),
    rboIdBodega: Number(row.RBO_ID_BODEGA),
    bodNombre: row.BOD_NOMBRE ? String(row.BOD_NOMBRE) : null,
    bodCodigo: row.BOD_CODIGO ? String(row.BOD_CODIGO) : null,
    rboIdUsuarioBodega: Number(row.RBO_ID_USUARIO_BODEGA),
    usuarioNombre: row.USUARIO_NOMBRE ? String(row.USUARIO_NOMBRE) : `Usuario #${row.RBO_ID_USUARIO_BODEGA}`,
    rboFechaRecepcion: row.RBO_FECHA_RECEPCION,
    rboTipoRecepcion: String(row.RBO_TIPO_RECEPCION || 'TOTAL'),
    rboSubtotalRecibido: Number(row.RBO_SUBTOTAL_RECIBIDO || 0),
    rboIvaRecibido: Number(row.RBO_IVA_RECIBIDO || 0),
    rboTotalFacturar: Number(row.RBO_TOTAL_FACTURAR || 0),
    rboTipoTransporte: row.RBO_TIPO_TRANSPORTE || 'AJENO',
    rboTransportistaNombre: row.PROV_TRANSP_NOMBRE || row.RBO_TRANSPORTISTA_NOMBRE || transp || null,
    rboPlacaVehiculo: placaFinal,
    rboModeloVehiculo: modeloFinal,
    rboIdEmpleadoChofer: row.RBO_ID_EMPLEADO_CHOFER ? Number(row.RBO_ID_EMPLEADO_CHOFER) : null,
    empleadoChoferNombre: choferNombreFinal,
    rboIdVehiculo: row.RBO_ID_VEHICULO !== null && row.RBO_ID_VEHICULO !== undefined ? Number(row.RBO_ID_VEHICULO) : null,
    rboIdConductor: row.RBO_ID_CONDUCTOR !== null && row.RBO_ID_CONDUCTOR !== undefined ? Number(row.RBO_ID_CONDUCTOR) : null,
    rboIdProveedorTransporte: row.RBO_ID_PROVEEDOR_TRANSPORTE !== null && row.RBO_ID_PROVEEDOR_TRANSPORTE !== undefined ? Number(row.RBO_ID_PROVEEDOR_TRANSPORTE) : null,
    rboPlacaAjena: row.RBO_PLACA_AJENA || null,
    rboModeloAjeno: row.RBO_MODELO_AJENO || null,
    rboNombreArchivoPdf: row.RBO_NOMBRE_ARCHIVO_PDF || null,
    vehPlaca: row.VEH_PLACA || null,
    vehMarca: row.VEH_MARCA || null,
    vehModelo: row.VEH_MODELO || null,
    conDpi: row.CON_DPI || null,
    conNoLicencia: row.CON_NO_LICENCIA || null,
    conTipoLicencia: row.CON_TIPO_LICENCIA || null,
    conFechaVencimientoLic: row.CON_FECHA_VENCIMIENTO_LIC || null,
    solNoDocumento: row.SOL_NO_DOCUMENTO ? String(row.SOL_NO_DOCUMENTO) : null,
    proNombreEntidad: row.PRO_NOMBRE_ENTIDAD ? String(row.PRO_NOMBRE_ENTIDAD) : null,
    proNit: row.PRO_NIT ? String(row.PRO_NIT) : null,
    guiaDespacho: guia || null,
    transportista: row.PROV_TRANSP_NOMBRE || transp || choferNombreFinal || null,
  };
}

export class RecepcionBodegaRepository {
  /**
   * Consulta el listado de recepciones en bodega registradas en Oracle
   */
  static async findAll(filters: IRecepcionFilterParams = {}): Promise<IRecepcionBodega[]> {
    let sql = `
      SELECT 
        r.RBO_NO_RECEPCION,
        r.RBO_NO_PO,
        r.RBO_ID_BODEGA,
        b.BOD_NOMBRE,
        b.BOD_CODIGO,
        r.RBO_ID_USUARIO_BODEGA,
        COALESCE(u.USU_NOMBRE_COMPLETO, TRIM(emp.NOMBRE || ' ' || NVL(emp.APELLIDO, ''))) AS USUARIO_NOMBRE,
        r.RBO_FECHA_RECEPCION,
        r.RBO_TIPO_RECEPCION,
        r.RBO_SUBTOTAL_RECIBIDO,
        r.RBO_IVA_RECIBIDO,
        r.RBO_TOTAL_FACTURAR,
        r.RBO_TIPO_TRANSPORTE,
        r.RBO_TRANSPORTISTA_NOMBRE,
        r.RBO_PLACA_VEHICULO,
        r.RBO_MODELO_VEHICULO,
        r.RBO_ID_EMPLEADO_CHOFER,
        r.RBO_ID_VEHICULO,
        r.RBO_ID_CONDUCTOR,
        r.RBO_ID_PROVEEDOR_TRANSPORTE,
        r.RBO_PLACA_AJENA,
        r.RBO_MODELO_AJENO,
        r.RBO_NOMBRE_ARCHIVO_PDF,
        TRIM(chofer.NOMBRE || ' ' || NVL(chofer.APELLIDO, '')) AS CHOFER_NOMBRE,
        TRIM(condEmp.NOMBRE || ' ' || NVL(condEmp.APELLIDO, '')) AS CONDUCTOR_NOMBRE,
        cond.CON_DPI,
        cond.CON_NO_LICENCIA,
        cond.CON_TIPO_LICENCIA,
        cond.CON_FECHA_VENCIMIENTO_LIC,
        veh.VEH_PLACA,
        veh.VEH_MARCA,
        veh.VEH_MODELO,
        provTransp.PRO_NOMBRE_ENTIDAD AS PROV_TRANSP_NOMBRE,
        c.COT_NO_DOCUMENTO_SOLICITUD AS SOL_NO_DOCUMENTO,
        p.PRO_NOMBRE_ENTIDAD,
        p.PRO_NIT,
        m.MIN_REFERENCIA_EXTERNA
      FROM CMP_RECEPCION_BODEGA r
      LEFT JOIN CMP_BODEGA b ON r.RBO_ID_BODEGA = b.BOD_ID_BODEGA
      LEFT JOIN CMP_ORDEN_COMPRA o ON r.RBO_NO_PO = o.OCO_NO_PO
      LEFT JOIN CMP_COTIZACION c ON o.OCO_ID_COTIZACION_GANADORA = c.COT_ID_COTIZACION
      LEFT JOIN PROVEEDOR p ON c.COT_ID_PROVEEDOR = p.PRO_ID_PROVEEDOR
      LEFT JOIN USUARIO u ON r.RBO_ID_USUARIO_BODEGA = u.USU_ID_USUARIO
      LEFT JOIN EMPLEADO emp ON r.RBO_ID_USUARIO_BODEGA = emp.ID_EMPLEADO
      LEFT JOIN EMPLEADO chofer ON r.RBO_ID_EMPLEADO_CHOFER = chofer.ID_EMPLEADO
      LEFT JOIN CMP_VEHICULO veh ON r.RBO_ID_VEHICULO = veh.VEH_ID_VEHICULO
      LEFT JOIN CMP_CONDUCTOR cond ON r.RBO_ID_CONDUCTOR = cond.CON_ID_CONDUCTOR
      LEFT JOIN EMPLEADO condEmp ON cond.CON_ID_EMPLEADO = condEmp.ID_EMPLEADO
      LEFT JOIN PROVEEDOR provTransp ON r.RBO_ID_PROVEEDOR_TRANSPORTE = provTransp.PRO_ID_PROVEEDOR
      LEFT JOIN CMP_MOVIMIENTO_INVENTARIO m ON r.RBO_NO_RECEPCION = m.MIN_NO_RECEPCION_ORIGEN
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};


    if (filters.noRecepcion) {
      sql += ` AND r.RBO_NO_RECEPCION = :noRec`;
      binds.noRec = filters.noRecepcion;
    }

    if (filters.noPo) {
      sql += ` AND r.RBO_NO_PO = :noPo`;
      binds.noPo = filters.noPo;
    }

    if (filters.idBodega) {
      sql += ` AND r.RBO_ID_BODEGA = :idBod`;
      binds.idBod = filters.idBodega;
    }

    if (filters.tipoRecepcion) {
      sql += ` AND UPPER(r.RBO_TIPO_RECEPCION) = :tipoRec`;
      binds.tipoRec = filters.tipoRecepcion.toUpperCase();
    }

    sql += ` ORDER BY r.RBO_FECHA_RECEPCION DESC, r.RBO_NO_RECEPCION DESC`;

    const result = await execute<IRecepcionBodegaDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToRecepcion);
  }

  /**
   * Obtiene una recepción completa por su número oficial REC-YYYY-XXXX
   */
  static async findByNoRecepcion(noRecepcion: string): Promise<IRecepcionBodegaCompleta | null> {
    const list = await this.findAll({ noRecepcion });
    if (list.length === 0) return null;

    const cabecera = list[0];

    const detSql = `
      SELECT 
        d.DRE_ID_DETALLE_RECEPCION,
        d.DRE_NO_RECEPCION,
        d.DRE_CODIGO_ARTICULO,
        a.ART_DESCRIPCION,
        u.UME_NOMBRE_UNIDAD,
        d.DRE_CANTIDAD_RECIBIDA,
        d.DRE_VERIFICADO_FISICAMENTE,
        dm.DMI_ID_UBICACION,
        ub.UBI_CODIGO_UBICACION,
        dm.DMI_ID_LOTE,
        lt.LOT_NUMERO_LOTE,
        dm.DMI_COSTO_UNITARIO,
        dm.DMI_COSTO_TOTAL
      FROM CMP_DETALLE_RECEPCION d
      LEFT JOIN CMP_ARTICULO a ON d.DRE_CODIGO_ARTICULO = a.ART_CODIGO_ARTICULO
      LEFT JOIN CMP_UNIDAD_MEDIDA u ON a.ART_ID_UNIDAD_COMPRA = u.UME_ID_UNIDAD
      LEFT JOIN CMP_MOVIMIENTO_INVENTARIO m ON d.DRE_NO_RECEPCION = m.MIN_NO_RECEPCION_ORIGEN
      LEFT JOIN CMP_DETALLE_MOVIMIENTO_INV dm ON m.MIN_ID_MOVIMIENTO = dm.DMI_ID_MOVIMIENTO AND d.DRE_CODIGO_ARTICULO = dm.DMI_CODIGO_ARTICULO
      LEFT JOIN CMP_UBICACION ub ON dm.DMI_ID_UBICACION = ub.UBI_ID_UBICACION
      LEFT JOIN CMP_LOTE lt ON dm.DMI_ID_LOTE = lt.LOT_ID_LOTE
      WHERE d.DRE_NO_RECEPCION = :noRec
      ORDER BY d.DRE_ID_DETALLE_RECEPCION ASC
    `;

    const detRes = await execute<IDetalleRecepcionDbRow>(detSql, { noRec: noRecepcion });
    const detalles: IDetalleRecepcion[] = (detRes.rows || []).map((r) => ({
      dreIdDetalleRecepcion: Number(r.DRE_ID_DETALLE_RECEPCION),
      dreNoRecepcion: String(r.DRE_NO_RECEPCION),
      dreCodigoArticulo: String(r.DRE_CODIGO_ARTICULO),
      artDescripcion: r.ART_DESCRIPCION ? String(r.ART_DESCRIPCION) : r.DRE_CODIGO_ARTICULO,
      umeNombreUnidad: r.UME_NOMBRE_UNIDAD ? String(r.UME_NOMBRE_UNIDAD) : 'UND',
      dreCantidadRecibida: Number(r.DRE_CANTIDAD_RECIBIDA || 0),
      dreVerificadoFisicamente: Number(r.DRE_VERIFICADO_FISICAMENTE || 0),
      idUbicacion: r.DMI_ID_UBICACION !== null && r.DMI_ID_UBICACION !== undefined ? Number(r.DMI_ID_UBICACION) : null,
      ubiCodigoUbicacion: r.UBI_CODIGO_UBICACION ? String(r.UBI_CODIGO_UBICACION) : null,
      idLote: r.DMI_ID_LOTE !== null && r.DMI_ID_LOTE !== undefined ? Number(r.DMI_ID_LOTE) : null,
      numeroLote: r.LOT_NUMERO_LOTE ? String(r.LOT_NUMERO_LOTE) : null,
      precioUnitario: Number(r.DMI_COSTO_UNITARIO || 0),
      totalLinea: Number(r.DMI_COSTO_TOTAL || 0),
    }));

    return {
      ...cabecera,
      detalles,
    };
  }

  /**
   * Obtiene la recepción asociada a un número de Orden de Compra (PO)
   */
  static async findByNoPo(noPo: string): Promise<IRecepcionBodegaCompleta | null> {
    const list = await this.findAll({ noPo });
    if (list.length === 0) return null;
    return await this.findByNoRecepcion(list[0].rboNoRecepcion);
  }

  /**
   * Registra la recepción física de mercancía en bodega, realiza el conteo físico,
   * actualiza Kardex (CMP_MOVIMIENTO_INVENTARIO) e impacta las existencias en CMP_INVENTARIO.
   */
  static async registrarRecepcion(dto: IRegistrarRecepcionDTO): Promise<IRecepcionBodegaCompleta> {
    const noRecepcionFinal = await withTransaction(async (conn) => {
      const year = new Date().getFullYear();

      // 1. Generar número de recepción oficial REC-YYYY-XXXX garantizando unicidad
      const countRecRes = await conn.execute<any>(`SELECT COUNT(*) AS CNT FROM CMP_RECEPCION_BODEGA`);
      const nextRecNum = (countRecRes.rows?.[0]?.CNT ? Number(countRecRes.rows[0].CNT) : 0) + 1;
      const noRecepcionFinal = `REC-${year}-${String(nextRecNum).padStart(4, '0')}`;

      const items = dto.detalles || dto.items || [];

      // 2. Calcular montos recibidos y determinar tipo de recepción (TOTAL vs PARCIAL)
      let subtotalRecibido = 0;
      let esRecepcionTotal = true;

      for (const item of items) {
        const cantPedida = Number(item.cantidadPedida || 0);
        const cantRecibida = Number(item.cantidadRecibida || 0);
        const precioUnitario = Number(item.precioUnitario || item.costoUnitario || 0);

        if (cantPedida > 0 && cantRecibida < cantPedida) {
          esRecepcionTotal = false;
        }

        subtotalRecibido += +(cantRecibida * precioUnitario).toFixed(2);
      }

      subtotalRecibido = +subtotalRecibido.toFixed(2);
      let ivaRecibido = +(subtotalRecibido * 0.12).toFixed(2);
      let totalFacturar = +(subtotalRecibido + ivaRecibido).toFixed(2);

      // Si es recepción total y existe la PO, heredar exactamente los valores de la PO para evitar descuadres de redondeo o duplicación de IVA
      if (dto.noPo) {
        const poRes = await conn.execute<any>(
          `SELECT OCO_SUBTOTAL, OCO_MONTO_IVA, OCO_TOTAL FROM CMP_ORDEN_COMPRA WHERE OCO_NO_PO = :noPo`,
          { noPo: dto.noPo.trim() }
        );
        if (esRecepcionTotal && poRes.rows && poRes.rows.length > 0) {
          const poRow = poRes.rows[0];
          if (poRow.OCO_SUBTOTAL != null) {
            subtotalRecibido = Number(poRow.OCO_SUBTOTAL);
            ivaRecibido = Number(poRow.OCO_MONTO_IVA != null ? poRow.OCO_MONTO_IVA : +(subtotalRecibido * 0.12).toFixed(2));
            totalFacturar = Number(poRow.OCO_TOTAL != null ? poRow.OCO_TOTAL : +(subtotalRecibido + ivaRecibido).toFixed(2));
          }
        }
      }

      const tipoRecepcion = esRecepcionTotal ? 'TOTAL' : 'PARCIAL';

      // Resolver ID de usuario bodega válido
      let usuarioId = dto.idUsuarioBodega || 1;
      try {
        const usuCheck = await conn.execute<any>(
          `SELECT ID_EMPLEADO FROM EMPLEADO WHERE ID_EMPLEADO = :uId UNION SELECT USU_ID_USUARIO FROM USUARIO WHERE USU_ID_USUARIO = :uId`,
          { uId: usuarioId }
        );
        if (!usuCheck.rows || usuCheck.rows.length === 0) {
          const firstEmp = await conn.execute<any>(`SELECT NVL(MIN(ID_EMPLEADO), 1) AS MIN_ID FROM EMPLEADO`);
          usuarioId = Number(firstEmp.rows?.[0]?.MIN_ID || 1);
        }
      } catch (_e) {
        usuarioId = 1;
      }

      // 3. Insertar en CMP_RECEPCION_BODEGA
      const tipoTransp = (dto.tipoTransporte || 'AJENO').toUpperCase() === 'PROPIO' ? 'PROPIO' : 'AJENO';
      const transpNombre = dto.transportistaNombre || dto.transportista || null;
      const placa = dto.placaVehiculo?.trim() || dto.placaAjena?.trim() || null;
      const modelo = dto.modeloVehiculo?.trim() || dto.modeloAjeno?.trim() || null;
      const choferId = tipoTransp === 'PROPIO' && dto.idEmpleadoChofer ? Number(dto.idEmpleadoChofer) : null;
      const vehiculoId = tipoTransp === 'PROPIO' && dto.idVehiculo ? Number(dto.idVehiculo) : null;
      const conductorId = tipoTransp === 'PROPIO' && dto.idConductor ? Number(dto.idConductor) : null;
      const provTranspId = tipoTransp === 'AJENO' && dto.idProveedorTransporte ? Number(dto.idProveedorTransporte) : null;
      const placaAjena = tipoTransp === 'AJENO' ? (dto.placaAjena?.trim() || dto.placaVehiculo?.trim() || null) : null;
      const modeloAjeno = tipoTransp === 'AJENO' ? (dto.modeloAjeno?.trim() || dto.modeloVehiculo?.trim() || null) : null;
      const docBlob = dto.documentoBlob || null;
      const nombreArchivoPdf = dto.nombreArchivoPdf || (docBlob ? `Comprobante_${noRecepcionFinal}.pdf` : null);

      const insertRboSql = `
        INSERT INTO CMP_RECEPCION_BODEGA (
          RBO_NO_RECEPCION,
          RBO_NO_PO,
          RBO_ID_BODEGA,
          RBO_ID_USUARIO_BODEGA,
          RBO_FECHA_RECEPCION,
          RBO_TIPO_RECEPCION,
          RBO_SUBTOTAL_RECIBIDO,
          RBO_IVA_RECIBIDO,
          RBO_TOTAL_FACTURAR,
          RBO_TIPO_TRANSPORTE,
          RBO_TRANSPORTISTA_NOMBRE,
          RBO_PLACA_VEHICULO,
          RBO_MODELO_VEHICULO,
          RBO_ID_EMPLEADO_CHOFER,
          RBO_ID_VEHICULO,
          RBO_ID_CONDUCTOR,
          RBO_ID_PROVEEDOR_TRANSPORTE,
          RBO_PLACA_AJENA,
          RBO_MODELO_AJENO,
          RBO_DOCUMENTO_BLOB,
          RBO_NOMBRE_ARCHIVO_PDF
        ) VALUES (
          :noRec,
          :noPo,
          :idBodega,
          :idUsuario,
          SYSDATE,
          :tipoRec,
          :subtotal,
          :iva,
          :total,
          :tipoTransp,
          :transpNombre,
          :placa,
          :modelo,
          :choferId,
          :vehiculoId,
          :conductorId,
          :provTranspId,
          :placaAjena,
          :modeloAjeno,
          :docBlob,
          :nombreArchivoPdf
        )
      `;

      await conn.execute(insertRboSql, {
        noRec: noRecepcionFinal,
        noPo: dto.noPo,
        idBodega: dto.idBodega,
        idUsuario: usuarioId,
        tipoRec: tipoRecepcion,
        subtotal: subtotalRecibido,
        iva: ivaRecibido,
        total: totalFacturar,
        tipoTransp,
        transpNombre,
        placa,
        modelo,
        choferId,
        vehiculoId,
        conductorId,
        provTranspId,
        placaAjena,
        modeloAjeno,
        docBlob,
        nombreArchivoPdf,
      });


      // 4. Insertar líneas en CMP_DETALLE_RECEPCION
      let detRecIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(DRE_ID_DETALLE_RECEPCION), 0) AS MAX_ID FROM CMP_DETALLE_RECEPCION`
      );
      let currDetRecId = Number(detRecIdRes.rows?.[0]?.MAX_ID || 0);

      for (const item of items) {
        currDetRecId += 1;
        await conn.execute(
          `INSERT INTO CMP_DETALLE_RECEPCION (
            DRE_ID_DETALLE_RECEPCION,
            DRE_NO_RECEPCION,
            DRE_CODIGO_ARTICULO,
            DRE_CANTIDAD_RECIBIDA,
            DRE_VERIFICADO_FISICAMENTE
          ) VALUES (
            :idDetRec,
            :noRec,
            :codArt,
            :cantRecibida,
            :verificado
          )`,
          {
            idDetRec: currDetRecId,
            noRec: noRecepcionFinal,
            codArt: item.codigoArticulo,
            cantRecibida: Number(item.cantidadRecibida || 0),
            verificado: item.verificadoFisicamente ? 1 : 0,
          }
        );
      }

      // 5. Generar Movimiento de Kardex (CMP_MOVIMIENTO_INVENTARIO)
      let maxMovIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(MIN_ID_MOVIMIENTO), 0) AS MAX_ID FROM CMP_MOVIMIENTO_INVENTARIO`
      );
      const nextMovId = Number(maxMovIdRes.rows?.[0]?.MAX_ID || 0) + 1;
      const numeroMovimiento = `MOV-${year}-${String(nextMovId).padStart(4, '0')}`;

      // Obtener el tipo de movimiento para compra (REC_COMPRA)
      let tmiId = 1;
      try {
        const tmiRes = await conn.execute<any>(
          `SELECT TMI_ID_TIPO_MOVIMIENTO FROM CMP_TIPO_MOVIMIENTO_INV WHERE UPPER(TMI_CODIGO) = 'REC_COMPRA' AND ROWNUM = 1`
        );
        if (tmiRes.rows && tmiRes.rows.length > 0) {
          tmiId = Number(tmiRes.rows[0].TMI_ID_TIPO_MOVIMIENTO);
        }
      } catch (_err) {
        tmiId = 1;
      }

      const refExterna = `Guía: ${dto.guiaDespacho || 'S/G'} | Transp: ${dto.transportista || 'Conductor asignado'}`;
      const obsKardex = `Entrada por Recepción de Compras ${noRecepcionFinal} (PO: ${dto.noPo}). ${dto.observaciones || ''}`.trim();

      await conn.execute(
        `INSERT INTO CMP_MOVIMIENTO_INVENTARIO (
          MIN_ID_MOVIMIENTO,
          MIN_NUMERO_MOVIMIENTO,
          MIN_ID_TIPO_MOVIMIENTO,
          MIN_ID_BODEGA_ORIGEN,
          MIN_FECHA_MOVIMIENTO,
          MIN_NO_RECEPCION_ORIGEN,
          MIN_REFERENCIA_EXTERNA,
          MIN_ID_USUARIO,
          MIN_ESTADO,
          MIN_OBSERVACIONES
        ) VALUES (
          :movId,
          :numMov,
          :tmiId,
          :idBodega,
          CURRENT_TIMESTAMP,
          :noRec,
          :refExt,
          :idUsuario,
          'APLICADO',
          :obs
        )`,
        {
          movId: nextMovId,
          numMov: numeroMovimiento,
          tmiId,
          idBodega: dto.idBodega,
          noRec: noRecepcionFinal,
          refExt: refExterna.substring(0, 100),
          idUsuario: usuarioId,
          obs: obsKardex.substring(0, 500),
        }
      );

      // 6. Insertar detalle de movimiento (CMP_DETALLE_MOVIMIENTO_INV) y actualizar inventario físico (CMP_INVENTARIO)
      let maxDmiIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(DMI_ID_DETALLE), 0) AS MAX_ID FROM CMP_DETALLE_MOVIMIENTO_INV`
      );
      let currDmiId = Number(maxDmiIdRes.rows?.[0]?.MAX_ID || 0);

      // Obtener una ubicación válida por defecto para esta bodega si existe
      let defaultBodegaUbiId: number | null = null;
      try {
        const ubiBodRes = await conn.execute<any>(
          `SELECT UBI_ID_UBICACION FROM CMP_UBICACION WHERE UBI_ID_BODEGA = :idBodega AND ROWNUM = 1`,
          { idBodega: dto.idBodega }
        );
        if (ubiBodRes.rows && ubiBodRes.rows.length > 0) {
          defaultBodegaUbiId = Number(ubiBodRes.rows[0].UBI_ID_UBICACION);
        }
      } catch (_e) {
        defaultBodegaUbiId = null;
      }

      for (const item of items) {
        currDmiId += 1;
        const cant = Number(item.cantidadRecibida || 0);
        const costoUnit = Number(item.precioUnitario || item.costoUnitario || 0);
        const costoTot = +(cant * costoUnit).toFixed(2);

        // Validar que la ubicación especificada realmente exista en CMP_UBICACION
        let validUbiId: number | null = null;
        if (item.idUbicacion && Number(item.idUbicacion) > 0) {
          try {
            const checkUbi = await conn.execute<any>(
              `SELECT UBI_ID_UBICACION FROM CMP_UBICACION WHERE UBI_ID_UBICACION = :idUbi`,
              { idUbi: Number(item.idUbicacion) }
            );
            if (checkUbi.rows && checkUbi.rows.length > 0) {
              validUbiId = Number(item.idUbicacion);
            }
          } catch (_e) {
            validUbiId = defaultBodegaUbiId;
          }
        }
        if (!validUbiId) {
          validUbiId = defaultBodegaUbiId;
        }

        // Consultar existencia previa en CMP_INVENTARIO
        const invCheckRes = await conn.execute<any>(
          `SELECT 
            INV_ID_INVENTARIO,
            INV_EXISTENCIA_ACTUAL,
            INV_STOCK_DISPONIBLE,
            INV_STOCK_MAXIMO
           FROM CMP_INVENTARIO
           WHERE INV_ID_BODEGA = :idBodega AND UPPER(TRIM(INV_CODIGO_ARTICULO)) = UPPER(TRIM(:codArt))`,
          {
            idBodega: dto.idBodega,
            codArt: item.codigoArticulo,
          }
        );

        let existPrevia = 0;
        let existPosterior = cant;

        if (invCheckRes.rows && invCheckRes.rows.length > 0) {
          existPrevia = Number(invCheckRes.rows[0].INV_EXISTENCIA_ACTUAL || 0);
          existPosterior = existPrevia + cant;

          // Actualizar existencia y costo en CMP_INVENTARIO
          await conn.execute(
            `UPDATE CMP_INVENTARIO
             SET INV_EXISTENCIA_ACTUAL = INV_EXISTENCIA_ACTUAL + :cant,
                 INV_STOCK_DISPONIBLE = INV_STOCK_DISPONIBLE + :cant,
                 INV_STOCK_MAXIMO = GREATEST(INV_STOCK_MAXIMO, INV_EXISTENCIA_ACTUAL + :cant + 50),
                 INV_ULTIMO_COSTO_COMPRA = :costoUnit,
                 INV_FECHA_ULTIMO_MOVIMIENTO = CURRENT_TIMESTAMP,
                 INV_ID_UBICACION_DEFECTO = NVL(:idUbi, INV_ID_UBICACION_DEFECTO)
             WHERE INV_ID_BODEGA = :idBodega AND UPPER(TRIM(INV_CODIGO_ARTICULO)) = UPPER(TRIM(:codArt))`,
            {
              cant,
              costoUnit,
              idUbi: validUbiId,
              idBodega: dto.idBodega,
              codArt: item.codigoArticulo,
            }
          );
        } else {
          // Si no existe aún el registro en la bodega, insertarlo con márgenes correctos
          let maxInvIdRes = await conn.execute<any>(
            `SELECT NVL(MAX(INV_ID_INVENTARIO), 0) AS MAX_ID FROM CMP_INVENTARIO`
          );
          const nextInvId = Number(maxInvIdRes.rows?.[0]?.MAX_ID || 0) + 1;
          const maxStockCalculado = Math.max(1000, cant * 2);

          await conn.execute(
            `INSERT INTO CMP_INVENTARIO (
              INV_ID_INVENTARIO,
              INV_ID_BODEGA,
              INV_CODIGO_ARTICULO,
              INV_ID_UBICACION_DEFECTO,
              INV_EXISTENCIA_ACTUAL,
              INV_STOCK_RESERVADO,
              INV_STOCK_DISPONIBLE,
              INV_STOCK_MINIMO,
              INV_STOCK_MAXIMO,
              INV_PUNTO_REORDEN,
              INV_COSTO_PROMEDIO_LOCAL,
              INV_ULTIMO_COSTO_COMPRA,
              INV_FECHA_ULTIMO_MOVIMIENTO
            ) VALUES (
              :invId,
              :idBodega,
              :codArt,
              :idUbi,
              :cant,
              0,
              :cant,
              0,
              :stockMax,
              5,
              :costoUnit,
              :costoUnit,
              CURRENT_TIMESTAMP
            )`,
            {
              invId: nextInvId,
              idBodega: dto.idBodega,
              codArt: item.codigoArticulo,
              idUbi: validUbiId,
              cant,
              stockMax: maxStockCalculado,
              costoUnit,
            }
          );
        }

        // Insertar en CMP_DETALLE_MOVIMIENTO_INV
        await conn.execute(
          `INSERT INTO CMP_DETALLE_MOVIMIENTO_INV (
            DMI_ID_DETALLE,
            DMI_ID_MOVIMIENTO,
            DMI_CODIGO_ARTICULO,
            DMI_ID_LOTE,
            DMI_ID_UBICACION,
            DMI_CANTIDAD,
            DMI_COSTO_UNITARIO,
            DMI_COSTO_TOTAL,
            DMI_EXISTENCIA_PREVIA,
            DMI_EXISTENCIA_POSTERIOR
          ) VALUES (
            :dmiId,
            :movId,
            :codArt,
            :idLote,
            :idUbi,
            :cant,
            :costoUnit,
            :costoTot,
            :prev,
            :post
          )`,
          {
            dmiId: currDmiId,
            movId: nextMovId,
            codArt: item.codigoArticulo,
            idLote: null,
            idUbi: validUbiId,
            cant,
            costoUnit,
            costoTot,
            prev: existPrevia,
            post: existPosterior,
          }
        );
      }

      // 7. Actualizar notas de la solicitud manteniendo el estado en Bodega (ID 4) sin auto-avanzar indebidamente
      let noSolicitudTarget = dto.noDocumentoSolicitud;
      if (!noSolicitudTarget) {
        const solLookupRes = await conn.execute<any>(
          `SELECT c.COT_NO_DOCUMENTO_SOLICITUD AS NO_SOL
           FROM CMP_ORDEN_COMPRA o
           JOIN CMP_COTIZACION c ON o.OCO_ID_COTIZACION_GANADORA = c.COT_ID_COTIZACION
           WHERE o.OCO_NO_PO = :noPo`,
          { noPo: dto.noPo }
        );
        noSolicitudTarget = solLookupRes.rows?.[0]?.NO_SOL || solLookupRes.rows?.[0]?.[0] || null;
      }

      const notaRecepcion = `[RECEPCIÓN BODEGA]: ${noRecepcionFinal} aplicada (${tipoRecepcion}). Guía: ${dto.guiaDespacho || 'S/G'}`;

      await conn.execute(
        `UPDATE CMP_SOLICITUD_COMPRA 
         SET SOL_ID_ESTADO = 4,
             SOL_NOTAS = CASE WHEN SOL_NOTAS IS NULL THEN :nota ELSE SUBSTR(SOL_NOTAS || ' | ' || :nota, 1, 500) END
         WHERE SOL_NO_DOCUMENTO = :noSol
            OR SOL_NO_DOCUMENTO IN (
              SELECT c.COT_NO_DOCUMENTO_SOLICITUD
              FROM CMP_ORDEN_COMPRA o
              JOIN CMP_COTIZACION c ON o.OCO_ID_COTIZACION_GANADORA = c.COT_ID_COTIZACION
              WHERE o.OCO_NO_PO = :noPo
            )`,
        {
          nota: notaRecepcion,
          noSol: noSolicitudTarget || 'UNKNOWN',
          noPo: dto.noPo,
        }
      );

      // 8. Actualizar estado de la Orden de Compra manteniendo estado RECIBIDA / EN BODEGA (ID 4)
      await conn.execute(
        `UPDATE CMP_ORDEN_COMPRA 
         SET OCO_ID_ESTADO = 4 
         WHERE OCO_NO_PO = :noPo`,
        { noPo: dto.noPo }
      );

      return noRecepcionFinal;
    });

    // 9. Consultar y retornar la recepción completa UNA VEZ CONFIRMADA LA TRANSACCIÓN (COMMIT)
    const creada = await this.findByNoRecepcion(noRecepcionFinal);
    if (!creada) {
      throw new Error(`Error al recuperar la recepción ${noRecepcionFinal} generada.`);
    }
    return creada;
  }

  /**
   * Obtiene el documento físico / guía de remisión en BLOB desde Oracle
   */
  static async findDocumentoBlob(noRecepcion: string): Promise<{ blob: Buffer | null; filename: string } | null> {
    const sql = `
      SELECT RBO_NO_RECEPCION, RBO_DOCUMENTO_BLOB, RBO_NOMBRE_ARCHIVO_PDF
      FROM CMP_RECEPCION_BODEGA
      WHERE RBO_NO_RECEPCION = :noRec
    `;
    const result = await execute<{ RBO_NO_RECEPCION: string; RBO_DOCUMENTO_BLOB: Buffer | null; RBO_NOMBRE_ARCHIVO_PDF?: string | null }>(
      sql,
      { noRec: noRecepcion.trim() }
    );

    if (!result.rows || result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      blob: row.RBO_DOCUMENTO_BLOB || null,
      filename: row.RBO_NOMBRE_ARCHIVO_PDF || `Documento_Recepcion_${row.RBO_NO_RECEPCION}.pdf`,
    };
  }

  /**
   * Guarda o actualiza el documento de recepción en formato BLOB
   */
  static async guardarDocumentoBlob(noRecepcion: string, buffer: Buffer, filename: string): Promise<void> {
    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE CMP_RECEPCION_BODEGA 
         SET RBO_DOCUMENTO_BLOB = :docBlob,
             RBO_NOMBRE_ARCHIVO_PDF = :filename
         WHERE RBO_NO_RECEPCION = :noRec`,
        {
          docBlob: buffer,
          filename: filename.trim(),
          noRec: noRecepcion.trim(),
        }
      );
    });
  }
}

