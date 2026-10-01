import {
  IThreeWayMatchData,
  ILiquidarThreeWayMatchDTO,
  IFacturaCxP,
  IFacturaFilterParams,
} from '@erp/contracts';

const API_BASE_URL = '/api/compras/3-way-match';

export class ThreeWayMatchClientService {
  /**
   * Obtiene la estructura integral de 3-Way Match cruzando Solicitud, Cotización Adjudicada,
   * Orden de Compra, Recepción en Bodega y Factura CXP con comparativa y cálculo de tolerancia.
   */
  static async getThreeWayMatchData(noDocOrPo: string): Promise<IThreeWayMatchData> {
    const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(noDocOrPo)}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Error al obtener datos de 3-Way Match para ${noDocOrPo}`);
    }
    const json = await response.json();
    return json.data;
  }

  /**
   * Procesa la liquidación y aprobación formal del 3-Way Match registrando la Factura
   * en CMP_FACTURA_CXP y finalizando la etapa 6/6 de Compras.
   */
  static async liquidar(dto: ILiquidarThreeWayMatchDTO): Promise<IThreeWayMatchData> {
    const response = await fetch(`${API_BASE_URL}/liquidar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al liquidar el 3-Way Match.');
    }

    const json = await response.json();
    return json.data;
  }

  /**
   * Consulta el listado de facturas CXP registradas
   */
  static async getFacturas(params: IFacturaFilterParams = {}): Promise<IFacturaCxP[]> {
    const searchParams = new URLSearchParams();
    if (params.noFactura) searchParams.append('noFactura', params.noFactura);
    if (params.noPo) searchParams.append('noPo', params.noPo);
    if (params.noRecepcion) searchParams.append('noRecepcion', params.noRecepcion);
    if (params.idProveedor) searchParams.append('idProveedor', String(params.idProveedor));
    if (params.idEstado) searchParams.append('idEstado', String(params.idEstado));

    const response = await fetch(`${API_BASE_URL}/facturas?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Error al obtener el listado de facturas CXP');
    }
    const json = await response.json();
    return json.data || [];
  }

  /**
   * Obtiene una factura específica por su número
   */
  static async getFacturaPorNo(noFactura: string): Promise<IFacturaCxP | null> {
    const response = await fetch(`${API_BASE_URL}/facturas/${encodeURIComponent(noFactura)}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Error al consultar la factura ${noFactura}`);
    }
    const json = await response.json();
    return json.data;
  }
}
