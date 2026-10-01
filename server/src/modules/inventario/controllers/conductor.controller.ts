import { Request, Response } from 'express';
import { ConductorService } from '../services/conductor.service.js';

export class ConductorController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        dpi: req.query.dpi as string,
        tipoLicencia: req.query.tipoLicencia as string,
        estado: req.query.estado as string,
      };
      const data = await ConductorService.getAllConductores(filters);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('[ConductorController.getAll]:', err);
      res.status(500).json({ success: false, error: err.message || 'Error al obtener conductores' });
    }
  }

  static async getEmpleados(req: Request, res: Response): Promise<void> {
    try {
      const data = await ConductorService.getEmpleados();
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('[ConductorController.getEmpleados]:', err);
      res.status(500).json({ success: false, error: err.message || 'Error al obtener empleados' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await ConductorService.getConductorById(id);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('[ConductorController.getById]:', err);
      res.status(404).json({ success: false, error: err.message || 'Conductor no encontrado' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data = await ConductorService.createConductor(req.body);
      res.status(201).json({
        success: true,
        message: 'Conductor registrado exitosamente',
        data,
      });
    } catch (err: any) {
      console.error('[ConductorController.create]:', err);
      res.status(400).json({ success: false, error: err.message || 'Error al registrar conductor' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await ConductorService.updateConductor(id, req.body);
      res.json({
        success: true,
        message: 'Conductor actualizado exitosamente',
        data,
      });
    } catch (err: any) {
      console.error('[ConductorController.update]:', err);
      res.status(400).json({ success: false, error: err.message || 'Error al actualizar conductor' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const result = await ConductorService.deleteConductor(id);
      res.json({
        success: true,
        message: result.message,
        deactivated: result.deactivated,
      });
    } catch (err: any) {
      console.error('[ConductorController.delete]:', err);
      res.status(400).json({ success: false, error: err.message || 'Error al eliminar conductor' });
    }
  }
}
