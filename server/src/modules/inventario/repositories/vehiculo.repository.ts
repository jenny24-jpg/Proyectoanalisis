import { execute, withTransaction } from '../../../config/database.js';
import {
  IVehiculo,
  ICreateVehiculoDTO,
  IUpdateVehiculoDTO,
  IVehiculoFilterParams,
} from '@erp/contracts';

interface IVehiculoDbRow {
  VEH_ID_VEHICULO: number | string;
  VEH_PLACA: string;
  VEH_MARCA: string;
  VEH_MODELO: string;
  VEH_ANIO?: number | string | null;
  VEH_ESTADO: string;
}

function mapRowToVehiculo(row: IVehiculoDbRow): IVehiculo {
  return {
    vehIdVehiculo: Number(row.VEH_ID_VEHICULO),
    vehPlaca: String(row.VEH_PLACA),
    vehMarca: String(row.VEH_MARCA),
    vehModelo: String(row.VEH_MODELO),
    vehAnio: row.VEH_ANIO !== null && row.VEH_ANIO !== undefined ? Number(row.VEH_ANIO) : null,
    vehEstado: (row.VEH_ESTADO as any) || 'ACTIVO',
  };
}

/**
 * Repositorio de Acceso a Datos para la tabla CMP_VEHICULO en Oracle DB
 */
export class VehiculoRepository {
  /**
   * Consulta todos los vehículos con filtros opcionales de búsqueda, placa, marca y estado.
   */
  static async findAll(filters: IVehiculoFilterParams = {}): Promise<IVehiculo[]> {
    let sql = `
      SELECT 
        VEH_ID_VEHICULO,
        VEH_PLACA,
        VEH_MARCA,
        VEH_MODELO,
        VEH_ANIO,
        VEH_ESTADO
      FROM CMP_VEHICULO
      WHERE 1=1
    `;
    const binds: Record<string, any> = {};

    if (filters.search) {
      sql += ` AND (UPPER(VEH_PLACA) LIKE UPPER(:search) OR UPPER(VEH_MARCA) LIKE UPPER(:search) OR UPPER(VEH_MODELO) LIKE UPPER(:search))`;
      binds.search = `%${filters.search}%`;
    }

    if (filters.placa) {
      sql += ` AND UPPER(VEH_PLACA) LIKE UPPER(:placa)`;
      binds.placa = `%${filters.placa}%`;
    }

    if (filters.marca) {
      sql += ` AND UPPER(VEH_MARCA) LIKE UPPER(:marca)`;
      binds.marca = `%${filters.marca}%`;
    }

    if (filters.estado && filters.estado !== 'TODOS') {
      sql += ` AND UPPER(VEH_ESTADO) = UPPER(:estado)`;
      binds.estado = filters.estado;
    }

    sql += ` ORDER BY VEH_ID_VEHICULO DESC`;

    const result = await execute<IVehiculoDbRow>(sql, binds);
    return (result.rows || []).map(mapRowToVehiculo);
  }

  /**
   * Busca un vehículo por su ID primario.
   */
  static async findById(id: number): Promise<IVehiculo | null> {
    const sql = `
      SELECT 
        VEH_ID_VEHICULO,
        VEH_PLACA,
        VEH_MARCA,
        VEH_MODELO,
        VEH_ANIO,
        VEH_ESTADO
      FROM CMP_VEHICULO
      WHERE VEH_ID_VEHICULO = :id
    `;

    const result = await execute<IVehiculoDbRow>(sql, { id });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToVehiculo(result.rows[0]);
  }

  /**
   * Busca un vehículo por su placa.
   */
  static async findByPlaca(placa: string): Promise<IVehiculo | null> {
    const sql = `
      SELECT 
        VEH_ID_VEHICULO,
        VEH_PLACA,
        VEH_MARCA,
        VEH_MODELO,
        VEH_ANIO,
        VEH_ESTADO
      FROM CMP_VEHICULO
      WHERE UPPER(TRIM(VEH_PLACA)) = UPPER(TRIM(:placa))
    `;

    const result = await execute<IVehiculoDbRow>(sql, { placa });
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    return mapRowToVehiculo(result.rows[0]);
  }

  /**
   * Inserta un nuevo vehículo en CMP_VEHICULO.
   */
  static async create(data: ICreateVehiculoDTO): Promise<IVehiculo> {
    return await withTransaction(async (conn) => {
      const nextIdRes = await conn.execute<any>(
        `SELECT NVL(MAX(VEH_ID_VEHICULO), 0) + 1 AS NEXT_ID FROM CMP_VEHICULO`
      );
      const rows = nextIdRes.rows || [];
      const newId = rows.length > 0 ? Number(rows[0].NEXT_ID) : 1;

      const estado = data.vehEstado || 'ACTIVO';

      const sql = `
        INSERT INTO CMP_VEHICULO (
          VEH_ID_VEHICULO,
          VEH_PLACA,
          VEH_MARCA,
          VEH_MODELO,
          VEH_ANIO,
          VEH_ESTADO
        ) VALUES (
          :newId,
          :placa,
          :marca,
          :modelo,
          :anio,
          :estado
        )
      `;

      await conn.execute(sql, {
        newId,
        placa: data.vehPlaca.trim().toUpperCase(),
        marca: data.vehMarca.trim(),
        modelo: data.vehModelo.trim(),
        anio: data.vehAnio || null,
        estado,
      });

      return {
        vehIdVehiculo: newId,
        vehPlaca: data.vehPlaca.trim().toUpperCase(),
        vehMarca: data.vehMarca.trim(),
        vehModelo: data.vehModelo.trim(),
        vehAnio: data.vehAnio || null,
        vehEstado: estado,
      };
    });
  }

  /**
   * Actualiza los datos de un vehículo existente.
   */
  static async update(id: number, data: IUpdateVehiculoDTO): Promise<IVehiculo | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const setClauses: string[] = [];
    const binds: Record<string, any> = { id };

    if (data.vehPlaca !== undefined) {
      setClauses.push('VEH_PLACA = :placa');
      binds.placa = data.vehPlaca.trim().toUpperCase();
    }

    if (data.vehMarca !== undefined) {
      setClauses.push('VEH_MARCA = :marca');
      binds.marca = data.vehMarca.trim();
    }

    if (data.vehModelo !== undefined) {
      setClauses.push('VEH_MODELO = :modelo');
      binds.modelo = data.vehModelo.trim();
    }

    if (data.vehAnio !== undefined) {
      setClauses.push('VEH_ANIO = :anio');
      binds.anio = data.vehAnio;
    }

    if (data.vehEstado !== undefined) {
      setClauses.push('VEH_ESTADO = :estado');
      binds.estado = data.vehEstado;
    }

    if (setClauses.length === 0) {
      return existing;
    }

    const sql = `
      UPDATE CMP_VEHICULO
      SET ${setClauses.join(', ')}
      WHERE VEH_ID_VEHICULO = :id
    `;

    await withTransaction(async (conn) => {
      await conn.execute(sql, binds);
    });

    return await this.findById(id);
  }

  /**
   * Elimina o da de baja un vehículo.
   */
  static async delete(id: number): Promise<{ deleted: boolean; deactivated: boolean }> {
    return await withTransaction(async (conn) => {
      // Verificar si está referenciado en recepciones
      let countRecepciones = 0;
      try {
        const checkRes = await conn.execute<any>(
          `SELECT COUNT(*) AS TOTAL FROM CMP_RECEPCION_BODEGA WHERE RBO_ID_VEHICULO = :id`,
          { id }
        );
        countRecepciones = Number(checkRes.rows?.[0]?.TOTAL || checkRes.rows?.[0]?.[0] || 0);
      } catch {
        countRecepciones = 0;
      }

      if (countRecepciones > 0) {
        await conn.execute(
          `UPDATE CMP_VEHICULO SET VEH_ESTADO = 'BAJA' WHERE VEH_ID_VEHICULO = :id`,
          { id }
        );
        return { deleted: false, deactivated: true };
      }

      await conn.execute(
        `DELETE FROM CMP_VEHICULO WHERE VEH_ID_VEHICULO = :id`,
        { id }
      );
      return { deleted: true, deactivated: false };
    });
  }
}
