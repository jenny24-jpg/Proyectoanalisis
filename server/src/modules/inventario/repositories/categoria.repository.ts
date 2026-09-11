import { execute, withTransaction } from '../../../config/database.js';
import {
  ICategoria,
  ICreateCategoriaDTO,
  IUpdateCategoriaDTO,
  ICategoriaFilterParams,
} from '@erp/contracts';

interface ICategoriaDbRow {
  CAT_ID_CATEGORIA: number | string;
  CAT_NOMBRE_CATEGORIA: string;
  CAT_ACTIVO: number | string;
}

function mapRowToCategoria(row: ICategoriaDbRow): ICategoria {
  return {
    catIdCategoria: Number(row.CAT_ID_CATEGORIA),
    catNombreCategoria: String(row.CAT_NOMBRE_CATEGORIA),
    catActivo: Number(row.CAT_ACTIVO),
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla CMP_CATEGORIA en Oracle DB
 */
export class CategoriaRepository {
  /**
   * Consulta todas las categorías con filtros opcionales de nombre y estado activo.
   */
  static async findAll(filters: ICategoriaFilterParams = {}): Promise<ICategoria[]> {
    let sql = `
      SELECT 
        CAT_ID_CATEGORIA,
        CAT_NOMBRE_CATEGORIA,
        CAT_ACTIVO
      FROM CMP_CATEGORIA
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.nombre) {
      sql += ` AND UPPER(CAT_NOMBRE_CATEGORIA) LIKE UPPER(:nombre)`;
      binds.nombre = `%${filters.nombre}%`;
    }

    if (filters.activo !== undefined) {
      sql += ` AND CAT_ACTIVO = :activo`;
      binds.activo = filters.activo;
    }

    sql += ` ORDER BY CAT_NOMBRE_CATEGORIA ASC`;

    const result = await execute<ICategoriaDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToCategoria);
  }

  /**
   * Busca una categoría por su ID primario.
   */
  static async findById(id: number): Promise<ICategoria | null> {
    const sql = `
      SELECT 
        CAT_ID_CATEGORIA,
        CAT_NOMBRE_CATEGORIA,
        CAT_ACTIVO
      FROM CMP_CATEGORIA
      WHERE CAT_ID_CATEGORIA = :id
    `;

    const result = await execute<ICategoriaDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToCategoria(result.rows[0]);
  }

  /**
   * Inserta una nueva categoría con cálculo dinámico del próximo ID único para evitar ORA-00001.
   */
  static async create(data: ICreateCategoriaDTO): Promise<ICategoria> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(CAT_ID_CATEGORIA), 0) + 1 AS NEXT_ID FROM CMP_CATEGORIA`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_CATEGORIA (
          CAT_ID_CATEGORIA,
          CAT_NOMBRE_CATEGORIA,
          CAT_ACTIVO
        ) VALUES (
          :newId,
          :nombre,
          :activo
        )
      `;

      await conn.execute(sql, {
        newId,
        nombre: data.catNombreCategoria.trim(),
        activo: data.catActivo !== undefined ? data.catActivo : 1,
      });

      return {
        catIdCategoria: newId,
        catNombreCategoria: data.catNombreCategoria.trim(),
        catActivo: data.catActivo !== undefined ? data.catActivo : 1,
      };
    });
  }

  /**
   * Actualiza los datos de una categoría existente.
   */
  static async update(id: number, data: IUpdateCategoriaDTO): Promise<ICategoria | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.catNombreCategoria !== undefined) {
      setClauses.push('CAT_NOMBRE_CATEGORIA = :nombre');
      binds.nombre = data.catNombreCategoria.trim();
    }

    if (data.catActivo !== undefined) {
      setClauses.push('CAT_ACTIVO = :activo');
      binds.activo = data.catActivo;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE CMP_CATEGORIA
      SET ${setClauses.join(', ')}
      WHERE CAT_ID_CATEGORIA = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina una categoría. Si tiene artículos asociados (clave foránea), realiza una baja lógica (CAT_ACTIVO = 0).
   */
  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      // Verificar si existen artículos que dependan de esta categoría
      const artCountRes = await conn.execute<any>(
        `SELECT COUNT(*) AS TOTAL FROM CMP_ARTICULO WHERE ART_ID_CATEGORIA = :id`,
        { id }
      );
      const totalArticulos = Number(artCountRes.rows?.[0]?.TOTAL || artCountRes.rows?.[0]?.[0] || 0);

      if (totalArticulos > 0) {
        // Baja lógica para proteger integridad referencial de artículos existentes
        await conn.execute(
          `UPDATE CMP_CATEGORIA SET CAT_ACTIVO = 0 WHERE CAT_ID_CATEGORIA = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM CMP_CATEGORIA WHERE CAT_ID_CATEGORIA = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
