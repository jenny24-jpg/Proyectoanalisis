import { execute, withTransaction } from '../../../config/database.js';
import {
  ISolicitudCompra,
  ISolicitudCompraFilterParams,
  ISolicitudCompraDetalle,
  ISolicitudCompraCompleta,
  IUpdateSolicitudCompraDTO,
  IAprobarSolicitudDTO,
  IRechazarSolicitudDTO,
} from '@erp/contracts';

/**
 * Estructura interna de los registros devueltos por Oracle DB para CMP_SOLICITUD_COMPRA
 */
interface ISolicitudCompraDbRow {
  SOL_NO_DOCUMENTO: string;
  SOL_ID_USUARIO_RESPONSABLE: number | string;
  SOL_NOMBRE_RESPONSABLE?: string | null;
  SOL_ID_DEPARTAMENTO: number | string;
  SOL_NOMBRE_DEPARTAMENTO?: string | null;
  SOL_FECHA?: Date | string | null;
  SOL_NOTAS?: string | null;
  SOL_MONTO_TOTAL_ESTIMADO?: number | string | null;
  SOL_ID_ESTADO: number | string;
  EST_NOMBRE_ESTADO?: string | null;
}

/**
 * Mapea una fila de Oracle DB a la entidad ISolicitudCompra
 */
function mapRowToSolicitud(row: ISolicitudCompraDbRow): ISolicitudCompra {
  const deptoId = Number(row.SOL_ID_DEPARTAMENTO);
  const respId = Number(row.SOL_ID_USUARIO_RESPONSABLE);

  return {
    solNoDocumento: String(row.SOL_NO_DOCUMENTO),
    solIdUsuarioResponsable: respId,
    solNombreResponsable: row.SOL_NOMBRE_RESPONSABLE
      ? String(row.SOL_NOMBRE_RESPONSABLE)
      : `Empleado #${respId}`,
    solIdDepartamento: deptoId,
    solNombreDepartamento: row.SOL_NOMBRE_DEPARTAMENTO
      ? String(row.SOL_NOMBRE_DEPARTAMENTO)
      : `Departamento #${deptoId}`,
    solNombreEntidad: 'Módulo Compras ERP',
    solFecha: row.SOL_FECHA ? new Date(row.SOL_FECHA).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    solNotas: row.SOL_NOTAS ? String(row.SOL_NOTAS) : null,
    solMontoTotalEstimado: Number(row.SOL_MONTO_TOTAL_ESTIMADO || 0),
    solIdEstado: Number(row.SOL_ID_ESTADO),
    solNombreEstado: row.EST_NOMBRE_ESTADO ? String(row.EST_NOMBRE_ESTADO) : 'Aprobado',
  };
}

interface ISolicitudDetalleDbRow {
  DSO_ID_DETALLE_SOLICITUD: number | string;
  DSO_NO_DOCUMENTO_SOLICITUD: string;
  DSO_CODIGO_ARTICULO: string;
  ART_DESCRIPCION?: string | null;
  UME_NOMBRE_UNIDAD?: string | null;
  UME_ABREVIATURA?: string | null;
  DSO_CANTIDAD_PEDIDA: number | string;
  DSO_CANTIDAD_APROBADA?: number | string | null;
}

function mapRowToDetalle(row: ISolicitudDetalleDbRow): ISolicitudCompraDetalle {
  const cantPedida = Number(row.DSO_CANTIDAD_PEDIDA || 0);
  const cantAprobada =
    row.DSO_CANTIDAD_APROBADA !== null && row.DSO_CANTIDAD_APROBADA !== undefined
      ? Number(row.DSO_CANTIDAD_APROBADA)
      : cantPedida;

  return {
    dsoIdDetalleSolicitud: Number(row.DSO_ID_DETALLE_SOLICITUD),
    dsoNoDocumento: String(row.DSO_NO_DOCUMENTO_SOLICITUD),
    dsoCodigoArticulo: String(row.DSO_CODIGO_ARTICULO),
    artDescripcion: row.ART_DESCRIPCION ? String(row.ART_DESCRIPCION) : null,
    umeNombreUnidad: row.UME_NOMBRE_UNIDAD ? String(row.UME_NOMBRE_UNIDAD) : null,
    umeAbreviatura: row.UME_ABREVIATURA ? String(row.UME_ABREVIATURA) : null,
    dsoCantidadPedida: cantPedida,
    dsoCantidadAprobada: cantAprobada,
  };
}

/**
 * Repositorio de Acceso a Datos para Solicitudes de Compra en Oracle DB
 */
export class SolicitudCompraRepository {
  /**
   * Consulta todas las solicitudes de compra con información vinculada de empleado, departamento y estado.
   */
  static async findAll(filters: ISolicitudCompraFilterParams = {}): Promise<ISolicitudCompra[]> {
    let sql = `
      SELECT 
        S.SOL_NO_DOCUMENTO,
        S.SOL_ID_USUARIO_RESPONSABLE,
        TRIM(EMP.NOMBRE || ' ' || NVL(EMP.APELLIDO, '')) AS SOL_NOMBRE_RESPONSABLE,
        S.SOL_ID_DEPARTAMENTO,
        DEP.DEP_NOMBRE_DEPARTAMENTO AS SOL_NOMBRE_DEPARTAMENTO,
        S.SOL_FECHA,
        S.SOL_NOTAS,
        S.SOL_MONTO_TOTAL_ESTIMADO,
        S.SOL_ID_ESTADO,
        E.EST_NOMBRE_ESTADO
      FROM CMP_SOLICITUD_COMPRA S
      LEFT JOIN CMP_ESTADO E ON S.SOL_ID_ESTADO = E.EST_ID_ESTADO
      LEFT JOIN DEPARTAMENTO DEP ON S.SOL_ID_DEPARTAMENTO = DEP.DEP_ID_DEPARTAMENTO
      LEFT JOIN EMPLEADO EMP ON S.SOL_ID_USUARIO_RESPONSABLE = EMP.ID_EMPLEADO
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.noDocumento) {
      sql += ` AND S.SOL_NO_DOCUMENTO LIKE :noDocumento`;
      binds.noDocumento = `%${filters.noDocumento}%`;
    }

    if (filters.idDepartamento) {
      sql += ` AND S.SOL_ID_DEPARTAMENTO = :idDepartamento`;
      binds.idDepartamento = filters.idDepartamento;
    }

    if (filters.idEstado) {
      sql += ` AND S.SOL_ID_ESTADO = :idEstado`;
      binds.idEstado = filters.idEstado;
    }

    sql += ` ORDER BY S.SOL_FECHA DESC, S.SOL_NO_DOCUMENTO DESC`;

    const result = await execute<ISolicitudCompraDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToSolicitud);
  }

  /**
   * Obtiene una solicitud de compra por su número de documento único.
   */
  static async findByNoDocumento(noDocumento: string): Promise<ISolicitudCompra | null> {
    const sql = `
      SELECT 
        S.SOL_NO_DOCUMENTO,
        S.SOL_ID_USUARIO_RESPONSABLE,
        TRIM(EMP.NOMBRE || ' ' || NVL(EMP.APELLIDO, '')) AS SOL_NOMBRE_RESPONSABLE,
        S.SOL_ID_DEPARTAMENTO,
        DEP.DEP_NOMBRE_DEPARTAMENTO AS SOL_NOMBRE_DEPARTAMENTO,
        S.SOL_FECHA,
        S.SOL_NOTAS,
        S.SOL_MONTO_TOTAL_ESTIMADO,
        S.SOL_ID_ESTADO,
        E.EST_NOMBRE_ESTADO
      FROM CMP_SOLICITUD_COMPRA S
      LEFT JOIN CMP_ESTADO E ON S.SOL_ID_ESTADO = E.EST_ID_ESTADO
      LEFT JOIN DEPARTAMENTO DEP ON S.SOL_ID_DEPARTAMENTO = DEP.DEP_ID_DEPARTAMENTO
      LEFT JOIN EMPLEADO EMP ON S.SOL_ID_USUARIO_RESPONSABLE = EMP.ID_EMPLEADO
      WHERE S.SOL_NO_DOCUMENTO = :noDocumento
    `;

    const result = await execute<ISolicitudCompraDbRow>(sql, { noDocumento });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToSolicitud(result.rows[0]);
  }

  /**
   * Obtiene la lista de detalles/artículos de una solicitud de compra.
   */
  static async findDetallesByNoDocumento(noDocumento: string): Promise<ISolicitudCompraDetalle[]> {
    const sql = `
      SELECT 
        D.DSO_ID_DETALLE_SOLICITUD,
        D.DSO_NO_DOCUMENTO_SOLICITUD,
        D.DSO_CODIGO_ARTICULO,
        NVL(A.ART_DESCRIPCION, D.DSO_CODIGO_ARTICULO) AS ART_DESCRIPCION,
        U.UME_NOMBRE_UNIDAD,
        U.UME_ABREVIATURA,
        D.DSO_CANTIDAD_PEDIDA,
        D.DSO_CANTIDAD_APROBADA
      FROM CMP_DETALLE_SOLICITUD D
      LEFT JOIN CMP_ARTICULO A ON D.DSO_CODIGO_ARTICULO = A.ART_CODIGO_ARTICULO
      LEFT JOIN CMP_UNIDAD_MEDIDA U ON A.ART_ID_UNIDAD_COMPRA = U.UME_ID_UNIDAD
      WHERE D.DSO_NO_DOCUMENTO_SOLICITUD = :noDocumento
      ORDER BY D.DSO_ID_DETALLE_SOLICITUD ASC
    `;

    const result = await execute<ISolicitudDetalleDbRow>(sql, { noDocumento });
    return (result.rows || []).map(mapRowToDetalle);
  }

  /**
   * Obtiene una solicitud de compra con todos sus detalles.
   */
  static async findByNoDocumentoCompleto(noDocumento: string): Promise<ISolicitudCompraCompleta | null> {
    const solicitud = await this.findByNoDocumento(noDocumento);
    if (!solicitud) return null;
    const detalles = await this.findDetallesByNoDocumento(noDocumento);
    return {
      ...solicitud,
      detalles,
    };
  }

  /**
   * Actualiza notas y cantidades de una solicitud de compra y sus detalles.
   */
  static async update(noDocumento: string, data: IUpdateSolicitudCompraDTO): Promise<ISolicitudCompraCompleta> {
    await withTransaction(async (conn) => {
      if (data.notas !== undefined) {
        await conn.execute(
          `UPDATE CMP_SOLICITUD_COMPRA SET SOL_NOTAS = :notas WHERE SOL_NO_DOCUMENTO = :noDocumento`,
          { notas: data.notas, noDocumento }
        );
      }

      if (data.detalles && data.detalles.length > 0) {
        for (const det of data.detalles) {
          const binds: Record<string, any> = {
            cantAprobada: det.cantidadAprobada,
            idDetalle: det.idDetalle,
            noDocumento,
          };
          let updateDetSql = `UPDATE CMP_DETALLE_SOLICITUD SET DSO_CANTIDAD_APROBADA = :cantAprobada`;
          if (det.cantidadPedida !== undefined && det.cantidadPedida !== null) {
            updateDetSql += `, DSO_CANTIDAD_PEDIDA = :cantPedida`;
            binds.cantPedida = det.cantidadPedida;
          }
          updateDetSql += ` WHERE DSO_ID_DETALLE_SOLICITUD = :idDetalle AND DSO_NO_DOCUMENTO_SOLICITUD = :noDocumento`;

          await conn.execute(updateDetSql, binds);
        }
      }
    });

    const updated = await this.findByNoDocumentoCompleto(noDocumento);
    if (!updated) {
      throw new Error(`No se pudo recuperar la solicitud actualizada ${noDocumento}`);
    }
    return updated;
  }

  /**
   * Aprueba formalmente la solicitud, estableciendo el estado APROBADA (ID 2),
   * actualizando las cantidades aprobadas y registrando el dictamen en notas.
   */
  static async aprobar(noDocumento: string, dto: IAprobarSolicitudDTO): Promise<ISolicitudCompraCompleta> {
    await withTransaction(async (conn) => {
      // 1. Obtener ID del estado APROBADA (generalmente 2)
      const estRes = await conn.execute<any>(
        `SELECT EST_ID_ESTADO FROM CMP_ESTADO WHERE UPPER(EST_NOMBRE_ESTADO) = 'APROBADA' AND ROWNUM = 1`
      );
      const estId = estRes.rows?.[0]?.EST_ID_ESTADO ? Number(estRes.rows[0].EST_ID_ESTADO) : 2;

      // 2. Actualizar cantidades aprobadas si se enviaron
      if (dto.detalles && dto.detalles.length > 0) {
        for (const det of dto.detalles) {
          await conn.execute(
            `UPDATE CMP_DETALLE_SOLICITUD 
             SET DSO_CANTIDAD_APROBADA = :cantAprobada 
             WHERE DSO_ID_DETALLE_SOLICITUD = :idDetalle 
               AND DSO_NO_DOCUMENTO_SOLICITUD = :noDocumento`,
            {
              cantAprobada: det.cantidadAprobada,
              idDetalle: det.idDetalle,
              noDocumento,
            }
          );
        }
      } else {
        // Por defecto, igualar cantidad aprobada a cantidad pedida para los ítems
        await conn.execute(
          `UPDATE CMP_DETALLE_SOLICITUD 
           SET DSO_CANTIDAD_APROBADA = DSO_CANTIDAD_PEDIDA 
           WHERE DSO_NO_DOCUMENTO_SOLICITUD = :noDocumento 
             AND (DSO_CANTIDAD_APROBADA IS NULL OR DSO_CANTIDAD_APROBADA = 0)`,
          { noDocumento }
        );
      }

      // 3. Actualizar estado y dictamen en notas
      const notaAprobacion = dto.notasAprobacion
        ? `[APROBADA]: ${dto.notasAprobacion}`
        : `[APROBADA]: Autorizada para cotización`;

      await conn.execute(
        `UPDATE CMP_SOLICITUD_COMPRA 
         SET SOL_ID_ESTADO = :estId,
             SOL_NOTAS = CASE WHEN SOL_NOTAS IS NULL THEN :nota ELSE SUBSTR(SOL_NOTAS || ' | ' || :nota, 1, 500) END
         WHERE SOL_NO_DOCUMENTO = :noDocumento`,
        {
          estId,
          nota: notaAprobacion,
          noDocumento,
        }
      );
    });

    const updated = await this.findByNoDocumentoCompleto(noDocumento);
    if (!updated) throw new Error(`Error al recuperar la solicitud aprobada ${noDocumento}`);
    return updated;
  }

  /**
   * Rechaza o niega la solicitud, estableciendo el estado RECHAZADA (ID 6 o CERRADA 5),
   * fijando cantidades aprobadas en 0 y cerrando el ciclo de compras.
   */
  static async rechazar(noDocumento: string, dto: IRechazarSolicitudDTO): Promise<ISolicitudCompraCompleta> {
    await withTransaction(async (conn) => {
      // 1. Obtener ID del estado RECHAZADA (o CERRADA si no existiera)
      const estRes = await conn.execute<any>(
        `SELECT EST_ID_ESTADO FROM CMP_ESTADO WHERE UPPER(EST_NOMBRE_ESTADO) = 'RECHAZADA' AND ROWNUM = 1`
      );
      let estId = estRes.rows?.[0]?.EST_ID_ESTADO ? Number(estRes.rows[0].EST_ID_ESTADO) : null;
      if (!estId) {
        const cerrRes = await conn.execute<any>(
          `SELECT EST_ID_ESTADO FROM CMP_ESTADO WHERE UPPER(EST_NOMBRE_ESTADO) = 'CERRADA' AND ROWNUM = 1`
        );
        estId = cerrRes.rows?.[0]?.EST_ID_ESTADO ? Number(cerrRes.rows[0].EST_ID_ESTADO) : 5;
      }

      // 2. Establecer cantidades aprobadas en 0
      await conn.execute(
        `UPDATE CMP_DETALLE_SOLICITUD 
         SET DSO_CANTIDAD_APROBADA = 0 
         WHERE DSO_NO_DOCUMENTO_SOLICITUD = :noDocumento`,
        { noDocumento }
      );

      // 3. Actualizar estado y registrar motivo de rechazo
      const notaRechazo = `[RECHAZADA]: ${dto.motivoRechazo.trim()}`;

      await conn.execute(
        `UPDATE CMP_SOLICITUD_COMPRA 
         SET SOL_ID_ESTADO = :estId,
             SOL_NOTAS = CASE WHEN SOL_NOTAS IS NULL THEN :nota ELSE SUBSTR(SOL_NOTAS || ' | ' || :nota, 1, 500) END
         WHERE SOL_NO_DOCUMENTO = :noDocumento`,
        {
          estId,
          nota: notaRechazo,
          noDocumento,
        }
      );
    });

    const updated = await this.findByNoDocumentoCompleto(noDocumento);
    if (!updated) throw new Error(`Error al recuperar la solicitud rechazada ${noDocumento}`);
    return updated;
  }

  /**
   * Crea una nueva solicitud de compra con sus detalles usando una transacción
   */
  static async create(solicitudData: import('@erp/contracts').ISolicitudCompraCreateDTO, noDocumento: string): Promise<string> {
    return withTransaction(async (connection) => {
      // 1. Insertar cabecera (Estado 1 = PENDIENTE)
      const sqlCabecera = `
        INSERT INTO CMP_SOLICITUD_COMPRA (
          SOL_NO_DOCUMENTO,
          SOL_ID_USUARIO_RESPONSABLE,
          SOL_ID_DEPARTAMENTO,
          SOL_NOTAS,
          SOL_MONTO_TOTAL_ESTIMADO,
          SOL_ID_ESTADO,
          SOL_FECHA
        ) VALUES (
          :noDocumento,
          :idUsuario,
          :idDepartamento,
          :notas,
          0,
          1,
          SYSDATE
        )
      `;

      const bindsCabecera = {
        noDocumento,
        idUsuario: solicitudData.idUsuarioResponsable,
        idDepartamento: solicitudData.idDepartamento,
        notas: solicitudData.notas || null
      };

      await connection.execute(sqlCabecera, bindsCabecera);

      // 2. Insertar detalles
      const sqlDetalle = `
        INSERT INTO CMP_DETALLE_SOLICITUD (
          DSO_NO_DOCUMENTO_SOLICITUD,
          DSO_CODIGO_ARTICULO,
          DSO_CANTIDAD_PEDIDA,
          DSO_CANTIDAD_APROBADA
        ) VALUES (
          :noDocumento,
          :codigoArticulo,
          :cantidadPedida,
          0
        )
      `;

      for (const detalle of solicitudData.detalles) {
        let codArticulo = detalle.codigoArticulo;
        if (detalle.isNuevo && detalle.nombreArticuloNuevo) {
          codArticulo = 'NEW-ITEM';
        }

        const bindsDetalle = {
          noDocumento,
          codigoArticulo: codArticulo || 'UNKNOWN',
          cantidadPedida: detalle.cantidadPedida
        };

        await connection.execute(sqlDetalle, bindsDetalle);
      }

      return noDocumento;
    });
  }
}
