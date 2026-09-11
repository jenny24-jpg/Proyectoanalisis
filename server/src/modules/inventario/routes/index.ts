// server/src/modules/inventario/routes/index.ts
import { Router } from 'express';
import articuloRoutes from './articulo.routes.js';
import movimientoInventarioRoutes from './movimientoInventario.routes.js';
import tomaFisicaRoutes from './tomaFisica.routes.js';
import categoriaRoutes from './categoria.routes.js';
import marcaRoutes from './marca.routes.js';
import unidadMedidaRoutes from './unidadMedida.routes.js';
import bodegaRoutes from './bodega.routes.js';
import ubicacionRoutes from './ubicacion.routes.js';
import loteRoutes from './lote.routes.js';
import tipoMovimientoRoutes from './tipoMovimiento.routes.js';

const router = Router();

// Rutas del módulo de inventario
router.use('/articulos', articuloRoutes);
router.use('/movimientos', movimientoInventarioRoutes);
router.use('/toma-fisica', tomaFisicaRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/marcas', marcaRoutes);
router.use('/unidades-medida', unidadMedidaRoutes);
router.use('/bodegas', bodegaRoutes);
router.use('/ubicaciones', ubicacionRoutes);
router.use('/lotes', loteRoutes);
router.use('/tipos-movimiento', tipoMovimientoRoutes);

export default router;
