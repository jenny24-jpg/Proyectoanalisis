import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Barcode,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { IOrdenCompraCompleta } from '@erp/contracts';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { generarOrdenCompraPdf } from '../utils/ordenCompraPdfGenerator';

export interface OrdenCompraDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordenCompra: IOrdenCompraCompleta | null;
}

export const OrdenCompraDocumentModal: React.FC<OrdenCompraDocumentModalProps> = ({
  isOpen,
  onClose,
  ordenCompra,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !ordenCompra) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      generarOrdenCompraPdf(ordenCompra);
    } catch (err) {
      console.error('[OrdenCompraDocumentModal]: Error al generar PDF con jsPDF:', err);
      window.print();
    }
  };

  const subtotal = Number(ordenCompra.ocoSubtotal || 0);
  const iva = Number(ordenCompra.ocoMontoIva || 0);
  const total = Number(ordenCompra.ocoTotal || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fadeIn po-modal-overlay">
      {/* Container Modal */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-scaleUp max-h-[96vh] flex flex-col my-auto po-modal-container">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Orden de Compra Oficial (PO)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                  {ordenCompra.ocoNoPo}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Documento contractual formal emitido por Presupuesto y Compras
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ordenCompra.ocoIdCotizacionGanadora && (
              <a
                href={`/api/compras/cotizaciones/${ordenCompra.ocoIdCotizacionGanadora}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shadow-2xs"
              >
                <FileText size={14} className="text-blue-400" />
                Ver Cotización PDF
              </a>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 text-xs font-semibold"
            >
              Imprimir
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs text-xs font-semibold"
            >
              Descargar PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              title="Cerrar vista previa"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body (A4 Style Sheet) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/70 print:bg-white print:p-0 print:overflow-visible flex-1">
          <div
            id="po-printable-document"
            ref={printRef}
            className="bg-white rounded-xl shadow-md border border-slate-200 p-8 max-w-3xl mx-auto text-slate-800 font-sans print:shadow-none print:border-none print:p-6 print:max-w-none print:w-full space-y-6"
          >
            {/* 1. Header: Empresa y Caja de PO */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    ERP
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                      EMPRESA CORPORATIVA S.A.
                    </h1>
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      Módulo de Compras & Adquisiciones
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  NIT: 8934521-0 | PBX: +(502) 2200-0000 | Ciudad de Guatemala, Guatemala
                </p>
                <p className="text-xs text-slate-500">
                  Dirección: Calzada Principal 12-45, Zona 10, Edificio Corporativo
                </p>
              </div>

              {/* PO Box */}
              <div className="w-full sm:w-64 border-2 border-slate-900 rounded-xl p-3.5 bg-slate-50 text-right space-y-1 shrink-0 print:bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ORDEN DE COMPRA OFICIAL
                </span>
                <div className="text-xl font-mono font-black text-slate-900">
                  {ordenCompra.ocoNoPo}
                </div>
                <div className="text-xs text-slate-600 flex justify-between pt-1 border-t border-slate-200">
                  <span>Fecha Emisión:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(ordenCompra.ocoFechaEmision)}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex justify-between">
                  <span>Estado:</span>
                  <span className="font-bold text-emerald-700 uppercase">
                    {ordenCompra.estNombreEstado || 'AUTORIZADA'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Información del Proveedor y Datos de Entrega */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Proveedor */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-200 pb-1">
                  <Building2 size={14} className="text-blue-600" />
                  Datos del Proveedor Adjudicado
                </span>
                <div className="pt-0.5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Razón Social:</span>
                    <span className="font-bold text-slate-900 text-right">
                      {ordenCompra.proNombreEntidad || 'Proveedor Adjudicado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIT:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {ordenCompra.proNit || 'C/F'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Condición de Pago:</span>
                    <span className="font-semibold text-slate-800">
                      {ordenCompra.cotCondicionPagoDias
                        ? `${ordenCompra.cotCondicionPagoDias} días crédito`
                        : 'Contado / Crédito'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiempo de Entrega:</span>
                    <span className="font-semibold text-slate-800">
                      {ordenCompra.cotTiempoEntregaDias
                        ? `${ordenCompra.cotTiempoEntregaDias} días hábiles`
                        : 'Inmediata'}
                    </span>
                  </div>
                  {ordenCompra.ocoIdCotizacionGanadora && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between print:hidden">
                      <span className="text-[11px] text-slate-500 font-medium">Cotización Ganadora:</span>
                      <a
                        href={`/api/compras/cotizaciones/${ordenCompra.ocoIdCotizacionGanadora}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs inline-flex items-center gap-1 hover:underline"
                      >
                        <FileText size={12} />
                        Ver Cotización Adjunta
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Entrega y Solicitud */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-200 pb-1">
                  <Truck size={14} className="text-emerald-600" />
                  Datos de Entrega y Facturación
                </span>
                <div className="pt-0.5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Solicitud Origen:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {ordenCompra.solNoDocumento || 'SOL-ORIGINAL'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Departamento:</span>
                    <span className="font-semibold text-slate-800">
                      {ordenCompra.depNombreDepartamento || 'Departamento General'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lugar de Entrega:</span>
                    <span className="font-semibold text-slate-800">
                      Bodega Central de Almacén
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Moneda Oficial:</span>
                    <span className="font-semibold text-slate-800">
                      Quetzales (GTQ - Q)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Tabla de Artículos Solicitados */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                Detalle de Artículos y Suministros Autorizados
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">CÓDIGO</th>
                      <th className="py-2.5 px-3">DESCRIPCIÓN DEL ARTÍCULO</th>
                      <th className="py-2.5 px-3 text-center">U.M.</th>
                      <th className="py-2.5 px-3 text-center">CANTIDAD</th>
                      <th className="py-2.5 px-3 text-right">PRECIO UNIT.</th>
                      <th className="py-2.5 px-3 text-right">TOTAL LÍNEA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(ordenCompra.detalles || []).map((item, idx) => (
                      <tr key={item.docIdDetallePo || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {item.docCodigoArticulo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium">
                          {item.artDescripcion || item.docCodigoArticulo}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-semibold whitespace-nowrap">
                          {item.umeNombreUnidad || 'UN'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                          {item.docCantidadPedida}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                          {formatCurrency(item.docPrecioUnitario)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(item.docTotalLinea)}
                        </td>
                      </tr>
                    ))}
                    {(!ordenCompra.detalles || ordenCompra.detalles.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400 text-xs">
                          No se encontraron líneas de detalle registradas en la orden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Resumen de Totales y Notas */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
              <div className="w-full sm:w-1/2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Condiciones Generales:</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Adjuntar copia de esta Orden de Compra y Guía de Remisión al momento de la entrega en Bodega.
                  <br />
                  2. La factura contable debe ser emitida a nombre de la empresa con el NIT correspondiente.
                </p>
              </div>

              {/* Totals Table */}
              <div className="w-full sm:w-64 space-y-1 text-xs text-right">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Subtotal Neto:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>IVA (12%):</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(iva)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-slate-900 font-bold text-sm bg-slate-50 px-2.5 rounded-lg">
                  <span>TOTAL ORDEN:</span>
                  <span className="font-mono text-emerald-700 text-base font-extrabold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Firmas de Autorización Oficiales */}
            <div className="pt-8 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-8">
                  <div className="border-b border-slate-400 h-10 w-4/5 mx-auto" />
                  <div>
                    <p className="font-bold text-slate-900">Solicitante</p>
                    <p className="text-[10px] text-slate-500">Unidad Requirente</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="border-b border-slate-400 h-10 w-4/5 mx-auto" />
                  <div>
                    <p className="font-bold text-slate-900">Gerencia / Presupuesto</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">✓ Autorizado en ERP</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="border-b border-slate-400 h-10 w-4/5 mx-auto" />
                  <div>
                    <p className="font-bold text-slate-900">Aceptación Proveedor</p>
                    <p className="text-[10px] text-slate-500">Firma y Sello</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Footer con Código y Trazabilidad */}
            <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-between">
              <span>ERP Sistema de Compras - Documento Oficial</span>
              <span className="font-mono font-semibold text-slate-500">
                REF: {ordenCompra.ocoNoPo} | SOL: {ordenCompra.solNoDocumento}
              </span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Orden de Compra registrada exitosamente en el sistema.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              icon={Printer}
              onClick={handlePrint}
              className="text-slate-700 hover:bg-slate-100 border-slate-300"
            >
              Imprimir
            </Button>
            <Button
              variant="primary"
              icon={Download}
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              Descargar PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

