import React from 'react';
import { ArrowLeft, CheckCheck, Clock, FileSpreadsheet, Receipt, ShieldCheck, Warehouse } from 'lucide-react';
import { Button } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';

export interface ThreeWayMatchViewProps {
  solicitud: SolicitudOriginalInfo;
  onBack: () => void;
}

export const ThreeWayMatchView: React.FC<ThreeWayMatchViewProps> = ({ solicitud, onBack }) => {
  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn min-w-0">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
            Volver a Registros
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            Etapa 6 de 6
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            3-Way Match (Conciliación Tripartita)
          </h1>
        </div>
      </div>

      {/* Solicitud Info Card */}
      <SolicitudOriginalCard solicitud={solicitud} />

      {/* En Desarrollo Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck size={36} />
        </div>

        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Clock size={14} className="animate-spin" />
            Módulo en desarrollo
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Cotejo Automático: PO vs. Bodega vs. Factura
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Esta fase realiza la conciliación automática entre la Orden de Compra autorizada, la Recepción física confirmada en Bodega y la Factura emitida por el proveedor para liberar la cuenta por pagar en CXP sin discrepancias.
          </p>
        </div>

        {/* 3 Pillars Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4 text-left">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <FileSpreadsheet size={18} className="text-blue-600" />
              1. Orden de Compra (PO)
            </div>
            <p className="text-xs text-slate-500">
              Cantidades, precios unitarios y condiciones negociadas en la cotización.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Warehouse size={18} className="text-cyan-600" />
              2. Recepción Bodega (GRN)
            </div>
            <p className="text-xs text-slate-500">
              Unidades físicas recibidas, inspeccionadas e inventariadas en almacén.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Receipt size={18} className="text-emerald-600" />
              3. Factura CXP
            </div>
            <p className="text-xs text-slate-500">
              Número de DTE/Factura, serie, retenciones fiscales y monto total exigido.
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl max-w-2xl mx-auto text-xs text-emerald-800 font-medium flex items-center justify-center gap-2">
          <CheckCheck size={18} className="text-emerald-600" />
          <span>Tolerancia de variación máxima permitida: ±0.00% en montos y cantidades.</span>
        </div>

        <div className="pt-2">
          <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>
            Regresar a la Tabla de Solicitudes
          </Button>
        </div>
      </div>
    </div>
  );
};
