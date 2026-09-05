import React from 'react';
import { StatusBadge } from '../../../components/ui';

export interface SolicitudOriginalInfo {
  noDocumento: string;
  fecha: string;
  entidad: string;
  departamento: string;
  responsable: string;
  montoTotal: number;
  estado: string;
}

export interface SolicitudOriginalCardProps {
  solicitud: SolicitudOriginalInfo;
}

export const SolicitudOriginalCard: React.FC<SolicitudOriginalCardProps> = ({ solicitud }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header section with blue bar indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            Solicitud Original
          </h3>
          <StatusBadge status={solicitud.estado || 'Aprobado'} size="sm" />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center text-xs">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
            No. Documento
          </span>
          <span className="font-bold text-slate-900 mt-0.5 block">{solicitud.noDocumento}</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
            Fecha
          </span>
          <span className="font-medium text-slate-700 mt-0.5 block">{solicitud.fecha}</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
            Entidad
          </span>
          <span className="font-medium text-slate-700 mt-0.5 block truncate" title={solicitud.entidad}>
            {solicitud.entidad}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
            Departamento
          </span>
          <span className="font-medium text-slate-700 mt-0.5 block">{solicitud.departamento}</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
            Responsable
          </span>
          <span className="font-medium text-slate-700 mt-0.5 block">{solicitud.responsable}</span>
        </div>

        <div className="text-left lg:text-right">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
            Monto Total
          </span>
          <span className="text-base font-extrabold text-blue-600 mt-0.5 block">
            {formatCurrency(solicitud.montoTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
