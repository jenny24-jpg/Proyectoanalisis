import { execute, withTransaction } from '../../../config/database.js';
import { ITomaFisicaCreateDTO, IGuardarConteoDTO, ITomaFisicaResponseDTO } from '@erp/contracts';

export class TomaFisicaRepository {
  /**
   * Verifica si existe una toma física en proceso para una bodega
   */
  static async getActiva(idBodega: number): Promise<ITomaFisicaResponseDTO | null> {
    const sqlToma = `
      SELECT TOM_ID_TOMA, TOM_NUMERO_TOMA, TOM_ESTADO
      FROM CMP_TOMA_FISICA 
      WHERE TOM_ID_BODEGA = :idBodega AND TOM_ESTADO = 'ABIERTA'
    `;
    const resToma = await execute<any>(sqlToma, { idBodega });
    
    if (!resToma.rows || resToma.rows.length === 0) return null;
    
    const toma = resToma.rows[0];

    const sqlDetalles = `
      SELECT D.DTF_ID_DETALLE, D.DTF_CODIGO_ARTICULO, A.ART_DESCRIPCION, D.DTF_STOCK_TEORICO, D.DTF_STOCK_FISICO, D.DTF_DIFERENCIA
      FROM CMP_DETALLE_TOMA_FISICA D
      JOIN CMP_ARTICULO A ON D.DTF_CODIGO_ARTICULO = A.ART_CODIGO_ARTICULO
      WHERE D.DTF_ID_TOMA = :idToma
    `;
    const resDetalles = await execute<any>(sqlDetalles, { idToma: toma.TOM_ID_TOMA });

    return {
      idToma: toma.TOM_ID_TOMA,
      numeroToma: toma.TOM_NUMERO_TOMA,
      idBodega,
      estado: toma.TOM_ESTADO,
      detalles: (resDetalles.rows || []).map(r => ({
        idDetalle: r.DTF_ID_DETALLE,
        codigoArticulo: r.DTF_CODIGO_ARTICULO,
        nombreArticulo: r.ART_DESCRIPCION,
        stockTeorico: r.DTF_STOCK_TEORICO,
        stockFisico: r.DTF_STOCK_FISICO,
        diferencia: r.DTF_DIFERENCIA
      }))
    };
  }

  /**
   * Apertura una nueva toma física, congelando el stock actual como teórico
   */
  static async aperturar(data: ITomaFisicaCreateDTO, noToma: string): Promise<number> {
    return withTransaction(async (conn) => {
      // 1. Obtener ID cabecera
      const sqlMax = `SELECT COALESCE(MAX(TOM_ID_TOMA), 0) + 1 AS NEXT_ID FROM CMP_TOMA_FISICA`;
      const resMax = await conn.execute<any>(sqlMax);
      const idToma = resMax.rows ? resMax.rows[0].NEXT_ID : 1;

      // 2. Insertar Cabecera
      const sqlCabecera = `
        INSERT INTO CMP_TOMA_FISICA (
          TOM_ID_TOMA, TOM_NUMERO_TOMA, TOM_ID_BODEGA, TOM_FECHA_TOMA, TOM_ESTADO, TOM_ID_USUARIO_CREA
        ) VALUES (
          :idToma, :noToma, :bodega, SYSDATE, 'ABIERTA', :usuario
        )
      `;
      await conn.execute(sqlCabecera, {
        idToma, noToma, bodega: data.idBodega, usuario: data.idUsuario
      });

      // 3. Consultar stock actual e insertar detalles
      const sqlInv = `
        SELECT INV_CODIGO_ARTICULO, INV_EXISTENCIA_ACTUAL, INV_COSTO_PROMEDIO_LOCAL 
        FROM CMP_INVENTARIO 
        WHERE INV_ID_BODEGA = :bodega
      `;
      const resInv = await conn.execute<any>(sqlInv, { bodega: data.idBodega });
      const inventario = resInv.rows || [];

      if (inventario.length > 0) {
        const sqlMaxDet = `SELECT COALESCE(MAX(DTF_ID_DETALLE), 0) AS MAX_ID FROM CMP_DETALLE_TOMA_FISICA`;
        const resMaxDet = await conn.execute<any>(sqlMaxDet);
        let idDetalle = resMaxDet.rows ? resMaxDet.rows[0].MAX_ID : 0;

        for (const inv of inventario) {
          idDetalle++;
          const sqlInsDet = `
            INSERT INTO CMP_DETALLE_TOMA_FISICA (
              DTF_ID_DETALLE, DTF_ID_TOMA, DTF_CODIGO_ARTICULO, DTF_STOCK_TEORICO, DTF_STOCK_FISICO, DTF_DIFERENCIA, DTF_COSTO_UNITARIO, DTF_COSTO_DIFERENCIA, DTF_AJUSTADO
            ) VALUES (
              :idDet, :idToma, :codigo, :teorico, 0, 0, :costo, 0, 0
            )
          `;
          await conn.execute(sqlInsDet, {
            idDet: idDetalle,
            idToma,
            codigo: inv.INV_CODIGO_ARTICULO,
            teorico: inv.INV_EXISTENCIA_ACTUAL,
            costo: inv.INV_COSTO_PROMEDIO_LOCAL || 0
          });
        }
      }

      return idToma;
    });
  }

  /**
   * Guarda los conteos físicos y cierra la toma calculando diferencias
   */
  static async guardarConteo(data: IGuardarConteoDTO): Promise<void> {
    await withTransaction(async (conn) => {
      for (const det of data.detalles) {
        // Actualizamos cada detalle con el stock físico y la diferencia (físico - teórico)
        const sqlUpd = `
          UPDATE CMP_DETALLE_TOMA_FISICA
          SET 
            DTF_STOCK_FISICO = :fisico,
            DTF_DIFERENCIA = :fisico - DTF_STOCK_TEORICO,
            DTF_COSTO_DIFERENCIA = (:fisico - DTF_STOCK_TEORICO) * DTF_COSTO_UNITARIO
          WHERE DTF_ID_TOMA = :idToma AND DTF_CODIGO_ARTICULO = :codigo
        `;
        await conn.execute(sqlUpd, {
          fisico: det.stockFisico,
          idToma: data.idToma,
          codigo: det.codigoArticulo
        });
      }

      // Cerrar la toma física
      const sqlCerrar = `
        UPDATE CMP_TOMA_FISICA
        SET TOM_ESTADO = 'AJUSTADA', TOM_ID_USUARIO_CIERRA = :usuario, TOM_FECHA_CIERRE = SYSDATE
        WHERE TOM_ID_TOMA = :idToma
      `;
      await conn.execute(sqlCerrar, { usuario: data.idUsuario, idToma: data.idToma });
    });
  }
}
