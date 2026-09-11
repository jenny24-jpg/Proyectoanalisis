import { Request, Response } from 'express';
import { TomaFisicaService } from '../services/tomaFisica.service.js';

export class TomaFisicaController {
  static async aperturar(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const resultado = await TomaFisicaService.aperturar(payload);
      res.status(201).json(resultado);
    } catch (error: any) {
      console.error('[TomaFisicaController] Error al aperturar:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getActiva(req: Request, res: Response): Promise<void> {
    try {
      const { idBodega } = req.params;
      const toma = await TomaFisicaService.getActiva(Number(idBodega));
      if (!toma) {
        res.status(404).json({ success: false, message: 'No hay toma física activa' });
      } else {
        res.status(200).json(toma);
      }
    } catch (error: any) {
      console.error('[TomaFisicaController] Error getActiva:', error.message);
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }

  static async guardarConteo(req: Request, res: Response): Promise<void> {
    try {
      const { idToma } = req.params;
      const payload = { ...req.body, idToma: Number(idToma) };
      const resultado = await TomaFisicaService.guardarConteo(payload);
      res.status(200).json(resultado);
    } catch (error: any) {
      console.error('[TomaFisicaController] Error al guardar conteo:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
