import { Router } from 'express';
import cotizacionRoutes from './cotizacion.routes.js';
import solicitudCompraRoutes from './solicitudCompra.routes.js';
import ordenCompraRoutes from './ordenCompra.routes.js';
import recepcionBodegaRoutes from './recepcionBodega.routes.js';
import proveedorRoutes from './proveedor.routes.js';
import estadoRoutes from './estado.routes.js';
import unidadMedidaRoutes from '../../inventario/routes/unidadMedida.routes.js';
import threeWayMatchRoutes from './threeWayMatch.routes.js';
import guiaSistemaRoutes from './guiaSistema.routes.js';

const router = Router();

// Rutas de cotizaciones, solicitudes, órdenes de compra, recepciones, 3-way match, guías del sistema, proveedores, estados y unidades de medida
router.use('/cotizaciones', cotizacionRoutes);
router.use('/solicitudes', solicitudCompraRoutes);
router.use('/ordenes-compra', ordenCompraRoutes);
router.use('/recepciones', recepcionBodegaRoutes);
router.use('/3-way-match', threeWayMatchRoutes);
router.use('/facturas-cxp', threeWayMatchRoutes);
router.use('/guias', guiaSistemaRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/estados', estadoRoutes);
router.use('/unidades-medida', unidadMedidaRoutes);

export default router;

