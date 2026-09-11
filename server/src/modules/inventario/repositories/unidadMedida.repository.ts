import { execute, withTransaction } from '../../../config/database.js';
import {
  IUnidadMedida,
  ICreateUnidadMedidaDTO,
  IUpdateUnidadMedidaDTO,
  IUnidadMedidaFilterParams,
} from '@erp/contracts';

interface IUnidadMedidaDbRow {
  UME_ID_UNIDAD: number | string;
  UME_NOMBRE_UNIDAD: string;
  UME_ABREVIATURA: string;
  UME_ACTIVO: number | string;
}

function mapRowToUnidadMedida(row: IUnidadMedidaDbRow): IUnidadMedida {
  return {
    umeIdUnidad: Number(row.UME_ID_UNIDAD),
    umeNombreUnidad: String(row.UME_NOMBRE_UNIDAD),
    umeAbreviatura: String(row.UME_ABREVIATURA),
    umeActivo: Number(row.UME_ACTIVO),
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla CMP_UNIDAD_MEDIDA en Oracle DB
 */
export class UnidadMedidaRepository {
  /**
   * Consulta todas las unidades de medida con filtros opcionales de nombre, abreviatura y estado activo.
   */
  static async findAll(filters: IUnidadMedidaFilterParams = {}): Promise<IUnidadMedida[]> {
    let sql = `
      SELECT 
        UME_ID_UNIDAD,
        UME_NOMBRE_UNIDAD,
        UME_ABREVIATURA,
        UME_ACTIVO
      FROM CMP_UNIDAD_MEDIDA
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.nombre) {
      sql += ` AND UPPER(UME_NOMBRE_UNIDAD) LIKE UPPER(:nombre)`;
      binds.nombre = `%${filters.nombre}%`;
    }

    if (filters.abreviatura) {
      sql += ` AND UPPER(UME_ABREVIATURA) LIKE UPPER(:abreviatura)`;
      binds.abreviatura = `%${filters.abreviatura}%`;
    }

    if (filters.activo !== undefined) {
      sql += ` AND UME_ACTIVO = :activo`;
      binds.activo = filters.activo;
    }

    sql += ` ORDER BY UME_NOMBRE_UNIDAD ASC`;

    const result = await execute<IUnidadMedidaDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToUnidadMedida);
  }

  /**
   * Busca una unidad de medida por su ID primario.
   */
  static async findById(id: number): Promise<IUnidadMedida | null> {
    const sql = `
      SELECT 
        UME_ID_UNIDAD,
        UME_NOMBRE_UNIDAD,
        UME_ABREVIATURA,
        UME_ACTIVO
      FROM CMP_UNIDAD_MEDIDA
      WHERE UME_ID_UNIDAD = :id
    `;

    const result = await execute<IUnidadMedidaDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToUnidadMedida(result.rows[0]);
  }

  /**
   * Busca una unidad de medida por nombre exacto (case-insensitive).
   */
  static async findByNombre(nombre: string): Promise<IUnidadMedida | null> {
    const sql = `
      SELECT 
        UME_ID_UNIDAD,
        UME_NOMBRE_UNIDAD,
        UME_ABREVIATURA,
        UME_ACTIVO
      FROM CMP_UNIDAD_MEDIDA
      WHERE UPPER(TRIM(UME_NOMBRE_UNIDAD)) = UPPER(TRIM(:nombre))
    `;

    const result = await execute<IUnidadMedidaDbRow>(sql, { nombre });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToUnidadMedida(result.rows[0]);
  }

  /**
   * Inserta una nueva unidad de medida con cálculo dinámico del próximo ID único para evitar ORA-00001.
   */
  static async create(data: ICreateUnidadMedidaDTO): Promise<IUnidadMedida> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(UME_ID_UNIDAD), 0) + 1 AS NEXT_ID FROM CMP_UNIDAD_MEDIDA`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_UNIDAD_MEDIDA (
          UME_ID_UNIDAD,
          UME_NOMBRE_UNIDAD,
          UME_ABREVIATURA,
          UME_ACTIVO
        ) VALUES (
          :newId,
          :nombre,
          :abreviatura,
          :activo
        )
      `;

      await conn.execute(sql, {
        newId,
        nombre: data.umeNombreUnidad.trim(),
        abreviatura: data.umeAbreviatura.trim().toUpperCase(),
        activo: data.umeActivo !== undefined ? data.umeActivo : 1,
      });

      return {
        umeIdUnidad: newId,
        umeNombreUnidad: data.umeNombreUnidad.trim(),
        umeAbreviatura: data.umeAbreviatura.trim().toUpperCase(),
        umeActivo: data.umeActivo !== undefined ? data.umeActivo : 1,
      };
    });
  }

  /**
   * Actualiza los datos de una unidad de medida existente.
   */
  static async update(id: number, data: IUpdateUnidadMedidaDTO): Promise<IUnidadMedida | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.umeNombreUnidad !== undefined) {
      setClauses.push('UME_NOMBRE_UNIDAD = :nombre');
      binds.nombre = data.umeNombreUnidad.trim();
    }

    if (data.umeAbreviatura !== undefined) {
      setClauses.push('UME_ABREVIATURA = :abreviatura');
      binds.abreviatura = data.umeAbreviatura.trim().toUpperCase();
    }

    if (data.umeActivo !== undefined) {
      setClauses.push('UME_ACTIVO = :activo');
      binds.activo = data.umeActivo;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE CMP_UNIDAD_MEDIDA
      SET ${setClauses.join(', ')}
      WHERE UME_ID_UNIDAD = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina una unidad de medida. Si tiene artículos asociados como unidad de compra o venta,
   * realiza una baja lógica (UME_ACTIVO = 0).
   */
  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      const artCountRes = await conn.execute<any>(
        `SELECT COUNT(*) AS TOTAL FROM CMP_ARTICULO WHERE ART_ID_UNIDAD_COMPRA = :id OR ART_ID_UNIDAD_VENTA = :id`,
        { id }
      );
      const totalArticulos = Number(artCountRes.rows?.[0]?.TOTAL || artCountRes.rows?.[0]?.[0] || 0);

      if (totalArticulos > 0) {
        await conn.execute(
          `UPDATE CMP_UNIDAD_MEDIDA SET UME_ACTIVO = 0 WHERE UME_ID_UNIDAD = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM CMP_UNIDAD_MEDIDA WHERE UME_ID_UNIDAD = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
