import { Router } from 'express';
import cotizacionRoutes from './cotizacion.routes.js';
import solicitudCompraRoutes from './solicitudCompra.routes.js';
import proveedorRoutes from './proveedor.routes.js';
import estadoRoutes from './estado.routes.js';
import unidadMedidaRoutes from '../../inventario/routes/unidadMedida.routes.js';

const router = Router();

// Rutas de cotizaciones, solicitudes, proveedores, estados y unidades de medida
router.use('/cotizaciones', cotizacionRoutes);
router.use('/solicitudes', solicitudCompraRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/estados', estadoRoutes);
router.use('/unidades-medida', unidadMedidaRoutes);

export default router;

