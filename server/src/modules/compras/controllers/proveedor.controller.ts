import { Request, Response } from 'express';
import { ProveedorService } from '../services/proveedor.service.js';
import { sendSuccess, sendError } from '../../../shared/index.js';

export class ProveedorController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, nit, activo } = req.query;
      const filters = {
        nombre: nombre ? String(nombre) : undefined,
        nit: nit ? String(nit) : undefined,
        activo: activo !== undefined ? Number(activo) : undefined,
      };

      const proveedores = await ProveedorService.obtenerProveedores(filters);
      sendSuccess(res, proveedores);
    } catch (error: any) {
      sendError(res, 'Error al obtener la lista de proveedores', error, 500);
    }
  }

  static async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const proveedor = await ProveedorService.obtenerPorId(id);

      if (!proveedor) {
        sendError(res, `No se encontró el proveedor con ID ${id}`, undefined, 404);
        return;
      }

      sendSuccess(res, proveedor);
    } catch (error: any) {
      sendError(res, 'Error al obtener el proveedor', error, 400);
    }
  }

  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const nuevoProveedor = await ProveedorService.crearProveedor(req.body);
      sendSuccess(res, nuevoProveedor, 'Proveedor registrado exitosamente', 201);
    } catch (error: any) {
      sendError(res, 'Error al crear el proveedor', error, 400);
    }
  }

  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const proveedorActualizado = await ProveedorService.actualizarProveedor(id, req.body);
      sendSuccess(res, proveedorActualizado, 'Proveedor actualizado exitosamente');
    } catch (error: any) {
      sendError(res, 'Error al actualizar el proveedor', error, 400);
    }
  }

  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const resultado = await ProveedorService.eliminarProveedor(id);
      sendSuccess(res, resultado, resultado.message);
    } catch (error: any) {
      sendError(res, 'Error al eliminar el proveedor', error, 400);
    }
  }
}
