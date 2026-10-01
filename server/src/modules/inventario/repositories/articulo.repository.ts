// server/src/modules/inventario/repositories/articulo.repository.ts
import db from '../../../config/database.js'; // Ajusta los '../' según sea necesario para llegar a database.ts
import type { IArticulo, IActualizarArticuloDTO } from '@erp/contracts';

export class ArticuloRepository {
  
// 1. Obtener todos los artículos (con soporte para filtrar solo activos o por estado)
  static async obtenerTodos(filtros?: { soloActivos?: boolean; activo?: number }): Promise<IArticulo[]> {
    let whereClause = 'WHERE 1=1';
    const binds: Record<string, any> = {};

    if (filtros?.soloActivos || filtros?.activo === 1) {
      whereClause += ' AND A.ART_ACTIVO = 1';
    } else if (filtros?.activo !== undefined) {
      whereClause += ' AND A.ART_ACTIVO = :activo';
      binds.activo = filtros.activo;
    }

    const sql = `
      SELECT 
        A.ART_CODIGO_ARTICULO, 
        A.ART_DESCRIPCION, 
        A.ART_ID_CATEGORIA, 
        A.ART_ID_MARCA, 
        A.ART_ID_UNIDAD_COMPRA, 
        A.ART_ID_UNIDAD_VENTA, 
        A.ART_MANEJA_LOTE, 
        A.ART_ACTIVO,
        NVL(SUM(I.INV_EXISTENCIA_ACTUAL), 0) AS STOCK_TOTAL
      FROM CMP_ARTICULO A
      LEFT JOIN CMP_INVENTARIO I ON A.ART_CODIGO_ARTICULO = I.INV_CODIGO_ARTICULO
      ${whereClause}
      GROUP BY 
        A.ART_CODIGO_ARTICULO, 
        A.ART_DESCRIPCION, 
        A.ART_ID_CATEGORIA, 
        A.ART_ID_MARCA, 
        A.ART_ID_UNIDAD_COMPRA, 
        A.ART_ID_UNIDAD_VENTA, 
        A.ART_MANEJA_LOTE, 
        A.ART_ACTIVO
      ORDER BY A.ART_DESCRIPCION ASC
    `;
    const resultado = await db.execute<IArticulo>(sql, binds);
    return resultado.rows || [];
  }


  // 2. Actualizar la descripción de un artículo
  static async actualizarDescripcion(codigo: string, datos: IActualizarArticuloDTO): Promise<boolean> {
    const sql = `
      UPDATE CMP_ARTICULO 
      SET ART_DESCRIPCION = :descripcion 
      WHERE ART_CODIGO_ARTICULO = :codigo
    `;
    
    const binds = {
      descripcion: datos.ART_DESCRIPCION,
      codigo: codigo
    };

    // Usamos autoCommit true solo para esta ejecución, o lo pasamos por una transacción
    const options = { autoCommit: true };

    const resultado = await db.execute(sql, binds, options);
    
    // Si rowsAffected es mayor a 0, se actualizó con éxito
    return (resultado.rowsAffected ?? 0) > 0;
  }

  // 3. Eliminación Física Permanente (Hard Delete)
  static async eliminar(codigo: string): Promise<boolean> {
    const sql = `
      DELETE FROM CMP_ARTICULO 
      WHERE ART_CODIGO_ARTICULO = :codigo
    `;
    
    const binds = { codigo };
    const options = { autoCommit: true };

    try {
      const resultado = await db.execute(sql, binds, options);
      return (resultado.rowsAffected ?? 0) > 0;
    } catch (error: any) {
      if (error?.errorNum === 2292 || (error?.message && error.message.includes('ORA-02292'))) {
        throw new Error(
          `No se puede eliminar permanentemente el artículo "${codigo}" porque posee registros vinculados (compras, recepciones, lotes, inventario o movimientos asociados).`
        );
      }
      throw error;
    }
  }

  // 3.1 Cambiar Estado Activo (Activar o Desactivar)
  static async cambiarEstado(codigo: string, activo: number): Promise<boolean> {
    const sql = `
      UPDATE CMP_ARTICULO 
      SET ART_ACTIVO = :activo 
      WHERE ART_CODIGO_ARTICULO = :codigo
    `;
    
    const binds = { codigo, activo };
    const options = { autoCommit: true };

    const resultado = await db.execute(sql, binds, options);
    return (resultado.rowsAffected ?? 0) > 0;
  }

// 4. Crear un nuevo artículo (Insert)
  static async crear(datos: any): Promise<boolean> {
    const sql = `
      INSERT INTO CMP_ARTICULO (
        ART_CODIGO_ARTICULO, ART_DESCRIPCION, ART_ID_CATEGORIA, 
        ART_ID_MARCA, ART_ID_UNIDAD_COMPRA, ART_ID_UNIDAD_VENTA, 
        ART_MANEJA_LOTE, ART_ACTIVO
      ) VALUES (
        :codigo, :descripcion, :categoria, 
        :marca, :unidadCompra, :unidadVenta, 
        :manejaLote, 1
      )
    `;
    
    const binds = {
      codigo: datos.ART_CODIGO_ARTICULO,
      descripcion: datos.ART_DESCRIPCION,
      categoria: datos.ART_ID_CATEGORIA,
      marca: datos.ART_ID_MARCA,
      unidadCompra: datos.ART_ID_UNIDAD_COMPRA,
      unidadVenta: datos.ART_ID_UNIDAD_VENTA,
      manejaLote: datos.ART_MANEJA_LOTE
    };

    const options = { autoCommit: true };
    const resultado = await db.execute(sql, binds, options);
    return (resultado.rowsAffected ?? 0) > 0;
  }

  // 5. Obtener el siguiente código secuencial disponible para ART-XXXX
  static async obtenerSiguienteCodigo(): Promise<string> {
    const sql = `
      SELECT NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(ART_CODIGO_ARTICULO, '[0-9]+'))), 0) + 1 AS NEXT_NUM 
      FROM CMP_ARTICULO 
      WHERE REGEXP_LIKE(ART_CODIGO_ARTICULO, '^ART-[0-9]+')
    `;
    const resultado = await db.execute<any>(sql);
    const nextNum = Number(resultado.rows?.[0]?.NEXT_NUM || 1);
    return `ART-${String(nextNum).padStart(4, '0')}`;
  }
}

