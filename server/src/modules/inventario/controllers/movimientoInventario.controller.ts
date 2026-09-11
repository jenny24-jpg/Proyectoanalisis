import { Request, Response } from 'express';
import { MovimientoInventarioService } from '../services/movimientoInventario.service.js';

export class MovimientoInventarioController {
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const resultado = await MovimientoInventarioService.crearMovimiento(payload);
      
      res.status(201).json(resultado);
    } catch (error: any) {
      console.error('[MovimientoInventarioController] Error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al aplicar el movimiento de inventario',
      });
    }
  }
}
