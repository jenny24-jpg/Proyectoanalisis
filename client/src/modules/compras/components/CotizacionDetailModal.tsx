import React from 'react';
import { X, FileText, Download, FileSpreadsheet } from 'lucide-react';
import { Button, StatusBadge } from '../../../components/ui';
import { ICotizacion } from '@erp/contracts';

export interface CotizacionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: ICotizacion | null;
}

export const CotizacionDetailModal: React.FC<CotizacionDetailModalProps> = ({
  isOpen,
  onClose,
  cotizacion,
}) => {
  if (!isOpen || !cotizacion) return null;

  const hasPdf = Boolean(cotizacion.cotArchivoPdf);
  let pdfDataUrl: string | null = null;
  if (hasPdf && typeof cotizacion.cotArchivoPdf === 'string') {
    pdfDataUrl = cotizacion.cotArchivoPdf.startsWith('data:application/pdf')
      ? cotizacion.cotArchivoPdf
      : `data:application/pdf;base64,${cotizacion.cotArchivoPdf}`;
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Cotización #{cotizacion.cotIdCotizacion}
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
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Proveedor ID</span>
              <span className="text-base font-bold text-slate-800">#{cotizacion.cotIdProveedor}</span>
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
                {cotizacion.cotEsExcepcionUnico ? 'Sí' : 'No'}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 text-xs font-medium block">Tiempo de Entrega Estimado</span>
              <span className="text-slate-800 font-semibold mt-0.5 block">
                {cotizacion.cotTiempoEntregaDias ? `${cotizacion.cotTiempoEntregaDias} días hábiles` : 'No especificado'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-slate-400 text-xs font-medium block">Condición de Pago</span>
              <span className="text-slate-800 font-semibold mt-0.5 block">
                {cotizacion.cotCondicionPagoDias ? `${cotizacion.cotCondicionPagoDias} días de crédito` : 'Contado'}
              </span>
            </div>
          </div>

          {/* PDF Preview Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Documento Adjunto (PDF)</h4>
            {pdfDataUrl ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900">
                <div className="p-3 bg-slate-800 text-slate-200 flex items-center justify-between text-xs border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" />
                    <span className="font-semibold">Archivo PDF Almacenado en Oracle BD</span>
                  </div>
                  <a
                    href={pdfDataUrl}
                    download={`cotizacion_${cotizacion.cotIdCotizacion}.pdf`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors"
                  >
                    <Download size={14} /> Descargar PDF
                  </a>
                </div>
                <iframe
                  src={pdfDataUrl}
                  title={`Cotizacion PDF #${cotizacion.cotIdCotizacion}`}
                  className="w-full h-72 border-none"
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
          <Button variant="secondary" onClick={onClose}>
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </div>
  );
};
