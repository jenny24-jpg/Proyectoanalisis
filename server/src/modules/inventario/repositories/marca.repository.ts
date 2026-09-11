import { execute, withTransaction } from '../../../config/database.js';
import {
  IMarca,
  ICreateMarcaDTO,
  IUpdateMarcaDTO,
  IMarcaFilterParams,
} from '@erp/contracts';

interface IMarcaDbRow {
  MAR_ID_MARCA: number | string;
  MAR_NOMBRE_MARCA: string;
  MAR_ACTIVO: number | string;
}

function mapRowToMarca(row: IMarcaDbRow): IMarca {
  return {
    marIdMarca: Number(row.MAR_ID_MARCA),
    marNombreMarca: String(row.MAR_NOMBRE_MARCA),
    marActivo: Number(row.MAR_ACTIVO),
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla CMP_MARCA en Oracle DB
 */
export class MarcaRepository {
  /**
   * Consulta todas las marcas con filtros opcionales de nombre y estado activo.
   */
  static async findAll(filters: IMarcaFilterParams = {}): Promise<IMarca[]> {
    let sql = `
      SELECT 
        MAR_ID_MARCA,
        MAR_NOMBRE_MARCA,
        MAR_ACTIVO
      FROM CMP_MARCA
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.nombre) {
      sql += ` AND UPPER(MAR_NOMBRE_MARCA) LIKE UPPER(:nombre)`;
      binds.nombre = `%${filters.nombre}%`;
    }

    if (filters.activo !== undefined) {
      sql += ` AND MAR_ACTIVO = :activo`;
      binds.activo = filters.activo;
    }

    sql += ` ORDER BY MAR_NOMBRE_MARCA ASC`;

    const result = await execute<IMarcaDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToMarca);
  }

  /**
   * Busca una marca por su ID primario.
   */
  static async findById(id: number): Promise<IMarca | null> {
    const sql = `
      SELECT 
        MAR_ID_MARCA,
        MAR_NOMBRE_MARCA,
        MAR_ACTIVO
      FROM CMP_MARCA
      WHERE MAR_ID_MARCA = :id
    `;

    const result = await execute<IMarcaDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToMarca(result.rows[0]);
  }

  /**
   * Inserta una nueva marca con cálculo dinámico del próximo ID único para evitar ORA-00001.
   */
  static async create(data: ICreateMarcaDTO): Promise<IMarca> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(MAR_ID_MARCA), 0) + 1 AS NEXT_ID FROM CMP_MARCA`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_MARCA (
          MAR_ID_MARCA,
          MAR_NOMBRE_MARCA,
          MAR_ACTIVO
        ) VALUES (
          :newId,
          :nombre,
          :activo
        )
      `;

      await conn.execute(sql, {
        newId,
        nombre: data.marNombreMarca.trim(),
        activo: data.marActivo !== undefined ? data.marActivo : 1,
      });

      return {
        marIdMarca: newId,
        marNombreMarca: data.marNombreMarca.trim(),
        marActivo: data.marActivo !== undefined ? data.marActivo : 1,
      };
    });
  }

  /**
   * Actualiza los datos de una marca existente.
   */
  static async update(id: number, data: IUpdateMarcaDTO): Promise<IMarca | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.marNombreMarca !== undefined) {
      setClauses.push('MAR_NOMBRE_MARCA = :nombre');
      binds.nombre = data.marNombreMarca.trim();
    }

    if (data.marActivo !== undefined) {
      setClauses.push('MAR_ACTIVO = :activo');
      binds.activo = data.marActivo;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE CMP_MARCA
      SET ${setClauses.join(', ')}
      WHERE MAR_ID_MARCA = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina una marca. Si tiene artículos asociados (clave foránea), realiza una baja lógica (MAR_ACTIVO = 0).
   */
  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      const artCountRes = await conn.execute<any>(
        `SELECT COUNT(*) AS TOTAL FROM CMP_ARTICULO WHERE ART_ID_MARCA = :id`,
        { id }
      );
      const totalArticulos = Number(artCountRes.rows?.[0]?.TOTAL || artCountRes.rows?.[0]?.[0] || 0);

      if (totalArticulos > 0) {
        await conn.execute(
          `UPDATE CMP_MARCA SET MAR_ACTIVO = 0 WHERE MAR_ID_MARCA = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM CMP_MARCA WHERE MAR_ID_MARCA = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
