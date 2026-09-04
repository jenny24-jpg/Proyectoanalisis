import { Router } from 'express';
import cotizacionRoutes from './cotizacion.routes.js';

const router = Router();

// Rutas de cotizaciones
router.use('/cotizaciones', cotizacionRoutes);

export default router;
