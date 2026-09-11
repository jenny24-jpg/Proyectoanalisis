import { Request, Response } from 'express';
import { TipoMovimientoService } from '../services/tipoMovimiento.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';
import { NaturalezaMovimientoType } from '@erp/contracts';

export class TipoMovimientoController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { codigo, descripcion, naturaleza, activo } = req.query;
      const filters = {
        codigo: codigo ? String(codigo) : undefined,
        descripcion: descripcion ? String(descripcion) : undefined,
        naturaleza: naturaleza ? (String(naturaleza) as NaturalezaMovimientoType) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
      };
      const tipos = await TipoMovimientoService.obtenerTiposMovimiento(filters);
      sendSuccess(res, tipos);
    } catch (error: any) {
      sendError(res, 'Error al obtener los tipos de movimiento', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const tipo = await TipoMovimientoService.obtenerPorId(id);
      if (!tipo) {
        sendError(res, `No se encontró el tipo de movimiento con ID ${id}`, undefined, 404);
        return;
      }
      sendSuccess(res, tipo);
    } catch (error: any) {
      sendError(res, 'Error al obtener el tipo de movimiento', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevo = await TipoMovimientoService.crearTipoMovimiento(req.body);
      sendSuccess(res, nuevo, 'Tipo de movimiento registrado exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear el tipo de movimiento', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const actualizado = await TipoMovimientoService.actualizarTipoMovimiento(id, req.body);
      sendSuccess(res, actualizado, 'Tipo de movimiento actualizado exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar el tipo de movimiento', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await TipoMovimientoService.eliminarTipoMovimiento(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar el tipo de movimiento', error, 400);
    }
  }
}
