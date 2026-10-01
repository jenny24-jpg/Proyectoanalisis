import {
  IFacturaCxP,
  IThreeWayMatchData,
  ILiquidarThreeWayMatchDTO,
  IFacturaFilterParams,
} from '@erp/contracts';
import { ThreeWayMatchRepository } from '../repositories/threeWayMatch.repository.js';

export class ThreeWayMatchService {
  static async obtenerFacturas(filters: IFacturaFilterParams = {}): Promise<IFacturaCxP[]> {
    return await ThreeWayMatchRepository.findAllFacturas(filters);
  }

  static async obtenerFacturaPorNo(noFactura: string): Promise<IFacturaCxP | null> {
    return await ThreeWayMatchRepository.findFacturaByNoFactura(noFactura);
  }

  static async obtenerDatosThreeWayMatch(noDocOrPo: string): Promise<IThreeWayMatchData> {
    return await ThreeWayMatchRepository.getThreeWayMatchData(noDocOrPo);
  }

  static async liquidarThreeWayMatch(dto: ILiquidarThreeWayMatchDTO): Promise<IThreeWayMatchData> {
    if (!dto.noPo || !dto.noRecepcion || !dto.noFactura || !dto.idProveedor) {
      throw new Error('Datos incompletos para liquidar el 3-Way Match (se requiere PO, Recepción, Factura y Proveedor).');
    }

    if (Number(dto.totalFactura) <= 0) {
      throw new Error('El monto total de la factura debe ser mayor a Q 0.00');
    }

    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        if (item.cantidadFacturada !== undefined && item.cantidadFacturada !== null) {
          const cant = Number(item.cantidadFacturada);
          if (!Number.isInteger(cant) || cant < 0) {
            throw new Error(`La cantidad facturada (${item.cantidadFacturada}) debe ser un número entero mayor o igual a 0.`);
          }
          item.cantidadFacturada = cant;
        }
      }
    }

    return await ThreeWayMatchRepository.liquidar(dto);
  }
}
