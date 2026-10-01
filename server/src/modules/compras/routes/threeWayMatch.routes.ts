import { Router } from 'express';
import { ThreeWayMatchController } from '../controllers/threeWayMatch.controller.js';

const router = Router();

// GET /api/compras/3-way-match/facturas
router.get('/facturas', ThreeWayMatchController.listarFacturas);

// GET /api/compras/3-way-match/facturas/:noFactura
router.get('/facturas/:noFactura', ThreeWayMatchController.obtenerFacturaPorNo);

// GET /api/compras/3-way-match/:id (id = noDocumentoSolicitud o noPo)
router.get('/:id', ThreeWayMatchController.obtenerDatosThreeWayMatch);

// POST /api/compras/3-way-match/liquidar
router.post('/liquidar', ThreeWayMatchController.liquidar);

export default router;
