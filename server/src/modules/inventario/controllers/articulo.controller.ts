// server/src/modules/inventario/controllers/articulo.controller.ts
import { Request, Response } from 'express';
import { ArticuloRepository } from '../repositories/articulo.repository.js';
import type { IActualizarArticuloDTO, ICrearArticuloDTO } from '@erp/contracts';
import {
  validateStrictCode,
  validateNominalText,
  validateNumericId,
  validateBooleanFlag,
} from '../../../utils/sanitizers.js';

export class ArticuloController {
  
  // GET: Obtener todos (con filtro opcional de solo activos)
  static async obtenerTodos(req: Request, res: Response) {
    try {
      const { soloActivos, activo } = req.query;
      const soloActivosBool = soloActivos === 'true' || soloActivos === '1';
      const activoNum = activo !== undefined ? Number(activo) : undefined;

      const articulos = await ArticuloRepository.obtenerTodos({
        soloActivos: soloActivosBool,
        activo: activoNum,
      });
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
      const codigoValidado = validateStrictCode(codigo, 'código del artículo', 30);
      const datos = req.body as IActualizarArticuloDTO;

      if (!datos || typeof datos.ART_DESCRIPCION !== 'string') {
        return res.status(400).json({ message: 'La descripción del artículo es obligatoria.' });
      }

      const descripcionValidada = validateNominalText(
        datos.ART_DESCRIPCION,
        'descripción del artículo',
        250
      );
      
      const exito = await ArticuloRepository.actualizarDescripcion(codigoValidado, {
        ART_DESCRIPCION: descripcionValidada,
      });
      
      if (exito) {
        res.json({ message: 'Descripción actualizada correctamente.' });
      } else {
        res.status(404).json({ message: 'Artículo no encontrado.' });
      }
    } catch (error: any) {
      console.error('[ArticuloController] Error en actualizarDescripcion:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar el artículo.' });
    }
  }

  // DELETE: Eliminar Físico / Permanente (Hard Delete)
  static async eliminar(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const codigoValidado = validateStrictCode(codigo, 'código del artículo', 30);
      const exito = await ArticuloRepository.eliminar(codigoValidado);
      
      if (exito) {
        res.json({ message: 'Artículo eliminado permanentemente de la base de datos.' });
      } else {
        res.status(404).json({ message: 'Artículo no encontrado.' });
      }
    } catch (error: any) {
      console.error('[ArticuloController] Error en eliminar:', error);
      if (error?.errorNum === 2292 || (error?.message && (error.message.includes('ORA-02292') || error.message.includes('registros vinculados')))) {
        return res.status(409).json({ message: error.message || 'No se puede eliminar el artículo porque posee registros vinculados.' });
      }
      res.status(400).json({ message: error.message || 'Error al eliminar el artículo.' });
    }
  }

  // PATCH / PUT: Cambiar estado (Activar / Desactivar)
  static async cambiarEstado(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const codigoValidado = validateStrictCode(codigo, 'código del artículo', 30);
      const { activo } = req.body;
      const nuevoEstado = validateBooleanFlag(activo, 'activo', 1);

      const exito = await ArticuloRepository.cambiarEstado(codigoValidado, nuevoEstado);
      if (exito) {
        res.json({
          message: `Artículo ${nuevoEstado === 1 ? 'activado' : 'desactivado'} correctamente.`,
          activo: nuevoEstado,
        });
      } else {
        res.status(404).json({ message: 'Artículo no encontrado.' });
      }
    } catch (error: any) {
      console.error('[ArticuloController] Error en cambiarEstado:', error);
      res.status(400).json({ message: error.message || 'Error al cambiar estado del artículo.' });
    }
  }

  // POST: Crear Artículo
  static async crear(req: Request, res: Response) {
    try {
      const datos = req.body as ICrearArticuloDTO;

      const codigoValidado = validateStrictCode(
        datos.ART_CODIGO_ARTICULO,
        'código del artículo',
        30
      );

      const descripcionValidada = validateNominalText(
        datos.ART_DESCRIPCION,
        'descripción del artículo',
        250
      );

      const categoriaId = validateNumericId(datos.ART_ID_CATEGORIA, 'categoría');
      const marcaId = validateNumericId(datos.ART_ID_MARCA, 'marca');
      const unidadCompraId = validateNumericId(datos.ART_ID_UNIDAD_COMPRA, 'unidad de compra');
      const unidadVentaId = validateNumericId(datos.ART_ID_UNIDAD_VENTA, 'unidad de venta');
      const manejaLote = validateBooleanFlag(datos.ART_MANEJA_LOTE, 'maneja lote', 0);

      const exito = await ArticuloRepository.crear({
        ART_CODIGO_ARTICULO: codigoValidado,
        ART_DESCRIPCION: descripcionValidada,
        ART_ID_CATEGORIA: categoriaId,
        ART_ID_MARCA: marcaId,
        ART_ID_UNIDAD_COMPRA: unidadCompraId,
        ART_ID_UNIDAD_VENTA: unidadVentaId,
        ART_MANEJA_LOTE: manejaLote,
      });
      
      if (exito) {
        res.status(201).json({ message: 'Artículo creado correctamente.' });
      } else {
        res.status(400).json({ message: 'No se pudo crear el artículo.' });
      }
    } catch (error: any) {
      console.error('[ArticuloController] Error en crear:', error);
      if (error.message && error.message.includes('ORA-00001')) {
        res.status(409).json({ message: 'Ya existe un artículo con ese código.' });
      } else {
        res.status(400).json({ message: error.message || 'Error al crear el artículo.' });
      }
    }
  }

  // GET: Obtener siguiente código disponible
  static async obtenerSiguienteCodigo(req: Request, res: Response) {
    try {
      const siguienteCodigo = await ArticuloRepository.obtenerSiguienteCodigo();
      res.json({ codigo: siguienteCodigo });
    } catch (error: any) {
      console.error('[ArticuloController] Error en obtenerSiguienteCodigo:', error);
      res.status(500).json({ message: error.message || 'Error al calcular el siguiente código de artículo.' });
    }
  }
}

