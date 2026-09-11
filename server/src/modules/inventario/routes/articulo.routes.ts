// server/src/modules/inventario/routes/articulo.routes.ts
import { Router } from 'express';
import { ArticuloController } from '../controllers/articulo.controller.js';

const router = Router();

// Endpoint para listar todos los artículos
router.get('/', ArticuloController.obtenerTodos);

// Endpoint para actualizar la descripción (nota que recibe el código en la URL)
router.put('/:codigo/descripcion', ArticuloController.actualizarDescripcion);

// Endpoint para eliminar lógicamente
router.delete('/:codigo', ArticuloController.eliminar);

// Endpoint para crear un artículo
router.post('/', ArticuloController.crear);


export default router;
