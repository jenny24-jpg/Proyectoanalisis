import { execute, withTransaction } from '../../../config/database.js';
import {
  IProveedor,
  ICreateProveedorDTO,
  IUpdateProveedorDTO,
  IProveedorFilterParams,
} from '@erp/contracts';

interface IProveedorDbRow {
  PRO_ID_PROVEEDOR: number | string;
  PRO_NIT: string | null;
  PRO_NOMBRE_ENTIDAD: string;
  PRO_ACTIVO: number | string;
}

function mapRowToProveedor(row: IProveedorDbRow): IProveedor {
  return {
    proIdProveedor: Number(row.PRO_ID_PROVEEDOR),
    proNit: row.PRO_NIT ? String(row.PRO_NIT) : null,
    proNombreEntidad: String(row.PRO_NOMBRE_ENTIDAD),
    proActivo: Number(row.PRO_ACTIVO),
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla PROVEEDOR en Oracle DB
 */
export class ProveedorRepository {
  /**
   * Consulta todos los proveedores con filtros opcionales de nombre, nit y estado activo.
   */
  static async findAll(filters: IProveedorFilterParams = {}): Promise<IProveedor[]> {
    let sql = `
      SELECT 
        PRO_ID_PROVEEDOR,
        PRO_NIT,
        PRO_NOMBRE_ENTIDAD,
        PRO_ACTIVO
      FROM PROVEEDOR
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.nombre) {
      sql += ` AND UPPER(PRO_NOMBRE_ENTIDAD) LIKE UPPER(:nombre)`;
      binds.nombre = `%${filters.nombre}%`;
    }

    if (filters.nit) {
      sql += ` AND UPPER(PRO_NIT) LIKE UPPER(:nit)`;
      binds.nit = `%${filters.nit}%`;
    }

    if (filters.activo !== undefined) {
      sql += ` AND PRO_ACTIVO = :activo`;
      binds.activo = filters.activo;
    }

    sql += ` ORDER BY PRO_NOMBRE_ENTIDAD ASC`;

    const result = await execute<IProveedorDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToProveedor);
  }

  /**
   * Busca un proveedor por su ID primario.
   */
  static async findById(id: number): Promise<IProveedor | null> {
    const sql = `
      SELECT 
        PRO_ID_PROVEEDOR,
        PRO_NIT,
        PRO_NOMBRE_ENTIDAD,
        PRO_ACTIVO
      FROM PROVEEDOR
      WHERE PRO_ID_PROVEEDOR = :id
    `;

    const result = await execute<IProveedorDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToProveedor(result.rows[0]);
  }

  /**
   * Inserta un nuevo proveedor con cálculo dinámico del próximo ID para evitar colisiones.
   */
  static async create(data: ICreateProveedorDTO): Promise<IProveedor> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(PRO_ID_PROVEEDOR), 0) + 1 AS NEXT_ID FROM PROVEEDOR`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO PROVEEDOR (
          PRO_ID_PROVEEDOR,
          PRO_NIT,
          PRO_NOMBRE_ENTIDAD,
          PRO_ACTIVO
        ) VALUES (
          :newId,
          :nit,
          :nombre,
          :activo
        )
      `;

      await conn.execute(sql, {
        newId,
        nit: data.proNit ? data.proNit.trim() : null,
        nombre: data.proNombreEntidad.trim(),
        activo: data.proActivo !== undefined ? data.proActivo : 1,
      });

      return {
        proIdProveedor: newId,
        proNit: data.proNit ? data.proNit.trim() : null,
        proNombreEntidad: data.proNombreEntidad.trim(),
        proActivo: data.proActivo !== undefined ? data.proActivo : 1,
      };
    });
  }

  /**
   * Actualiza los datos de un proveedor existente.
   */
  static async update(id: number, data: IUpdateProveedorDTO): Promise<IProveedor | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.proNombreEntidad !== undefined) {
      setClauses.push('PRO_NOMBRE_ENTIDAD = :nombre');
      binds.nombre = data.proNombreEntidad.trim();
    }

    if (data.proNit !== undefined) {
      setClauses.push('PRO_NIT = :nit');
      binds.nit = data.proNit ? data.proNit.trim() : null;
    }

    if (data.proActivo !== undefined) {
      setClauses.push('PRO_ACTIVO = :activo');
      binds.activo = data.proActivo;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE PROVEEDOR
      SET ${setClauses.join(', ')}
      WHERE PRO_ID_PROVEEDOR = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina un proveedor. Si tiene cotizaciones o facturas asociadas, realiza una baja lógica (PRO_ACTIVO = 0).
   */
  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      const countRes = await conn.execute<any>(
        `SELECT 
          (SELECT COUNT(*) FROM CMP_COTIZACION WHERE COT_ID_PROVEEDOR = :id) +
          (SELECT COUNT(*) FROM CMP_FACTURA_CXP WHERE FAC_ID_PROVEEDOR = :id) AS TOTAL 
        FROM DUAL`,
        { id }
      );
      const totalAsociados = Number(countRes.rows?.[0]?.TOTAL || countRes.rows?.[0]?.[0] || 0);

      if (totalAsociados > 0) {
        await conn.execute(
          `UPDATE PROVEEDOR SET PRO_ACTIVO = 0 WHERE PRO_ID_PROVEEDOR = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM PROVEEDOR WHERE PRO_ID_PROVEEDOR = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
