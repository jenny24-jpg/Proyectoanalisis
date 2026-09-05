import { execute } from '../../../config/database.js';
import { ISolicitudCompra, ISolicitudCompraFilterParams } from '@erp/contracts';

function mapRowToSolicitud(row: any): ISolicitudCompra {
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

export class SolicitudCompraRepository {
  static async findAll(filters: ISolicitudCompraFilterParams = {}): Promise<ISolicitudCompra[]> {
    let sql = `
      SELECT 
        S.SOL_NO_DOCUMENTO,
        S.SOL_ID_USUARIO_RESPONSABLE,
        TRIM(NVL2(EMP.EMP_PRIMER_NOMBRE, EMP.EMP_PRIMER_NOMBRE || ' ' || NVL(EMP.EMP_PRIMER_APELLIDO, ''), NULL)) AS SOL_NOMBRE_RESPONSABLE,
        S.SOL_ID_DEPARTAMENTO,
        DEP.DEP_NOMBRE AS SOL_NOMBRE_DEPARTAMENTO,
        S.SOL_FECHA,
        S.SOL_NOTAS,
        S.SOL_MONTO_TOTAL_ESTIMADO,
        S.SOL_ID_ESTADO,
        E.EST_NOMBRE_ESTADO
      FROM CMP_SOLICITUD_COMPRA S
      LEFT JOIN CMP_ESTADO E ON S.SOL_ID_ESTADO = E.EST_ID_ESTADO
      LEFT JOIN ALP_DEPARTAMENTO DEP ON S.SOL_ID_DEPARTAMENTO = DEP.DEP_DEPARTAMENTO
      LEFT JOIN ALP_EMPLEADO EMP ON S.SOL_ID_USUARIO_RESPONSABLE = EMP.EMP_EMPLEADO
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

    const result = await execute<any>(sql, binds);
    return (result.rows || []).map(mapRowToSolicitud);
  }

  static async findByNoDocumento(noDocumento: string): Promise<ISolicitudCompra | null> {
    const sql = `
      SELECT 
        S.SOL_NO_DOCUMENTO,
        S.SOL_ID_USUARIO_RESPONSABLE,
        TRIM(NVL2(EMP.EMP_PRIMER_NOMBRE, EMP.EMP_PRIMER_NOMBRE || ' ' || NVL(EMP.EMP_PRIMER_APELLIDO, ''), NULL)) AS SOL_NOMBRE_RESPONSABLE,
        S.SOL_ID_DEPARTAMENTO,
        DEP.DEP_NOMBRE AS SOL_NOMBRE_DEPARTAMENTO,
        S.SOL_FECHA,
        S.SOL_NOTAS,
        S.SOL_MONTO_TOTAL_ESTIMADO,
        S.SOL_ID_ESTADO,
        E.EST_NOMBRE_ESTADO
      FROM CMP_SOLICITUD_COMPRA S
      LEFT JOIN CMP_ESTADO E ON S.SOL_ID_ESTADO = E.EST_ID_ESTADO
      LEFT JOIN ALP_DEPARTAMENTO DEP ON S.SOL_ID_DEPARTAMENTO = DEP.DEP_DEPARTAMENTO
      LEFT JOIN ALP_EMPLEADO EMP ON S.SOL_ID_USUARIO_RESPONSABLE = EMP.EMP_EMPLEADO
      WHERE S.SOL_NO_DOCUMENTO = :noDocumento
    `;

    const result = await execute<any>(sql, { noDocumento });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToSolicitud(result.rows[0]);
  }
}
