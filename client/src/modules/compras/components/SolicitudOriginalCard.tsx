import React, { useState, useEffect } from 'react';
import { Package, ChevronDown, ChevronUp, Layers, Hash } from 'lucide-react';
import { StatusBadge } from '../../../components/ui';
import { ISolicitudCompraDetalle } from '@erp/contracts';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';

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
  detalles?: ISolicitudCompraDetalle[];
}

export const SolicitudOriginalCard: React.FC<SolicitudOriginalCardProps> = ({
  solicitud,
  detalles: initialDetalles,
}) => {
  const [detalles, setDetalles] = useState<ISolicitudCompraDetalle[]>(initialDetalles || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialDetalles);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (initialDetalles !== undefined) {
      setDetalles(initialDetalles);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    if (solicitud?.noDocumento) {
      setIsLoading(true);
      SolicitudCompraClientService.getDetalles(solicitud.noDocumento)
        .then((data) => {
          if (isMounted) {
            setDetalles(data);
          }
        })
        .catch((err) => {
          console.warn('[SolicitudOriginalCard]: Error al cargar detalles de la solicitud:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [solicitud?.noDocumento, initialDetalles]);

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
          <span className="font-bold text-slate-900 mt-0.5 block font-mono">{solicitud.noDocumento}</span>
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
          <span className="text-base font-extrabold text-blue-600 mt-0.5 block font-mono">
            {formatCurrency(solicitud.montoTotal)}
          </span>
        </div>
      </div>

      {/* Mini-resumen de Ítems de la Solicitud (CMP_DETALLE_SOLICITUD) */}
      <div className="pt-2 border-t border-slate-100">
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 overflow-hidden">
          {/* Subheader bar */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Package size={15} className="text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 tracking-wide">
                Detalle de Artículos Requeridos
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.2 bg-blue-100/70 text-blue-700 rounded-full border border-blue-200">
                {detalles.length} {detalles.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs">
              <span className="text-[11px] font-medium hidden sm:inline">
                {isExpanded ? 'Ocultar' : 'Ver detalle'}
              </span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          {/* Table content */}
          {isExpanded && (
            <div className="px-4 pb-3 pt-1 border-t border-slate-200/60">
              {isLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  Cargando desglose de artículos...
                </div>
              ) : detalles.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400 italic">
                  No se encontraron artículos registrados en esta solicitud.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2 pr-3 font-semibold">Código</th>
                        <th className="py-2 px-3 font-semibold">Descripción del Artículo</th>
                        <th className="py-2 px-3 font-semibold text-center">Unidad</th>
                        <th className="py-2 px-3 font-semibold text-right">Cant. Solicitada</th>
                        <th className="py-2 pl-3 font-semibold text-right">Cant. Aprobada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detalles.map((det, idx) => {
                        const unidad = det.umeAbreviatura || det.umeNombreUnidad || 'UNID';
                        const cantPedida = Number(det.dsoCantidadPedida || 0);
                        const cantAprobada = Number(det.dsoCantidadAprobada || det.dsoCantidadPedida || 0);

                        return (
                          <tr key={det.dsoIdDetalleSolicitud || idx} className="hover:bg-white/60 transition-colors">
                            <td className="py-2 pr-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200/60">
                                <Hash size={11} className="text-blue-500" />
                                {det.dsoCodigoArticulo}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-800 font-medium max-w-xs sm:max-w-md truncate" title={det.artDescripcion || det.dsoCodigoArticulo}>
                              {det.artDescripcion || det.dsoCodigoArticulo}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500 whitespace-nowrap font-medium">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                                {unidad}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                              {cantPedida}
                            </td>
                            <td className="py-2 pl-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              <span className={cantAprobada !== cantPedida ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : ''}>
                                {cantAprobada}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

