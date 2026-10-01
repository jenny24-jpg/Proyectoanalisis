import { execute, withTransaction } from '../../../config/database.js';
import {
  IEstado,
  ICreateEstadoDTO,
  IUpdateEstadoDTO,
  IEstadoFilterParams,
} from '@erp/contracts';

interface IEstadoDbRow {
  EST_ID_ESTADO: number | string;
  EST_NOMBRE_ESTADO: string;
}

function mapRowToEstado(row: IEstadoDbRow): IEstado {
  return {
    estIdEstado: Number(row.EST_ID_ESTADO),
    estNombreEstado: String(row.EST_NOMBRE_ESTADO),
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla CMP_ESTADO en Oracle DB
 * Esquema físico: EST_ID_ESTADO (NUMBER), EST_NOMBRE_ESTADO (VARCHAR2)
 */
export class EstadoRepository {
  /**
   * Consulta todos los estados con filtro opcional por nombre.
   */
  static async findAll(filters: IEstadoFilterParams = {}): Promise<IEstado[]> {
    let sql = `
      SELECT 
        EST_ID_ESTADO,
        EST_NOMBRE_ESTADO
      FROM CMP_ESTADO
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.nombre) {
      sql += ` AND UPPER(EST_NOMBRE_ESTADO) LIKE UPPER(:nombre)`;
      binds.nombre = `%${filters.nombre}%`;
    }

    sql += ` ORDER BY EST_ID_ESTADO ASC`;

    const result = await execute<IEstadoDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToEstado);
  }

  /**
   * Busca un estado por su ID primario.
   */
  static async findById(id: number): Promise<IEstado | null> {
    const sql = `
      SELECT 
        EST_ID_ESTADO,
        EST_NOMBRE_ESTADO
      FROM CMP_ESTADO
      WHERE EST_ID_ESTADO = :id
    `;

    const result = await execute<IEstadoDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToEstado(result.rows[0]);
  }

  /**
   * Busca un estado por coincidencia exacta de nombre (case-insensitive).
   */
  static async findByNombre(nombre: string): Promise<IEstado | null> {
    const sql = `
      SELECT 
        EST_ID_ESTADO,
        EST_NOMBRE_ESTADO
      FROM CMP_ESTADO
      WHERE UPPER(TRIM(EST_NOMBRE_ESTADO)) = UPPER(TRIM(:nombre))
    `;

    const result = await execute<IEstadoDbRow>(sql, { nombre });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToEstado(result.rows[0]);
  }

  /**
   * Inserta un nuevo estado calculando el próximo ID único.
   */
  static async create(data: ICreateEstadoDTO): Promise<IEstado> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(EST_ID_ESTADO), 0) + 1 AS NEXT_ID FROM CMP_ESTADO`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_ESTADO (
          EST_ID_ESTADO,
          EST_NOMBRE_ESTADO
        ) VALUES (
          :newId,
          :nombre
        )
      `;

      await conn.execute(sql, {
        newId,
        nombre: data.estNombreEstado.trim(),
      });

      return {
        estIdEstado: newId,
        estNombreEstado: data.estNombreEstado.trim(),
      };
    });
  }

  /**
   * Actualiza el nombre de un estado existente.
   */
  static async update(id: number, data: IUpdateEstadoDTO): Promise<IEstado | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    if (!data.estNombreEstado || data.estNombreEstado.trim() === '') {
      return existing;
    }

    const sql = `
      UPDATE CMP_ESTADO
      SET EST_NOMBRE_ESTADO = :nombre
      WHERE EST_ID_ESTADO = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, {
        id,
        nombre: data.estNombreEstado!.trim(),
      });
    });

    return await this.findById(id);
  }

  /**
   * Elimina un estado si no tiene referencias en solicitudes, órdenes o facturas.
   */
  static async delete(id: number): Promise<{ deleted: boolean; inUse: boolean; message?: string }> {
    return await withTransaction(async (conn) => {
      const countRes = await conn.execute<any>(
        `SELECT 
          (SELECT COUNT(*) FROM CMP_SOLICITUD_COMPRA WHERE SOL_ID_ESTADO = :id) +
          (SELECT COUNT(*) FROM CMP_ORDEN_COMPRA WHERE OCO_ID_ESTADO = :id) +
          (SELECT COUNT(*) FROM CMP_FACTURA_CXP WHERE FAC_ID_ESTADO = :id) AS TOTAL 
        FROM DUAL`,
        { id }
      );
      const totalAsociados = Number(countRes.rows?.[0]?.TOTAL || countRes.rows?.[0]?.[0] || 0);

      if (totalAsociados > 0) {
        return {
          deleted: false,
          inUse: true,
          message: `No se puede eliminar el estado porque está asociado a ${totalAsociados} documento(s) (solicitud, orden de compra o factura).`,
        };
      }

      try {
        await conn.execute(
          `DELETE FROM CMP_ESTADO WHERE EST_ID_ESTADO = :id`,
          { id }
        );
        return { deleted: true, inUse: false };
      } catch (error: any) {
        if (error?.errorNum === 2292 || (error?.message && error.message.includes('ORA-02292'))) {
          return {
            deleted: false,
            inUse: true,
            message: `No se puede eliminar el estado porque está siendo utilizado en solicitudes, órdenes de compra o facturas asociadas (restricción de integridad referencial).`,
          };
        }
        throw error;
      }
    });
  }
}
