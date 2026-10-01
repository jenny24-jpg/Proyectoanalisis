import { execute, withTransaction } from '../../../config/database.js';
import {
  IConductor,
  ICreateConductorDTO,
  IUpdateConductorDTO,
  IConductorFilterParams,
  IEmpleadoOption,
} from '@erp/contracts';

interface IConductorDbRow {
  CON_ID_CONDUCTOR: number | string;
  CON_ID_EMPLEADO: number | string;
  EMPLEADO_NOMBRE?: string | null;
  CON_DPI: string;
  CON_TIPO_LICENCIA: string;
  CON_NO_LICENCIA: string;
  CON_FECHA_VENCIMIENTO_LIC: Date | string;
  CON_ESTADO: string;
}

function mapRowToConductor(row: IConductorDbRow): IConductor {
  let fechaVenc = '';
  if (row.CON_FECHA_VENCIMIENTO_LIC instanceof Date) {
    fechaVenc = row.CON_FECHA_VENCIMIENTO_LIC.toISOString().slice(0, 10);
  } else if (typeof row.CON_FECHA_VENCIMIENTO_LIC === 'string') {
    fechaVenc = row.CON_FECHA_VENCIMIENTO_LIC.slice(0, 10);
  }

  return {
    conIdConductor: Number(row.CON_ID_CONDUCTOR),
    conIdEmpleado: Number(row.CON_ID_EMPLEADO),
    conNombreEmpleado: row.EMPLEADO_NOMBRE ? String(row.EMPLEADO_NOMBRE).trim() : `Empleado #${row.CON_ID_EMPLEADO}`,
    conDpi: String(row.CON_DPI),
    conTipoLicencia: (row.CON_TIPO_LICENCIA as any) || 'B',
    conNoLicencia: String(row.CON_NO_LICENCIA),
    conFechaVencimientoLic: fechaVenc,
    conEstado: (row.CON_ESTADO as any) || 'ACTIVO',
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla CMP_CONDUCTOR en Oracle DB
 */
export class ConductorRepository {
  /**
   * Consulta todos los conductores con sus datos de empleado vinculados.
   */
  static async findAll(filters: IConductorFilterParams = {}): Promise<IConductor[]> {
    let sql = `
      SELECT 
        c.CON_ID_CONDUCTOR,
        c.CON_ID_EMPLEADO,
        TRIM(emp.NOMBRE || ' ' || NVL(emp.APELLIDO, '')) AS EMPLEADO_NOMBRE,
        c.CON_DPI,
        c.CON_TIPO_LICENCIA,
        c.CON_NO_LICENCIA,
        c.CON_FECHA_VENCIMIENTO_LIC,
        c.CON_ESTADO
      FROM CMP_CONDUCTOR c
      LEFT JOIN EMPLEADO emp ON c.CON_ID_EMPLEADO = emp.ID_EMPLEADO
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.search) {
      sql += ` AND (
        UPPER(c.CON_DPI) LIKE UPPER(:search) 
        OR UPPER(c.CON_NO_LICENCIA) LIKE UPPER(:search) 
        OR UPPER(emp.NOMBRE) LIKE UPPER(:search) 
        OR UPPER(NVL(emp.APELLIDO, '')) LIKE UPPER(:search)
      )`;
      binds.search = `%${filters.search}%`;
    }

    if (filters.dpi) {
      sql += ` AND c.CON_DPI LIKE :dpi`;
      binds.dpi = `%${filters.dpi}%`;
    }

    if (filters.tipoLicencia && filters.tipoLicencia !== 'TODOS') {
      sql += ` AND UPPER(c.CON_TIPO_LICENCIA) = UPPER(:tipoLicencia)`;
      binds.tipoLicencia = filters.tipoLicencia;
    }

    if (filters.estado && filters.estado !== 'TODOS') {
      sql += ` AND UPPER(c.CON_ESTADO) = UPPER(:estado)`;
      binds.estado = filters.estado;
    }

    sql += ` ORDER BY c.CON_ID_CONDUCTOR DESC`;

    const result = await execute<IConductorDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToConductor);
  }

  /**
   * Obtiene la lista de empleados activos del sistema para asignación de chofer.
   */
  static async getEmpleados(): Promise<IEmpleadoOption[]> {
    try {
      const sql = `
        SELECT 
          ID_EMPLEADO,
          TRIM(NOMBRE || ' ' || NVL(APELLIDO, '')) AS NOMBRE_COMPLETO,
          DPI
        FROM EMPLEADO
        ORDER BY NOMBRE ASC
      `;
      const result = await execute<any>(sql);
      return (result.rows || []).map((r: any) => ({
        idEmpleado: Number(r.ID_EMPLEADO),
        nombreCompleto: String(r.NOMBRE_COMPLETO || `Empleado #${r.ID_EMPLEADO}`).trim(),
        dpi: r.DPI ? String(r.DPI) : null,
      }));
    } catch {
      // Si la tabla no tiene columna DPI o tabla alternativa
      try {
        const sqlFallback = `
          SELECT 
            ID_EMPLEADO,
            TRIM(NOMBRE || ' ' || NVL(APELLIDO, '')) AS NOMBRE_COMPLETO
          FROM EMPLEADO
          ORDER BY NOMBRE ASC
        `;
        const result = await execute<any>(sqlFallback);
        return (result.rows || []).map((r: any) => ({
          idEmpleado: Number(r.ID_EMPLEADO),
          nombreCompleto: String(r.NOMBRE_COMPLETO || `Empleado #${r.ID_EMPLEADO}`).trim(),
          dpi: null,
        }));
      } catch {
        return [];
      }
    }
  }

  /**
   * Busca un conductor por su ID primario.
   */
  static async findById(id: number): Promise<IConductor | null> {
    const sql = `
      SELECT 
        c.CON_ID_CONDUCTOR,
        c.CON_ID_EMPLEADO,
        TRIM(emp.NOMBRE || ' ' || NVL(emp.APELLIDO, '')) AS EMPLEADO_NOMBRE,
        c.CON_DPI,
        c.CON_TIPO_LICENCIA,
        c.CON_NO_LICENCIA,
        c.CON_FECHA_VENCIMIENTO_LIC,
        c.CON_ESTADO
      FROM CMP_CONDUCTOR c
      LEFT JOIN EMPLEADO emp ON c.CON_ID_EMPLEADO = emp.ID_EMPLEADO
      WHERE c.CON_ID_CONDUCTOR = :id
    `;

    const result = await execute<IConductorDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToConductor(result.rows[0]);
  }

  /**
   * Busca un conductor por su DPI.
   */
  static async findByDpi(dpi: string): Promise<IConductor | null> {
    const sql = `
      SELECT 
        c.CON_ID_CONDUCTOR,
        c.CON_ID_EMPLEADO,
        TRIM(emp.NOMBRE || ' ' || NVL(emp.APELLIDO, '')) AS EMPLEADO_NOMBRE,
        c.CON_DPI,
        c.CON_TIPO_LICENCIA,
        c.CON_NO_LICENCIA,
        c.CON_FECHA_VENCIMIENTO_LIC,
        c.CON_ESTADO
      FROM CMP_CONDUCTOR c
      LEFT JOIN EMPLEADO emp ON c.CON_ID_EMPLEADO = emp.ID_EMPLEADO
      WHERE c.CON_DPI = :dpi
    `;

    const result = await execute<IConductorDbRow>(sql, { dpi });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToConductor(result.rows[0]);
  }

  /**
   * Inserta un nuevo conductor en CMP_CONDUCTOR.
   */
  static async create(data: ICreateConductorDTO): Promise<IConductor> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(CON_ID_CONDUCTOR), 0) + 1 AS NEXT_ID FROM CMP_CONDUCTOR`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const estado = data.conEstado || 'ACTIVO';

      const sql = `
        INSERT INTO CMP_CONDUCTOR (
          CON_ID_CONDUCTOR,
          CON_ID_EMPLEADO,
          CON_DPI,
          CON_TIPO_LICENCIA,
          CON_NO_LICENCIA,
          CON_FECHA_VENCIMIENTO_LIC,
          CON_ESTADO
        ) VALUES (
          :newId,
          :idEmpleado,
          :dpi,
          :tipoLicencia,
          :noLicencia,
          TO_DATE(:fechaVenc, 'YYYY-MM-DD'),
          :estado
        )
      `;

      await conn.execute(sql, {
        newId,
        idEmpleado: data.conIdEmpleado,
        dpi: data.conDpi.trim(),
        tipoLicencia: data.conTipoLicencia,
        noLicencia: data.conNoLicencia.trim().toUpperCase(),
        fechaVenc: data.conFechaVencimientoLic.slice(0, 10),
        estado,
      });

      return {
        conIdConductor: newId,
        conIdEmpleado: data.conIdEmpleado,
        conDpi: data.conDpi.trim(),
        conTipoLicencia: data.conTipoLicencia,
        conNoLicencia: data.conNoLicencia.trim().toUpperCase(),
        conFechaVencimientoLic: data.conFechaVencimientoLic.slice(0, 10),
        conEstado: estado,
      };
    });
  }

  /**
   * Actualiza los datos de un conductor existente.
   */
  static async update(id: number, data: IUpdateConductorDTO): Promise<IConductor | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.conIdEmpleado !== undefined) {
      setClauses.push('CON_ID_EMPLEADO = :idEmpleado');
      binds.idEmpleado = data.conIdEmpleado;
    }

    if (data.conDpi !== undefined) {
      setClauses.push('CON_DPI = :dpi');
      binds.dpi = data.conDpi.trim();
    }

    if (data.conTipoLicencia !== undefined) {
      setClauses.push('CON_TIPO_LICENCIA = :tipoLicencia');
      binds.tipoLicencia = data.conTipoLicencia;
    }

    if (data.conNoLicencia !== undefined) {
      setClauses.push('CON_NO_LICENCIA = :noLicencia');
      binds.noLicencia = data.conNoLicencia.trim().toUpperCase();
    }

    if (data.conFechaVencimientoLic !== undefined) {
      setClauses.push("CON_FECHA_VENCIMIENTO_LIC = TO_DATE(:fechaVenc, 'YYYY-MM-DD')");
      binds.fechaVenc = data.conFechaVencimientoLic.slice(0, 10);
    }

    if (data.conEstado !== undefined) {
      setClauses.push('CON_ESTADO = :estado');
      binds.estado = data.conEstado;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE CMP_CONDUCTOR
      SET ${setClauses.join(', ')}
      WHERE CON_ID_CONDUCTOR = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina o desactiva un conductor.
   */
  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      let countRecepciones = 0;
      try {
        const checkRes = await conn.execute<any>(
          `SELECT COUNT(*) AS TOTAL FROM CMP_RECEPCION_BODEGA WHERE RBO_ID_CONDUCTOR = :id`,
          { id }
        );
        countRecepciones = Number(checkRes.rows?.[0]?.TOTAL || checkRes.rows?.[0]?.[0] || 0);
      } catch {
        countRecepciones = 0;
      }

      if (countRecepciones > 0) {
        await conn.execute(
          `UPDATE CMP_CONDUCTOR SET CON_ESTADO = 'INACTIVO' WHERE CON_ID_CONDUCTOR = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM CMP_CONDUCTOR WHERE CON_ID_CONDUCTOR = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
