import React from 'react';
import { ArrowLeft, Clock, DollarSign, FileCheck, Layers, PieChart } from 'lucide-react';
import { Button } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';

export interface PresupuestoViewProps {
  solicitud: SolicitudOriginalInfo;
  onBack: () => void;
}

export const PresupuestoView: React.FC<PresupuestoViewProps> = ({ solicitud, onBack }) => {
  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn min-w-0">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
            Volver a Registros
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
            Etapa 4 de 6
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Presupuesto y Generación de OD
          </h1>
        </div>
      </div>

      {/* Solicitud Info Card */}
      <SolicitudOriginalCard solicitud={solicitud} />

      {/* En Desarrollo Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <FileCheck size={36} />
        </div>

        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Clock size={14} className="animate-spin" />
            Módulo en desarrollo
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Compromiso Presupuestario y Emisión de PO
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            En esta fase se verifica el saldo disponible en la partida presupuestaria del centro de costo solicitante y se genera formalmente la Orden de Compra (PO) vinculada al proveedor seleccionado.
          </p>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4 text-left">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <PieChart size={18} className="text-purple-600" />
              Validación de Techo
            </div>
            <p className="text-xs text-slate-500">
              Comprobación de partida presupuestaria activa en contabilidad y fondos disponibles.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <DollarSign size={18} className="text-emerald-600" />
              Compromiso de Fondos
            </div>
            <p className="text-xs text-slate-500">
              Reserva de saldo contable antes del despacho para garantizar la disponibilidad financiera.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Layers size={18} className="text-blue-600" />
              Generación de PO (CMP_ORDEN_COMPRA)
            </div>
            <p className="text-xs text-slate-500">
              Creación del número de documento oficial PO y exportación en PDF con firma autorizada.
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
