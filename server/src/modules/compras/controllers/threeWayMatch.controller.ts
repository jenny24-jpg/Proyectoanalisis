import { Request, Response } from 'express';
import { ThreeWayMatchService } from '../services/threeWayMatch.service.js';

export class ThreeWayMatchController {
  static async listarFacturas(req: Request, res: Response): Promise<void> {
    try {
      const { noFactura, noPo, noRecepcion, idProveedor, idEstado } = req.query;

      const filters = {
        noFactura: noFactura ? String(noFactura) : undefined,
        noPo: noPo ? String(noPo) : undefined,
        noRecepcion: noRecepcion ? String(noRecepcion) : undefined,
        idProveedor: idProveedor ? Number(idProveedor) : undefined,
        idEstado: idEstado ? Number(idEstado) : undefined,
      };

      const facturas = await ThreeWayMatchService.obtenerFacturas(filters);
      res.status(200).json({
        success: true,
        data: facturas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener las facturas de compras',
        error: error.message,
      });
    }
  }

  static async obtenerFacturaPorNo(req: Request, res: Response): Promise<void> {
    try {
      const noFactura = req.params.noFactura;
      const factura = await ThreeWayMatchService.obtenerFacturaPorNo(noFactura);

      if (!factura) {
        res.status(404).json({
          success: false,
          message: `No se encontró la factura ${noFactura}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: factura,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Error al obtener la factura',
        error: error.message,
      });
    }
  }

  static async obtenerDatosThreeWayMatch(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id; // Puede ser número de solicitud (SOL-...) o número de PO (PO-...)
      const matchData = await ThreeWayMatchService.obtenerDatosThreeWayMatch(id);

      res.status(200).json({
        success: true,
        data: matchData,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener los datos de 3-Way Match',
        error: error.message,
      });
    }
  }

  static async liquidar(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const resultado = await ThreeWayMatchService.liquidarThreeWayMatch(payload);

      res.status(201).json({
        success: true,
        message: `3-Way Match liquidado con éxito. Factura ${payload.noFactura} autorizada para pago en CxP.`,
        data: resultado,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al procesar la liquidación de 3-Way Match',
        error: error.message,
      });
    }
  }
}
