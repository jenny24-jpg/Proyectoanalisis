import React from 'react';
import { ArrowLeft, Award, CheckCircle2, Clock, FileSpreadsheet, Scale, TrendingDown } from 'lucide-react';
import { Button } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';

export interface SeleccionCotizacionViewProps {
  solicitud: SolicitudOriginalInfo;
  onBack: () => void;
}

export const SeleccionCotizacionView: React.FC<SeleccionCotizacionViewProps> = ({ solicitud, onBack }) => {
  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn min-w-0">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
            Volver a Registros
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            Etapa 3 de 6
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Selección de Cotización
          </h1>
        </div>
      </div>

      {/* Solicitud Info Card */}
      <SolicitudOriginalCard solicitud={solicitud} />

      {/* En Desarrollo Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Award size={36} />
        </div>

        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Clock size={14} className="animate-spin" />
            Módulo en desarrollo
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Cuadro Comparativo y Adjudicación
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Esta vista facilitará la comparación técnica, tiempos de entrega y condiciones de pago entre los proveedores cotizados para la solicitud <span className="font-semibold text-slate-800">{solicitud.noDocumento}</span> y la selección de la oferta ganadora.
          </p>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4 text-left">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Scale size={18} className="text-amber-600" />
              Matriz Comparativa 360°
            </div>
            <p className="text-xs text-slate-500">
              Ponderación automática de costo total, garantía y tiempos de entrega ofertados.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <TrendingDown size={18} className="text-emerald-600" />
              Ahorro Estimado (Savings)
            </div>
            <p className="text-xs text-slate-500">
              Cálculo del diferencial de ahorro respecto al monto presupuestado inicial.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <CheckCircle2 size={18} className="text-blue-600" />
              Dictamen de Adjudicación
            </div>
            <p className="text-xs text-slate-500">
              Justificación de la selección y bloqueo de cotizaciones no elegidas para auditoría.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>
            Regresar a la Tabla de Solicitudes
          </Button>
        </div>
      </div>
    </div>
  );
};
