import { execute, withTransaction } from '../../../config/database.js';
import {
  ILote,
  ICreateLoteDTO,
  IUpdateLoteDTO,
  ILoteFilterParams,
  EstadoLoteType,
} from '@erp/contracts';

interface ILoteDbRow {
  LOT_ID_LOTE: number | string;
  LOT_NUMERO_LOTE: string;
  LOT_CODIGO_ARTICULO: string;
  LOT_FECHA_PRODUCCION: string | Date | null;
  LOT_FECHA_VENCIMIENTO: string | Date | null;
  LOT_ESTADO: string;
  ART_DESCRIPCION?: string | null;
}

function mapRowToLote(row: ILoteDbRow): ILote {
  return {
    lotIdLote: Number(row.LOT_ID_LOTE),
    lotNumeroLote: String(row.LOT_NUMERO_LOTE),
    lotCodigoArticulo: String(row.LOT_CODIGO_ARTICULO),
    lotFechaProduccion: row.LOT_FECHA_PRODUCCION,
    lotFechaVencimiento: row.LOT_FECHA_VENCIMIENTO,
    lotEstado: (row.LOT_ESTADO || 'ACTIVO') as EstadoLoteType,
    artDescripcion: row.ART_DESCRIPCION ? String(row.ART_DESCRIPCION) : undefined,
  };
}

export class LoteRepository {
  static async findAll(filters: ILoteFilterParams = {}): Promise<ILote[]> {
    let sql = `
      SELECT 
        l.LOT_ID_LOTE,
        l.LOT_NUMERO_LOTE,
        l.LOT_CODIGO_ARTICULO,
        l.LOT_FECHA_PRODUCCION,
        l.LOT_FECHA_VENCIMIENTO,
        l.LOT_ESTADO,
        a.ART_DESCRIPCION
      FROM CMP_LOTE l
      LEFT JOIN CMP_ARTICULO a ON l.LOT_CODIGO_ARTICULO = a.ART_CODIGO_ARTICULO
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.numeroLote) {
      sql += ` AND UPPER(l.LOT_NUMERO_LOTE) LIKE UPPER(:numeroLote)`;
      binds.numeroLote = `%${filters.numeroLote}%`;
    }

    if (filters.codigoArticulo) {
      sql += ` AND UPPER(l.LOT_CODIGO_ARTICULO) LIKE UPPER(:codigoArticulo)`;
      binds.codigoArticulo = `%${filters.codigoArticulo}%`;
    }

    if (filters.estado) {
      sql += ` AND l.LOT_ESTADO = :estado`;
      binds.estado = filters.estado;
    }

    sql += ` ORDER BY l.LOT_NUMERO_LOTE ASC`;

    const result = await execute<ILoteDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToLote);
  }

  static async findById(id: number): Promise<ILote | null> {
    const sql = `
      SELECT 
        l.LOT_ID_LOTE,
        l.LOT_NUMERO_LOTE,
        l.LOT_CODIGO_ARTICULO,
        l.LOT_FECHA_PRODUCCION,
        l.LOT_FECHA_VENCIMIENTO,
        l.LOT_ESTADO,
        a.ART_DESCRIPCION
      FROM CMP_LOTE l
      LEFT JOIN CMP_ARTICULO a ON l.LOT_CODIGO_ARTICULO = a.ART_CODIGO_ARTICULO
      WHERE l.LOT_ID_LOTE = :id
    `;
    const result = await execute<ILoteDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) return null;
    return mapRowToLote(result.rows[0]);
  }

  static async findByNumero(codigoArticulo: string, numeroLote: string): Promise<ILote | null> {
    const sql = `
      SELECT 
        LOT_ID_LOTE,
        LOT_NUMERO_LOTE,
        LOT_CODIGO_ARTICULO,
        LOT_FECHA_PRODUCCION,
        LOT_FECHA_VENCIMIENTO,
        LOT_ESTADO
      FROM CMP_LOTE
      WHERE LOT_CODIGO_ARTICULO = :codigoArticulo AND UPPER(TRIM(LOT_NUMERO_LOTE)) = UPPER(TRIM(:numeroLote))
    `;
    const result = await execute<ILoteDbRow>(sql, { codigoArticulo, numeroLote });
    if (!result.rows || result.rows.length === 0) return null;
    return mapRowToLote(result.rows[0]);
  }

  static async create(data: ICreateLoteDTO): Promise<ILote> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(LOT_ID_LOTE), 0) + 1 AS NEXT_ID FROM CMP_LOTE`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_LOTE (
          LOT_ID_LOTE,
          LOT_NUMERO_LOTE,
          LOT_CODIGO_ARTICULO,
          LOT_FECHA_PRODUCCION,
          LOT_FECHA_VENCIMIENTO,
          LOT_ESTADO
        ) VALUES (
          :newId,
          :numero,
          :articulo,
          ${data.lotFechaProduccion ? 'TO_DATE(:fechaProd, \'YYYY-MM-DD\')' : 'NULL'},
          ${data.lotFechaVencimiento ? 'TO_DATE(:fechaVenc, \'YYYY-MM-DD\')' : 'NULL'},
          :estado
        )
      `;

      const binds: Record<string, any> = {
        newId,
        numero: data.lotNumeroLote.trim().toUpperCase(),
        articulo: data.lotCodigoArticulo.trim().toUpperCase(),
        estado: data.lotEstado || 'ACTIVO',
      };

      if (data.lotFechaProduccion) {
        binds.fechaProd = String(data.lotFechaProduccion).slice(0, 10);
      }
      if (data.lotFechaVencimiento) {
        binds.fechaVenc = String(data.lotFechaVencimiento).slice(0, 10);
      }

      await conn.execute(sql, binds);

      return {
        lotIdLote: newId,
        lotNumeroLote: data.lotNumeroLote.trim().toUpperCase(),
        lotCodigoArticulo: data.lotCodigoArticulo.trim().toUpperCase(),
        lotFechaProduccion: data.lotFechaProduccion || null,
        lotFechaVencimiento: data.lotFechaVencimiento || null,
        lotEstado: data.lotEstado || 'ACTIVO',
      };
    });
  }

  static async update(id: number, data: IUpdateLoteDTO): Promise<ILote | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.lotNumeroLote !== undefined) {
      setClauses.push('LOT_NUMERO_LOTE = :numero');
      binds.numero = data.lotNumeroLote.trim().toUpperCase();
    }
    if (data.lotCodigoArticulo !== undefined) {
      setClauses.push('LOT_CODIGO_ARTICULO = :articulo');
      binds.articulo = data.lotCodigoArticulo.trim().toUpperCase();
    }
    if (data.lotFechaProduccion !== undefined) {
      if (data.lotFechaProduccion) {
        setClauses.push('LOT_FECHA_PRODUCCION = TO_DATE(:fechaProd, \'YYYY-MM-DD\')');
        binds.fechaProd = String(data.lotFechaProduccion).slice(0, 10);
      } else {
        setClauses.push('LOT_FECHA_PRODUCCION = NULL');
      }
    }
    if (data.lotFechaVencimiento !== undefined) {
      if (data.lotFechaVencimiento) {
        setClauses.push('LOT_FECHA_VENCIMIENTO = TO_DATE(:fechaVenc, \'YYYY-MM-DD\')');
        binds.fechaVenc = String(data.lotFechaVencimiento).slice(0, 10);
      } else {
        setClauses.push('LOT_FECHA_VENCIMIENTO = NULL');
      }
    }
    if (data.lotEstado !== undefined) {
      setClauses.push('LOT_ESTADO = :estado');
      binds.estado = data.lotEstado;
    }

    if (setClauses.length === 0) return existing;

    const sql = `
      UPDATE CMP_LOTE
      SET ${setClauses.join(', ')}
      WHERE LOT_ID_LOTE = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  static async delete(id: number): Promise<{ deleted: boolean; blocked: boolean }> {
    return await withTransaction(async (conn) => {
      const countRes = await conn.execute<any>(
        `SELECT 
          (SELECT COUNT(*) FROM CMP_DETALLE_MOVIMIENTO_INV WHERE DMI_ID_LOTE = :id) +
          (SELECT COUNT(*) FROM CMP_DETALLE_TOMA_FISICA WHERE DTF_ID_LOTE = :id) AS TOTAL
        FROM DUAL`,
        { id }
      );
      const totalAsociados = Number(countRes.rows?.[0]?.TOTAL || countRes.rows?.[0]?.[0] || 0);

      if (totalAsociados > 0) {
        await conn.execute(
          `UPDATE CMP_LOTE SET LOT_ESTADO = 'BLOQUEADO' WHERE LOT_ID_LOTE = :id`,
          { id }
        );
        return { deleted: false, blocked: true };
      }

      await conn.execute(`DELETE FROM CMP_LOTE WHERE LOT_ID_LOTE = :id`, { id });
      return { deleted: true, blocked: false };
    });
  }
}
