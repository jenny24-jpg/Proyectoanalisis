// server/src/modules/inventario/controllers/articulo.controller.ts
import { Request, Response } from 'express';
import { ArticuloRepository } from '../repositories/articulo.repository.js';
import type { IActualizarArticuloDTO } from '@erp/contracts';

export class ArticuloController {
  
  // GET: Obtener todos
  static async obtenerTodos(req: Request, res: Response) {
    try {
      const articulos = await ArticuloRepository.obtenerTodos();
      res.json(articulos);
    } catch (error) {
      console.error('[ArticuloController] Error en obtenerTodos:', error);
      res.status(500).json({ message: 'Error interno al obtener los artículos.' });
    }
  }

  // PUT: Actualizar Descripción
  static async actualizarDescripcion(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const datos = req.body as IActualizarArticuloDTO;
      
      const exito = await ArticuloRepository.actualizarDescripcion(codigo, datos);
      
      if (exito) {
        res.json({ message: 'Descripción actualizada correctamente.' });
      } else {
        res.status(404).json({ message: 'Artículo no encontrado.' });
      }
    } catch (error) {
      console.error('[ArticuloController] Error en actualizarDescripcion:', error);
      res.status(500).json({ message: 'Error interno al actualizar el artículo.' });
    }
  }

  // DELETE: Eliminar (Lógico)
  static async eliminar(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const exito = await ArticuloRepository.eliminar(codigo);
      
      if (exito) {
        res.json({ message: 'Artículo desactivado correctamente.' });
      } else {
        res.status(404).json({ message: 'Artículo no encontrado.' });
      }
    } catch (error) {
      console.error('[ArticuloController] Error en eliminar:', error);
      res.status(500).json({ message: 'Error interno al eliminar el artículo.' });
    }
  }



// POST: Crear Artículo
  static async crear(req: Request, res: Response) {
    try {
      const datos = req.body;
      const exito = await ArticuloRepository.crear(datos);
      
      if (exito) {
        res.status(201).json({ message: 'Artículo creado correctamente.' });
      } else {
        res.status(400).json({ message: 'No se pudo crear el artículo.' });
      }
    } catch (error: any) {
      console.error('[ArticuloController] Error en crear:', error);
      // ORA-00001 es el error de Oracle cuando el código (llave primaria) ya existe
      if (error.message && error.message.includes('ORA-00001')) {
        res.status(409).json({ message: 'Ya existe un artículo con ese código.' });
      } else {
        res.status(500).json({ message: 'Error interno al crear el artículo.' });
      }
    }
  }


}
