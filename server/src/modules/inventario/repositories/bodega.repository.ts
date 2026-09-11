import { execute, withTransaction } from '../../../config/database.js';
import {
  IBodega,
  ICreateBodegaDTO,
  IUpdateBodegaDTO,
  IBodegaFilterParams,
} from '@erp/contracts';

interface IBodegaDbRow {
  BOD_ID_BODEGA: number | string;
  BOD_CODIGO: string;
  BOD_NOMBRE: string;
  BOD_ID_SUCURSAL: number | string;
  BOD_ID_ENCARGADO: number | string | null;
  BOD_DIRECCION: string | null;
  BOD_PERMITE_VENTAS: number | string;
  BOD_ACTIVO: number | string;
}

function mapRowToBodega(row: IBodegaDbRow): IBodega {
  return {
    bodIdBodega: Number(row.BOD_ID_BODEGA),
    bodCodigo: String(row.BOD_CODIGO),
    bodNombre: String(row.BOD_NOMBRE),
    bodIdSucursal: Number(row.BOD_ID_SUCURSAL || 1),
    bodIdEncargado: row.BOD_ID_ENCARGADO !== null && row.BOD_ID_ENCARGADO !== undefined ? Number(row.BOD_ID_ENCARGADO) : null,
    bodDireccion: row.BOD_DIRECCION ? String(row.BOD_DIRECCION) : null,
    bodPermiteVentas: Number(row.BOD_PERMITE_VENTAS),
    bodActivo: Number(row.BOD_ACTIVO),
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla CMP_BODEGA en Oracle DB
 */
export class BodegaRepository {
  /**
   * Consulta todas las bodegas con filtros opcionales de nombre, código y estado activo.
   */
  static async findAll(filters: IBodegaFilterParams = {}): Promise<IBodega[]> {
    let sql = `
      SELECT 
        BOD_ID_BODEGA,
        BOD_CODIGO,
        BOD_NOMBRE,
        BOD_ID_SUCURSAL,
        BOD_ID_ENCARGADO,
        BOD_DIRECCION,
        BOD_PERMITE_VENTAS,
        BOD_ACTIVO
      FROM CMP_BODEGA
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.nombre) {
      sql += ` AND UPPER(BOD_NOMBRE) LIKE UPPER(:nombre)`;
      binds.nombre = `%${filters.nombre}%`;
    }

    if (filters.codigo) {
      sql += ` AND UPPER(BOD_CODIGO) LIKE UPPER(:codigo)`;
      binds.codigo = `%${filters.codigo}%`;
    }

    if (filters.activo !== undefined) {
      sql += ` AND BOD_ACTIVO = :activo`;
      binds.activo = filters.activo;
    }

    sql += ` ORDER BY BOD_NOMBRE ASC`;

    const result = await execute<IBodegaDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToBodega);
  }

  /**
   * Busca una bodega por su ID primario.
   */
  static async findById(id: number): Promise<IBodega | null> {
    const sql = `
      SELECT 
        BOD_ID_BODEGA,
        BOD_CODIGO,
        BOD_NOMBRE,
        BOD_ID_SUCURSAL,
        BOD_ID_ENCARGADO,
        BOD_DIRECCION,
        BOD_PERMITE_VENTAS,
        BOD_ACTIVO
      FROM CMP_BODEGA
      WHERE BOD_ID_BODEGA = :id
    `;

    const result = await execute<IBodegaDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToBodega(result.rows[0]);
  }

  /**
   * Busca una bodega por su código único (case-insensitive).
   */
  static async findByCodigo(codigo: string): Promise<IBodega | null> {
    const sql = `
      SELECT 
        BOD_ID_BODEGA,
        BOD_CODIGO,
        BOD_NOMBRE,
        BOD_ID_SUCURSAL,
        BOD_ID_ENCARGADO,
        BOD_DIRECCION,
        BOD_PERMITE_VENTAS,
        BOD_ACTIVO
      FROM CMP_BODEGA
      WHERE UPPER(TRIM(BOD_CODIGO)) = UPPER(TRIM(:codigo))
    `;

    const result = await execute<IBodegaDbRow>(sql, { codigo });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToBodega(result.rows[0]);
  }

  /**
   * Inserta una nueva bodega calculando dinámicamente el próximo ID único para evitar ORA-00001.
   */
  static async create(data: ICreateBodegaDTO): Promise<IBodega> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(BOD_ID_BODEGA), 0) + 1 AS NEXT_ID FROM CMP_BODEGA`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const sql = `
        INSERT INTO CMP_BODEGA (
          BOD_ID_BODEGA,
          BOD_CODIGO,
          BOD_NOMBRE,
          BOD_ID_SUCURSAL,
          BOD_ID_ENCARGADO,
          BOD_DIRECCION,
          BOD_PERMITE_VENTAS,
          BOD_ACTIVO
        ) VALUES (
          :newId,
          :codigo,
          :nombre,
          :sucursal,
          :encargado,
          :direccion,
          :permiteVentas,
          :activo
        )
      `;

      await conn.execute(sql, {
        newId,
        codigo: data.bodCodigo.trim().toUpperCase(),
        nombre: data.bodNombre.trim(),
        sucursal: data.bodIdSucursal || 1,
        encargado: data.bodIdEncargado || null,
        direccion: data.bodDireccion ? data.bodDireccion.trim() : null,
        permiteVentas: data.bodPermiteVentas !== undefined ? data.bodPermiteVentas : 1,
        activo: data.bodActivo !== undefined ? data.bodActivo : 1,
      });

      return {
        bodIdBodega: newId,
        bodCodigo: data.bodCodigo.trim().toUpperCase(),
        bodNombre: data.bodNombre.trim(),
        bodIdSucursal: data.bodIdSucursal || 1,
        bodIdEncargado: data.bodIdEncargado || null,
        bodDireccion: data.bodDireccion ? data.bodDireccion.trim() : null,
        bodPermiteVentas: data.bodPermiteVentas !== undefined ? data.bodPermiteVentas : 1,
        bodActivo: data.bodActivo !== undefined ? data.bodActivo : 1,
      };
    });
  }

  /**
   * Actualiza los datos de una bodega existente.
   */
  static async update(id: number, data: IUpdateBodegaDTO): Promise<IBodega | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.bodCodigo !== undefined) {
      setClauses.push('BOD_CODIGO = :codigo');
      binds.codigo = data.bodCodigo.trim().toUpperCase();
    }

    if (data.bodNombre !== undefined) {
      setClauses.push('BOD_NOMBRE = :nombre');
      binds.nombre = data.bodNombre.trim();
    }

    if (data.bodIdSucursal !== undefined) {
      setClauses.push('BOD_ID_SUCURSAL = :sucursal');
      binds.sucursal = data.bodIdSucursal;
    }

    if (data.bodIdEncargado !== undefined) {
      setClauses.push('BOD_ID_ENCARGADO = :encargado');
      binds.encargado = data.bodIdEncargado;
    }

    if (data.bodDireccion !== undefined) {
      setClauses.push('BOD_DIRECCION = :direccion');
      binds.direccion = data.bodDireccion ? data.bodDireccion.trim() : null;
    }

    if (data.bodPermiteVentas !== undefined) {
      setClauses.push('BOD_PERMITE_VENTAS = :permiteVentas');
      binds.permiteVentas = data.bodPermiteVentas;
    }

    if (data.bodActivo !== undefined) {
      setClauses.push('BOD_ACTIVO = :activo');
      binds.activo = data.bodActivo;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE CMP_BODEGA
      SET ${setClauses.join(', ')}
      WHERE BOD_ID_BODEGA = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina una bodega. Si tiene inventario, ubicaciones, recepciones o movimientos asociados,
   * realiza una baja lógica (BOD_ACTIVO = 0) para mantener la integridad referencial.
   */
  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      const countRes = await conn.execute<any>(
        `SELECT 
          (SELECT COUNT(*) FROM CMP_INVENTARIO WHERE INV_ID_BODEGA = :id) +
          (SELECT COUNT(*) FROM CMP_UBICACION WHERE UBI_ID_BODEGA = :id) +
          (SELECT COUNT(*) FROM CMP_RECEPCION_BODEGA WHERE RBO_ID_BODEGA = :id) +
          (SELECT COUNT(*) FROM CMP_TOMA_FISICA WHERE TOM_ID_BODEGA = :id) +
          (SELECT COUNT(*) FROM CMP_MOVIMIENTO_INVENTARIO WHERE MIN_ID_BODEGA_ORIGEN = :id OR MIN_ID_BODEGA_DESTINO = :id) AS TOTAL
        FROM DUAL`,
        { id }
      );
      const totalAsociados = Number(countRes.rows?.[0]?.TOTAL || countRes.rows?.[0]?.[0] || 0);

      if (totalAsociados > 0) {
        await conn.execute(
          `UPDATE CMP_BODEGA SET BOD_ACTIVO = 0 WHERE BOD_ID_BODEGA = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM CMP_BODEGA WHERE BOD_ID_BODEGA = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
