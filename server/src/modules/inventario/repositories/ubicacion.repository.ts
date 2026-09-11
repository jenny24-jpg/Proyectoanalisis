import { execute, withTransaction } from '../../../config/database.js';
import {
  IUbicacion,
  ICreateUbicacionDTO,
  IUpdateUbicacionDTO,
  IUbicacionFilterParams,
} from '@erp/contracts';

interface IUbicacionDbRow {
  UBI_ID_UBICACION: number | string;
  UBI_ID_BODEGA: number | string;
  UBI_CODIGO_UBICACION: string;
  UBI_PASILLO: string | null;
  UBI_RACK: string | null;
  UBI_NIVEL: string | null;
  UBI_ACTIVO: number | string;
  BOD_NOMBRE?: string | null;
}

function mapRowToUbicacion(row: IUbicacionDbRow): IUbicacion {
  return {
    ubiIdUbicacion: Number(row.UBI_ID_UBICACION),
    ubiIdBodega: Number(row.UBI_ID_BODEGA),
    ubiCodigoUbicacion: String(row.UBI_CODIGO_UBICACION),
    ubiPasillo: row.UBI_PASILLO ? String(row.UBI_PASILLO) : null,
    ubiRack: row.UBI_RACK ? String(row.UBI_RACK) : null,
    ubiNivel: row.UBI_NIVEL ? String(row.UBI_NIVEL) : null,
    ubiActivo: Number(row.UBI_ACTIVO),
    bodNombre: row.BOD_NOMBRE ? String(row.BOD_NOMBRE) : undefined,
  };
}

export class UbicacionRepository {
  static async findAll(filters: IUbicacionFilterParams = {}): Promise<IUbicacion[]> {
    let sql = `
      SELECT 
        u.UBI_ID_UBICACION,
        u.UBI_ID_BODEGA,
        u.UBI_CODIGO_UBICACION,
        u.UBI_PASILLO,
        u.UBI_RACK,
        u.UBI_NIVEL,
        u.UBI_ACTIVO,
        b.BOD_NOMBRE
      FROM CMP_UBICACION u
      LEFT JOIN CMP_BODEGA b ON u.UBI_ID_BODEGA = b.BOD_ID_BODEGA
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.codigo) {
      sql += ` AND UPPER(u.UBI_CODIGO_UBICACION) LIKE UPPER(:codigo)`;
      binds.codigo = `%${filters.codigo}%`;
    }

    if (filters.idBodega) {
      sql += ` AND u.UBI_ID_BODEGA = :idBodega`;
      binds.idBodega = filters.idBodega;
    }

    if (filters.activo !== undefined) {
      sql += ` AND u.UBI_ACTIVO = :activo`;
      binds.activo = filters.activo;
    }

    sql += ` ORDER BY u.UBI_CODIGO_UBICACION ASC`;

    const result = await execute<IUbicacionDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToUbicacion);
  }

  static async findById(id: number): Promise<IUbicacion | null> {
    const sql = `
      SELECT 
        u.UBI_ID_UBICACION,
        u.UBI_ID_BODEGA,
        u.UBI_CODIGO_UBICACION,
        u.UBI_PASILLO,
        u.UBI_RACK,
        u.UBI_NIVEL,
        u.UBI_ACTIVO,
        b.BOD_NOMBRE
      FROM CMP_UBICACION u
      LEFT JOIN CMP_BODEGA b ON u.UBI_ID_BODEGA = b.BOD_ID_BODEGA
      WHERE u.UBI_ID_UBICACION = :id
    `;
    const result = await execute<IUbicacionDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) return null;
    return mapRowToUbicacion(result.rows[0]);
  }

  static async findByCodigo(idBodega: number, codigo: string): Promise<IUbicacion | null> {
    const sql = `
      SELECT 
        UBI_ID_UBICACION,
        UBI_ID_BODEGA,
        UBI_CODIGO_UBICACION,
        UBI_PASILLO,
        UBI_RACK,
        UBI_NIVEL,
        UBI_ACTIVO
      FROM CMP_UBICACION
      WHERE UBI_ID_BODEGA = :idBodega AND UPPER(TRIM(UBI_CODIGO_UBICACION)) = UPPER(TRIM(:codigo))
    `;
    const result = await execute<IUbicacionDbRow>(sql, { idBodega, codigo });
    if (!result.rows || result.rows.length === 0) return null;
    return mapRowToUbicacion(result.rows[0]);
  }

  static async create(data: ICreateUbicacionDTO): Promise<IUbicacion> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(UBI_ID_UBICACION), 0) + 1 AS NEXT_ID FROM CMP_UBICACION`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_UBICACION (
          UBI_ID_UBICACION,
          UBI_ID_BODEGA,
          UBI_CODIGO_UBICACION,
          UBI_PASILLO,
          UBI_RACK,
          UBI_NIVEL,
          UBI_ACTIVO
        ) VALUES (
          :newId,
          :bodega,
          :codigo,
          :pasillo,
          :rack,
          :nivel,
          :activo
        )
      `;

      await conn.execute(sql, {
        newId,
        bodega: data.ubiIdBodega,
        codigo: data.ubiCodigoUbicacion.trim().toUpperCase(),
        pasillo: data.ubiPasillo ? data.ubiPasillo.trim() : null,
        rack: data.ubiRack ? data.ubiRack.trim() : null,
        nivel: data.ubiNivel ? data.ubiNivel.trim() : null,
        activo: data.ubiActivo !== undefined ? data.ubiActivo : 1,
      });

      return {
        ubiIdUbicacion: newId,
        ubiIdBodega: data.ubiIdBodega,
        ubiCodigoUbicacion: data.ubiCodigoUbicacion.trim().toUpperCase(),
        ubiPasillo: data.ubiPasillo ? data.ubiPasillo.trim() : null,
        ubiRack: data.ubiRack ? data.ubiRack.trim() : null,
        ubiNivel: data.ubiNivel ? data.ubiNivel.trim() : null,
        ubiActivo: data.ubiActivo !== undefined ? data.ubiActivo : 1,
      };
    });
  }

  static async update(id: number, data: IUpdateUbicacionDTO): Promise<IUbicacion | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.ubiIdBodega !== undefined) {
      setClauses.push('UBI_ID_BODEGA = :bodega');
      binds.bodega = data.ubiIdBodega;
    }
    if (data.ubiCodigoUbicacion !== undefined) {
      setClauses.push('UBI_CODIGO_UBICACION = :codigo');
      binds.codigo = data.ubiCodigoUbicacion.trim().toUpperCase();
    }
    if (data.ubiPasillo !== undefined) {
      setClauses.push('UBI_PASILLO = :pasillo');
      binds.pasillo = data.ubiPasillo ? data.ubiPasillo.trim() : null;
    }
    if (data.ubiRack !== undefined) {
      setClauses.push('UBI_RACK = :rack');
      binds.rack = data.ubiRack ? data.ubiRack.trim() : null;
    }
    if (data.ubiNivel !== undefined) {
      setClauses.push('UBI_NIVEL = :nivel');
      binds.nivel = data.ubiNivel ? data.ubiNivel.trim() : null;
    }
    if (data.ubiActivo !== undefined) {
      setClauses.push('UBI_ACTIVO = :activo');
      binds.activo = data.ubiActivo;
    }

    if (setClauses.length === 0) return existing;

    const sql = `
      UPDATE CMP_UBICACION
      SET ${setClauses.join(', ')}
      WHERE UBI_ID_UBICACION = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      const countRes = await conn.execute<any>(
        `SELECT 
          (SELECT COUNT(*) FROM CMP_INVENTARIO WHERE INV_ID_UBICACION_DEFECTO = :id) +
          (SELECT COUNT(*) FROM CMP_DETALLE_MOVIMIENTO_INV WHERE DMI_ID_UBICACION = :id) +
          (SELECT COUNT(*) FROM CMP_DETALLE_TOMA_FISICA WHERE DTF_ID_UBICACION = :id) AS TOTAL
        FROM DUAL`,
        { id }
      );
      const totalAsociados = Number(countRes.rows?.[0]?.TOTAL || countRes.rows?.[0]?.[0] || 0);

      if (totalAsociados > 0) {
        await conn.execute(
          `UPDATE CMP_UBICACION SET UBI_ACTIVO = 0 WHERE UBI_ID_UBICACION = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM CMP_UBICACION WHERE UBI_ID_UBICACION = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
