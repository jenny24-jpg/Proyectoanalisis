import { Request, Response } from 'express';
import { VehiculoService } from '../services/vehiculo.service.js';

export class VehiculoController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        placa: req.query.placa as string,
        marca: req.query.marca as string,
        estado: req.query.estado as string,
      };
      const data = await VehiculoService.getAllVehiculos(filters);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('[VehiculoController.getAll]:', err);
      res.status(500).json({ success: false, error: err.message || 'Error al obtener vehículos' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await VehiculoService.getVehiculoById(id);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('[VehiculoController.getById]:', err);
      res.status(404).json({ success: false, error: err.message || 'Vehículo no encontrado' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data = await VehiculoService.createVehiculo(req.body);
      res.status(201).json({
        success: true,
        message: 'Vehículo registrado exitosamente',
        data,
      });
    } catch (err: any) {
      console.error('[VehiculoController.create]:', err);
      res.status(400).json({ success: false, error: err.message || 'Error al registrar vehículo' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await VehiculoService.updateVehiculo(id, req.body);
      res.json({
        success: true,
        message: 'Vehículo actualizado exitosamente',
        data,
      });
    } catch (err: any) {
      console.error('[VehiculoController.update]:', err);
      res.status(400).json({ success: false, error: err.message || 'Error al actualizar vehículo' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const result = await VehiculoService.deleteVehiculo(id);
      res.json({
        success: true,
        message: result.message,
        deactivated: result.deactivated,
      });
    } catch (err: any) {
      console.error('[VehiculoController.delete]:', err);
      res.status(400).json({ success: false, error: err.message || 'Error al eliminar vehículo' });
    }
  }
}
