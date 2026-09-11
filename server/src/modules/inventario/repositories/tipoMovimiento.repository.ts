import { execute, withTransaction } from '../../../config/database.js';
import {
  ITipoMovimiento,
  ICreateTipoMovimientoDTO,
  IUpdateTipoMovimientoDTO,
  ITipoMovimientoFilterParams,
  NaturalezaMovimientoType,
} from '@erp/contracts';

interface ITipoMovimientoDbRow {
  TMI_ID_TIPO_MOVIMIENTO: number | string;
  TMI_CODIGO: string;
  TMI_DESCRIPCION: string;
  TMI_NATURALEZA: string;
  TMI_AFECTA_COSTO: number | string;
  TMI_ACTIVO: number | string;
}

function mapRowToTipoMovimiento(row: ITipoMovimientoDbRow): ITipoMovimiento {
  return {
    tmiIdTipoMovimiento: Number(row.TMI_ID_TIPO_MOVIMIENTO),
    tmiCodigo: String(row.TMI_CODIGO),
    tmiDescripcion: String(row.TMI_DESCRIPCION),
    tmiNaturaleza: (row.TMI_NATURALEZA === '-' ? '-' : '+') as NaturalezaMovimientoType,
    tmiAfectaCosto: Number(row.TMI_AFECTA_COSTO),
    tmiActivo: Number(row.TMI_ACTIVO),
  };
}

export class TipoMovimientoRepository {
  static async findAll(filters: ITipoMovimientoFilterParams = {}): Promise<ITipoMovimiento[]> {
    let sql = `
      SELECT 
        TMI_ID_TIPO_MOVIMIENTO,
        TMI_CODIGO,
        TMI_DESCRIPCION,
        TMI_NATURALEZA,
        TMI_AFECTA_COSTO,
        TMI_ACTIVO
      FROM CMP_TIPO_MOVIMIENTO_INV
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.codigo) {
      sql += ` AND UPPER(TMI_CODIGO) LIKE UPPER(:codigo)`;
      binds.codigo = `%${filters.codigo}%`;
    }

    if (filters.descripcion) {
      sql += ` AND UPPER(TMI_DESCRIPCION) LIKE UPPER(:descripcion)`;
      binds.descripcion = `%${filters.descripcion}%`;
    }

    if (filters.naturaleza) {
      sql += ` AND TMI_NATURALEZA = :naturaleza`;
      binds.naturaleza = filters.naturaleza;
    }

    if (filters.activo !== undefined) {
      sql += ` AND TMI_ACTIVO = :activo`;
      binds.activo = filters.activo;
    }

    sql += ` ORDER BY TMI_ID_TIPO_MOVIMIENTO ASC`;

    const result = await execute<ITipoMovimientoDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToTipoMovimiento);
  }

  static async findById(id: number): Promise<ITipoMovimiento | null> {
    const sql = `
      SELECT 
        TMI_ID_TIPO_MOVIMIENTO,
        TMI_CODIGO,
        TMI_DESCRIPCION,
        TMI_NATURALEZA,
        TMI_AFECTA_COSTO,
        TMI_ACTIVO
      FROM CMP_TIPO_MOVIMIENTO_INV
      WHERE TMI_ID_TIPO_MOVIMIENTO = :id
    `;
    const result = await execute<ITipoMovimientoDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) return null;
    return mapRowToTipoMovimiento(result.rows[0]);
  }

  static async findByCodigo(codigo: string): Promise<ITipoMovimiento | null> {
    const sql = `
      SELECT 
        TMI_ID_TIPO_MOVIMIENTO,
        TMI_CODIGO,
        TMI_DESCRIPCION,
        TMI_NATURALEZA,
        TMI_AFECTA_COSTO,
        TMI_ACTIVO
      FROM CMP_TIPO_MOVIMIENTO_INV
      WHERE UPPER(TRIM(TMI_CODIGO)) = UPPER(TRIM(:codigo))
    `;
    const result = await execute<ITipoMovimientoDbRow>(sql, { codigo });
    if (!result.rows || result.rows.length === 0) return null;
    return mapRowToTipoMovimiento(result.rows[0]);
  }

  static async create(data: ICreateTipoMovimientoDTO): Promise<ITipoMovimiento> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(TMI_ID_TIPO_MOVIMIENTO), 0) + 1 AS NEXT_ID FROM CMP_TIPO_MOVIMIENTO_INV`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_TIPO_MOVIMIENTO_INV (
          TMI_ID_TIPO_MOVIMIENTO,
          TMI_CODIGO,
          TMI_DESCRIPCION,
          TMI_NATURALEZA,
          TMI_AFECTA_COSTO,
          TMI_ACTIVO
        ) VALUES (
          :newId,
          :codigo,
          :descripcion,
          :naturaleza,
          :afectaCosto,
          :activo
        )
      `;

      await conn.execute(sql, {
        newId,
        codigo: data.tmiCodigo.trim().toUpperCase(),
        descripcion: data.tmiDescripcion.trim(),
        naturaleza: data.tmiNaturaleza,
        afectaCosto: data.tmiAfectaCosto !== undefined ? data.tmiAfectaCosto : 1,
        activo: data.tmiActivo !== undefined ? data.tmiActivo : 1,
      });

      return {
        tmiIdTipoMovimiento: newId,
        tmiCodigo: data.tmiCodigo.trim().toUpperCase(),
        tmiDescripcion: data.tmiDescripcion.trim(),
        tmiNaturaleza: data.tmiNaturaleza,
        tmiAfectaCosto: data.tmiAfectaCosto !== undefined ? data.tmiAfectaCosto : 1,
        tmiActivo: data.tmiActivo !== undefined ? data.tmiActivo : 1,
      };
    });
  }

  static async update(id: number, data: IUpdateTipoMovimientoDTO): Promise<ITipoMovimiento | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.tmiCodigo !== undefined) {
      setClauses.push('TMI_CODIGO = :codigo');
      binds.codigo = data.tmiCodigo.trim().toUpperCase();
    }
    if (data.tmiDescripcion !== undefined) {
      setClauses.push('TMI_DESCRIPCION = :descripcion');
      binds.descripcion = data.tmiDescripcion.trim();
    }
    if (data.tmiNaturaleza !== undefined) {
      setClauses.push('TMI_NATURALEZA = :naturaleza');
      binds.naturaleza = data.tmiNaturaleza;
    }
    if (data.tmiAfectaCosto !== undefined) {
      setClauses.push('TMI_AFECTA_COSTO = :afectaCosto');
      binds.afectaCosto = data.tmiAfectaCosto;
    }
    if (data.tmiActivo !== undefined) {
      setClauses.push('TMI_ACTIVO = :activo');
      binds.activo = data.tmiActivo;
    }

    if (setClauses.length === 0) return existing;

    const sql = `
      UPDATE CMP_TIPO_MOVIMIENTO_INV
      SET ${setClauses.join(', ')}
      WHERE TMI_ID_TIPO_MOVIMIENTO = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      const countRes = await conn.execute<any>(
        `SELECT COUNT(*) AS TOTAL FROM CMP_MOVIMIENTO_INVENTARIO WHERE MIN_ID_TIPO_MOVIMIENTO = :id`,
        { id }
      );
      const totalAsociados = Number(countRes.rows?.[0]?.TOTAL || countRes.rows?.[0]?.[0] || 0);

      if (totalAsociados > 0) {
        await conn.execute(
          `UPDATE CMP_TIPO_MOVIMIENTO_INV SET TMI_ACTIVO = 0 WHERE TMI_ID_TIPO_MOVIMIENTO = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(`DELETE FROM CMP_TIPO_MOVIMIENTO_INV WHERE TMI_ID_TIPO_MOVIMIENTO = :id`, { id });
      return { deleted: true, deactivated: false };
    });
  }
}
