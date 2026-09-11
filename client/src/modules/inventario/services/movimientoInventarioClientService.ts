import { IMovimientoInventarioCreateDTO } from '@erp/contracts';

const API_BASE = '/api/inventario/movimientos';

export class MovimientoInventarioClientService {
  static async crearMovimiento(payload: IMovimientoInventarioCreateDTO) {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Error al aplicar el movimiento de inventario');
      }

      return resData;
    } catch (error) {
      console.error('[MovimientoInventarioClientService] Error:', error);
      throw error;
    }
  }
}
