import { Router } from 'express';
import cotizacionRoutes from './cotizacion.routes.js';
import solicitudCompraRoutes from './solicitudCompra.routes.js';

const router = Router();

// Rutas de cotizaciones y solicitudes
router.use('/cotizaciones', cotizacionRoutes);
router.use('/solicitudes', solicitudCompraRoutes);

export default router;

