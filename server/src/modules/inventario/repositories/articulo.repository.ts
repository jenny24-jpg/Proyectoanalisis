// server/src/modules/inventario/repositories/articulo.repository.ts
import db from '../../../config/database.js'; // Ajusta los '../' según sea necesario para llegar a database.ts
import type { IArticulo, IActualizarArticuloDTO } from '@erp/contracts';

export class ArticuloRepository {
  
// 1. Obtener todos los artículos activos con su stock total
  static async obtenerTodos(): Promise<IArticulo[]> {
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
      WHERE A.ART_ACTIVO = 1
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
    const resultado = await db.execute<IArticulo>(sql);
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

  // 3. Eliminación Lógica (Desactivar en lugar de borrar para no romper historial)
  static async eliminar(codigo: string): Promise<boolean> {
    const sql = `
      UPDATE CMP_ARTICULO 
      SET ART_ACTIVO = 0 
      WHERE ART_CODIGO_ARTICULO = :codigo
    `;
    
    const binds = { codigo };
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


}
