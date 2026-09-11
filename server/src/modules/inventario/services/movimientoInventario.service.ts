import { MovimientoInventarioRepository } from '../repositories/movimientoInventario.repository.js';
import { IMovimientoInventarioCreateDTO } from '@erp/contracts';

export class MovimientoInventarioService {
  static async crearMovimiento(data: IMovimientoInventarioCreateDTO): Promise<{ success: boolean; message: string; noMovimiento: string }> {
    if (!data.detalles || data.detalles.length === 0) {
      throw new Error('El movimiento debe tener al menos un artículo.');
    }

    if (data.tipoMovimiento === 'TRF_SALIDA' && !data.idBodegaDestino) {
      throw new Error('Debe especificar una bodega de destino para las transferencias.');
    }

    if (data.tipoMovimiento === 'TRF_SALIDA' && data.idBodegaOrigen === data.idBodegaDestino) {
      throw new Error('La bodega de origen y destino no pueden ser la misma.');
    }

    // Generar un número de documento temporal basado en timestamp para efectos de este cascarón
    const noMovimiento = `MOV-2026-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

    await MovimientoInventarioRepository.create(data, noMovimiento);

    return {
      success: true,
      message: 'Movimiento de inventario aplicado correctamente.',
      noMovimiento
    };
  }
}
