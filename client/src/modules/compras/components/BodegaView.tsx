import React from 'react';
import { ArrowLeft, Box, CheckCircle2, Clock, PackageCheck, Truck, Warehouse } from 'lucide-react';
import { Button } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';

export interface BodegaViewProps {
  solicitud: SolicitudOriginalInfo;
  onBack: () => void;
}

export const BodegaView: React.FC<BodegaViewProps> = ({ solicitud, onBack }) => {
  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn min-w-0">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
            Volver a Registros
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full">
            Etapa 5 de 6
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Bodega / Recepción de Mercancía
          </h1>
        </div>
      </div>

      {/* Solicitud Info Card */}
      <SolicitudOriginalCard solicitud={solicitud} />

      {/* En Desarrollo Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Warehouse size={36} />
        </div>

        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Clock size={14} className="animate-spin" />
            Módulo en desarrollo
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Recepción en Almacén e Inventario
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Esta vista gestionará el ingreso físico de los artículos amparados bajo la Orden de Compra, registro de guía de remisión del transporte, inspección de calidad y asignación de ubicaciones de bodega.
          </p>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4 text-left">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Truck size={18} className="text-cyan-600" />
              Guía de Despacho
            </div>
            <p className="text-xs text-slate-500">
              Captura de guía de remisión del transportista, transportista y fecha/hora de llegada.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <PackageCheck size={18} className="text-emerald-600" />
              Inspección de Calidad
            </div>
            <p className="text-xs text-slate-500">
              Conteo físico, verificación de empaques y aceptación total o parcial de cantidades.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Box size={18} className="text-blue-600" />
              Kardex & Lotes
            </div>
            <p className="text-xs text-slate-500">
              Ingreso automático a CMP_INVENTARIO y asignación de estantería o lote de almacén.
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
