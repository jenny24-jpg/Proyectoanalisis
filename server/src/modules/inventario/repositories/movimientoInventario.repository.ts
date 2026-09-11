import { execute, withTransaction, getConnection } from '../../../config/database.js';
import { IMovimientoInventarioCreateDTO } from '@erp/contracts';

export class MovimientoInventarioRepository {
  static async create(data: IMovimientoInventarioCreateDTO, noMovimiento: string): Promise<string> {
    try {
      return await withTransaction(async (connection) => {
        // 1. Obtener ID del tipo de movimiento
        const sqlTipoMov = `SELECT TMI_ID_TIPO_MOVIMIENTO FROM CMP_TIPO_MOVIMIENTO_INV WHERE TMI_CODIGO = :codigo`;
        const resTipoMov = await connection.execute<{ TMI_ID_TIPO_MOVIMIENTO: number }>(sqlTipoMov, { codigo: data.tipoMovimiento });
        
        let idTipoMovimiento = 1; // Fallback
        if (resTipoMov.rows && resTipoMov.rows.length > 0) {
          idTipoMovimiento = resTipoMov.rows[0].TMI_ID_TIPO_MOVIMIENTO;
        }

        // Obtener siguiente ID manual para Cabecera (Evitar ORA-00001 por secuencias desincronizadas)
        const sqlMaxId = `SELECT COALESCE(MAX(MIN_ID_MOVIMIENTO), 0) + 1 AS NEXT_ID FROM CMP_MOVIMIENTO_INVENTARIO`;
        const resMaxId = await connection.execute<{ NEXT_ID: number }>(sqlMaxId);
        const nextIdMovimiento = resMaxId.rows ? resMaxId.rows[0].NEXT_ID : 1;

        // 2. Insertar Cabecera
        const sqlCabecera = `
          INSERT INTO CMP_MOVIMIENTO_INVENTARIO (
            MIN_ID_MOVIMIENTO,
            MIN_NUMERO_MOVIMIENTO,
            MIN_ID_TIPO_MOVIMIENTO,
            MIN_ID_BODEGA_ORIGEN,
            MIN_ID_BODEGA_DESTINO,
            MIN_ID_USUARIO,
            MIN_ESTADO,
            MIN_OBSERVACIONES
          ) VALUES (
            :idMov,
            :numero,
            :tipo,
            :bodegaOrigen,
            :bodegaDestino,
            :usuario,
            'APLICADO',
            :observaciones
          )
        `;
        
        const bindsCabecera = {
          idMov: nextIdMovimiento,
          numero: noMovimiento,
          tipo: idTipoMovimiento,
          bodegaOrigen: data.idBodegaOrigen,
          bodegaDestino: data.idBodegaDestino || null,
          usuario: data.idUsuario,
          observaciones: data.observaciones || null
        };

        await connection.execute(sqlCabecera, bindsCabecera);

        // Obtener siguiente ID base para detalles
        const sqlMaxDet = `SELECT COALESCE(MAX(DMI_ID_DETALLE), 0) AS MAX_ID FROM CMP_DETALLE_MOVIMIENTO_INV`;
        const resMaxDet = await connection.execute<{ MAX_ID: number }>(sqlMaxDet);
        let currentDetId = resMaxDet.rows ? resMaxDet.rows[0].MAX_ID : 0;

        // 3. Procesar Detalles y Actualizar Inventario
        for (const det of data.detalles) {
          // Función auxiliar para actualizar stock de una bodega
          const actualizarStock = async (idBodega: number, codigoArticulo: string, cantidad: number, factor: 1 | -1) => {
            const sqlInv = `SELECT INV_EXISTENCIA_ACTUAL FROM CMP_INVENTARIO WHERE INV_CODIGO_ARTICULO = :codigo AND INV_ID_BODEGA = :bodega FOR UPDATE`;
            const resInv = await connection.execute<{ INV_EXISTENCIA_ACTUAL: number }>(sqlInv, { codigo: codigoArticulo, bodega: idBodega });
            
            let existenciaPrevia = 0;
            let existenciaPosterior = 0;

            if (resInv.rows && resInv.rows.length > 0) {
              existenciaPrevia = resInv.rows[0].INV_EXISTENCIA_ACTUAL;
              existenciaPosterior = existenciaPrevia + (cantidad * factor);
              
              if (existenciaPosterior < 0 && factor === -1) {
                throw new Error(`Stock insuficiente para el artículo ${codigoArticulo} en la bodega seleccionada. Actualmente hay ${existenciaPrevia} unidades y se intentó descontar ${cantidad}.`);
              }

              const sqlUpdate = `UPDATE CMP_INVENTARIO SET INV_EXISTENCIA_ACTUAL = :nueva, INV_STOCK_DISPONIBLE = :nueva WHERE INV_CODIGO_ARTICULO = :codigo AND INV_ID_BODEGA = :bodega`;
              await connection.execute(sqlUpdate, { nueva: existenciaPosterior, codigo: codigoArticulo, bodega: idBodega });
            } else {
              if (factor === -1) {
                throw new Error(`El artículo ${codigoArticulo} no existe en la bodega de origen para realizar la salida.`);
              }
              // Si es entrada y no existe, insertarlo en CMP_INVENTARIO
              existenciaPrevia = 0;
              existenciaPosterior = cantidad;
              
              // Obtener siguiente ID para Inventario (Evitar ORA-00001)
              const sqlMaxInv = `SELECT COALESCE(MAX(INV_ID_INVENTARIO), 0) + 1 AS NEXT_INV_ID FROM CMP_INVENTARIO`;
              const resMaxInv = await connection.execute<{ NEXT_INV_ID: number }>(sqlMaxInv);
              const nextInvId = resMaxInv.rows ? resMaxInv.rows[0].NEXT_INV_ID : 1;

              const sqlInsertInv = `
                INSERT INTO CMP_INVENTARIO (INV_ID_INVENTARIO, INV_ID_BODEGA, INV_CODIGO_ARTICULO, INV_EXISTENCIA_ACTUAL, INV_STOCK_DISPONIBLE, INV_COSTO_PROMEDIO_LOCAL)
                VALUES (:idInv, :bodega, :codigo, :cantidad, :cantidad, :costo)
              `;
              await connection.execute(sqlInsertInv, { 
                idInv: nextInvId,
                bodega: idBodega, 
                codigo: codigoArticulo, 
                cantidad: existenciaPosterior,
                costo: det.costoUnitario || 0
              });
            }

            return { existenciaPrevia, existenciaPosterior };
          };

          let prev = 0;
          let post = 0;

          // Naturaleza del movimiento (+ o -)
          if (data.tipoMovimiento === 'AJU_ENTRADA' || data.tipoMovimiento === 'TRF_ENTRADA') {
            const res = await actualizarStock(data.idBodegaOrigen, det.codigoArticulo, det.cantidad, 1);
            prev = res.existenciaPrevia; post = res.existenciaPosterior;
          } else if (data.tipoMovimiento === 'AJU_SALIDA') {
            const res = await actualizarStock(data.idBodegaOrigen, det.codigoArticulo, det.cantidad, -1);
            prev = res.existenciaPrevia; post = res.existenciaPosterior;
          } else if (data.tipoMovimiento === 'TRF_SALIDA') {
            // Si es transferencia, descontamos de origen y sumamos en destino
            if (!data.idBodegaDestino) throw new Error('Para transferencia se requiere bodega destino.');
            
            // Descontar origen
            const resOrigen = await actualizarStock(data.idBodegaOrigen, det.codigoArticulo, det.cantidad, -1);
            prev = resOrigen.existenciaPrevia; post = resOrigen.existenciaPosterior; // Registramos en el detalle los datos de origen

            // Aumentar destino
            await actualizarStock(data.idBodegaDestino, det.codigoArticulo, det.cantidad, 1);
          }

          currentDetId++;

          // Insertar línea de detalle
          const sqlDetalle = `
            INSERT INTO CMP_DETALLE_MOVIMIENTO_INV (
              DMI_ID_DETALLE,
              DMI_ID_MOVIMIENTO,
              DMI_CODIGO_ARTICULO,
              DMI_CANTIDAD,
              DMI_COSTO_UNITARIO,
              DMI_COSTO_TOTAL,
              DMI_EXISTENCIA_PREVIA,
              DMI_EXISTENCIA_POSTERIOR
            ) VALUES (
              :idDet,
              :idMov,
              :codigoArticulo,
              :cantidad,
              :costoUnitario,
              :costoTotal,
              :prev,
              :post
            )
          `;
          
          const costoUnitario = det.costoUnitario || 0;
          await connection.execute(sqlDetalle, {
            idDet: currentDetId,
            idMov: nextIdMovimiento,
            codigoArticulo: det.codigoArticulo,
            cantidad: det.cantidad,
            costoUnitario: costoUnitario,
            costoTotal: costoUnitario * det.cantidad,
            prev: prev,
            post: post
          });
        }

        return noMovimiento;
      });
    } catch (error: any) {
      if (error.message && error.message.includes('ORA-00001')) {
        throw new Error('Error de base de datos: Conflicto de identificadores duplicados al intentar registrar el movimiento.');
      }
      throw error;
    }
  }
}
