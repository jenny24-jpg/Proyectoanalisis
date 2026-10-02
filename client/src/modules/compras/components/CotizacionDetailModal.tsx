import React, { useState, useEffect } from 'react';
import { X, FileText, Download, FileSpreadsheet, ExternalLink, Package, Repeat, Ban, Eye, Loader2 } from 'lucide-react';
import { Button, StatusBadge } from '../../../components/ui';
import { ICotizacion } from '@erp/contracts';
import { formatCurrency } from '../../../utils/formatters';
import { CotizacionClientService } from '../services/cotizacionClientService';

export interface CotizacionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: ICotizacion | null;
}

export const CotizacionDetailModal: React.FC<CotizacionDetailModalProps> = ({
  isOpen,
  onClose,
  cotizacion: initialCotizacion,
}) => {
  const [fullCotizacion, setFullCotizacion] = useState<ICotizacion | null>(initialCotizacion);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    setFullCotizacion(initialCotizacion);

    if (isOpen && initialCotizacion?.cotIdCotizacion) {
      // Si no tiene detalles o vienen vacíos, cargar la ficha completa
      if (!initialCotizacion.detalles || initialCotizacion.detalles.length === 0) {
        setIsLoadingDetails(true);
        CotizacionClientService.getCotizacionById(initialCotizacion.cotIdCotizacion)
          .then((data) => {
            if (data) {
              setFullCotizacion(data);
            }
          })
          .catch((err) => {
            console.warn('[CotizacionDetailModal]: No se pudieron recargar los detalles:', err);
          })
          .finally(() => {
            setIsLoadingDetails(false);
          });
      }
    }
  }, [isOpen, initialCotizacion]);

  if (!isOpen || !initialCotizacion) return null;

  const cotizacion = fullCotizacion || initialCotizacion;
  const pdfValue = cotizacion.cotRutaArchivoPdf || cotizacion.cotArchivoPdf;
  const hasPdf = Boolean(pdfValue);
  
  // Endpoint absoluto del backend que siempre retorna Content-Type: application/pdf con el buffer binario
  const pdfApiUrl = cotizacion.cotIdCotizacion 
    ? `/api/compras/cotizaciones/${cotizacion.cotIdCotizacion}/pdf`
    : null;

  const detalles = cotizacion.detalles || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Cotización #{cotizacion.cotIdCotizacion} - {cotizacion.cotNombreProveedor || `Proveedor #${cotizacion.cotIdProveedor}`}
              </h2>
              <p className="text-xs text-slate-500">
                Solicitud de compra: <span className="font-semibold text-slate-800">{cotizacion.cotNoDocumentoSolicitud}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Monto Total</span>
              <span className="text-lg font-extrabold text-slate-900">{formatCurrency(cotizacion.cotPrecioTotal)}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Proveedor ID / NIT</span>
              <span className="text-base font-bold text-slate-800">
                {cotizacion.cotNitProveedor ? `NIT ${cotizacion.cotNitProveedor}` : `#${cotizacion.cotIdProveedor}`}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Estado Adjudicación</span>
              <div className="mt-1">
                <StatusBadge status={cotizacion.cotEstadoAdjudicacion || 'PENDIENTE'} />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Excepción Única</span>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cotizacion.cotEsExcepcionUnico ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600'}`}>
                {cotizacion.cotEsExcepcionUnico ? 'Sí (Excepción)' : 'No'}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 text-xs font-medium block">Tiempo de Entrega Estimado</span>
              <span className="text-slate-800 font-semibold mt-0.5 block">
                {cotizacion.cotTiempoEntregaDias ? `${cotizacion.cotTiempoEntregaDias} días hábiles` : 'Inmediata'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 text-xs font-medium block">Condición de Pago</span>
              <span className="text-slate-800 font-semibold mt-0.5 block">
                {cotizacion.cotCondicionPagoDias ? `${cotizacion.cotCondicionPagoDias} días de crédito` : 'Contado'}
              </span>
            </div>
          </div>

          {/* Line items section (CMP_DETALLE_COTIZACION) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package size={14} className="text-blue-600" />
                Desglose de Artículos Cotizados ({detalles.length})
              </span>
              {isLoadingDetails && (
                <span className="text-[11px] text-blue-600 font-normal flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Cargando artículos...
                </span>
              )}
            </h4>

            {isLoadingDetails ? (
              <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center text-slate-400 space-y-2">
                <Loader2 size={24} className="animate-spin mx-auto text-blue-600" />
                <p className="text-xs">Cargando desglose de artículos de la base de datos...</p>
              </div>
            ) : detalles.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Artículo / Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detalles.map((d, dIdx) => {
                      const isSust = Boolean(d.dcoEsSustituto);
                      const isSinStock = Number(d.dcoCantidadCotizada) === 0 || Number(d.dcoSubtotalLinea) === 0;

                      return (
                        <tr key={dIdx} className={`hover:bg-slate-50/50 ${isSinStock ? 'bg-slate-50/70 opacity-70' : ''}`}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{d.artDescripcion || d.dcoCodigoArticulo}</div>
                            <div className="text-[10px] font-mono text-slate-400">Cód: {d.dcoCodigoArticulo}</div>
                            {isSust && (
                              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Repeat size={9} /> Producto Sustituto Propuesto
                              </div>
                            )}
                            {isSinStock && (
                              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 ml-1">
                                <Ban size={9} /> Sin Stock / No Disponible
                              </div>
                            )}
                            {d.dcoObservaciones && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">{d.dcoObservaciones}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                            {d.dcoCantidadCotizada}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatCurrency(d.dcoPrecioUnitario)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(d.dcoSubtotalLinea)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right text-slate-600 text-[11px] uppercase">
                        Total Suma de Artículos:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 text-xs">
                        {formatCurrency(
                          detalles.reduce((acc, curr) => acc + Number(curr.dcoSubtotalLinea || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 bg-slate-50/50">
                <Package size={28} className="mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-medium text-slate-600">No se registraron líneas de desglose específicas para esta cotización.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">La propuesta se registró por monto global de {formatCurrency(cotizacion.cotPrecioTotal)}.</p>
              </div>
            )}
          </div>

          {/* PDF Preview Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Documento Adjunto (PDF)</h4>
            {hasPdf && pdfApiUrl ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                <div className="p-3 bg-slate-800 text-slate-200 flex items-center justify-between text-xs border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" />
                    <span className="font-semibold">
                      {cotizacion.cotRutaArchivoPdf || `cotizacion_${cotizacion.cotIdCotizacion}.pdf`} (Archivo Digital)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={pdfApiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold text-xs transition-colors"
                    >
                      <ExternalLink size={13} /> Abrir Pestaña
                    </a>
                    <a
                      href={pdfApiUrl}
                      download={`cotizacion_${cotizacion.cotIdCotizacion}.pdf`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      <Download size={13} /> Descargar PDF
                    </a>
                  </div>
                </div>
                <iframe
                  src={pdfApiUrl}
                  title={`Cotizacion PDF #${cotizacion.cotIdCotizacion}`}
                  className="w-full h-80 border-none bg-white"
                />
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 bg-slate-50/50">
                <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">No se ha adjuntado un archivo PDF para esta cotización.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end">
          <Button variant="secondary" icon={X} onClick={onClose}>
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </div>
  );
};
