import React from 'react';
import { CheckCircle2, RotateCcw, Ban } from 'lucide-react';
import {
  PIPELINE_STAGES,
  PipelineStageId,
  getStageIndexForStatus,
  getStageForSolicitud,
} from './PipelineProgress';
import { ISolicitudCompra } from '@erp/contracts';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PipelineOverviewProps {
  /** Lista de registros de compras (ISolicitudCompra o cualquier objeto con solNombreEstado/estado) */
  registros: (ISolicitudCompra | { solNombreEstado?: string | null; estado?: string | null; [key: string]: any })[];
  title?: string;
  subtitle?: string;
  /** Callback al hacer clic en una etapa. Recibe la clave de la etapa o 'TODAS'. */
  onStageClick?: (stageKey: PipelineStageId | 'TODAS') => void;
  /** Etapa actualmente activa como filtro — resalta el nodo en la barra. */
  activeStage?: string | null;
  className?: string;
}

// ─── Componente PipelineOverview (6 Etapas Formales) ──────────────────────────

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({
  registros,
  title = 'Flujo de Adquisiciones',
  subtitle,
  onStageClick,
  activeStage = null,
  className = '',
}) => {
  const total = registros.length;

  // Conteo exacto de cuántos registros se ubican actualmente en cada una de las 6 etapas operativas
  const counts = PIPELINE_STAGES.map((stage) => {
    return registros.filter((r) => {
      const stageKey = getStageForSolicitud(r as ISolicitudCompra);
      return stageKey === stage.key;
    }).length;
  });

  // Conteo de solicitudes rechazadas (ciclo detenido fuera del flujo operativo regular)
  const rejectedCount = registros.filter((r) => {
    const stageKey = getStageForSolicitud(r as ISolicitudCompra);
    return stageKey === 'rechazada';
  }).length;

  const completedCount = counts[PIPELINE_STAGES.length - 1] || 0;
  const isFiltering = Boolean(activeStage && activeStage !== 'TODAS');

  return (
    <section
      className={`bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 ${className}`}
      aria-label={title}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              6 Etapas
            </span>
            {rejectedCount > 0 && (
              <button
                type="button"
                onClick={() => onStageClick && onStageClick(activeStage === 'rechazada' ? 'TODAS' : ('rechazada' as any))}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border transition-all cursor-pointer ${
                  activeStage === 'rechazada'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                }`}
                title={activeStage === 'rechazada' ? 'Quitar filtro de rechazadas' : `Filtrar ${rejectedCount} solicitud(es) rechazada(s)`}
              >
                <Ban className="w-3 h-3" />
                <span>{rejectedCount} Rechazada{rejectedCount > 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle ||
              (onStageClick
                ? 'Haz clic en cualquier etapa para filtrar los registros dinámicamente'
                : 'Distribución de registros a lo largo del ciclo de compras')}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {onStageClick && isFiltering && (
            <button
              type="button"
              onClick={() => onStageClick('TODAS')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-100"
            >
              <RotateCcw size={12} />
              <span>Limpiar filtro</span>
            </button>
          )}
          <span className="text-xs font-medium text-slate-500 tabular-nums bg-slate-100 px-2.5 py-1 rounded-md">
            {total} {total === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {/* Horizontal stepper de 6 etapas con scroll responsivo suave */}
      <div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-thin">
        <div className="flex items-start justify-between min-w-[720px] w-full px-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isLast = idx === PIPELINE_STAGES.length - 1;
            const count = counts[idx];
            const hasItems = count > 0;
            const clickable = Boolean(onStageClick);
            const isSelected = activeStage === stage.key;

            return (
              <div
                key={stage.key}
                className="flex-1 min-w-[120px] flex-shrink-0 flex flex-col items-center relative px-1"
              >
                {/* Línea conectora entre nodos */}
                {!isLast && (
                  <span
                    className={`absolute top-5 left-1/2 w-full h-0.5 transition-colors ${
                      hasItems ? 'bg-blue-200' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                )}

                {/* Botón nodo interactivo */}
                <button
                  type="button"
                  onClick={() => {
                    if (clickable && onStageClick) {
                      onStageClick(isSelected ? 'TODAS' : stage.key);
                    }
                  }}
                  disabled={!clickable}
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    isSelected
                      ? `${stage.iconWrap} ${stage.iconActive} ring-4 ring-blue-500/30 border-2 border-blue-600 shadow-md scale-105`
                      : hasItems
                      ? `${stage.iconWrap} ${stage.iconActive} border border-slate-200 hover:scale-105 shadow-sm`
                      : 'bg-slate-50 text-slate-300 border border-slate-200'
                  } ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : 'cursor-default'}`}
                  title={
                    clickable
                      ? `${isSelected ? 'Quitar filtro de' : 'Filtrar por'} ${stage.label} (${count} registros)`
                      : `${stage.label}: ${count} ${count === 1 ? 'registro' : 'registros'}`
                  }
                >
                  {stage.icon}

                  {/* Badge con el conteo numérico de la etapa */}
                  {hasItems && (
                    <span
                      className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold tabular-nums shadow-sm ${
                        isSelected ? 'bg-blue-600 ring-2 ring-white' : 'bg-slate-800'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>

                {/* Etiqueta y paso sin saltos de línea extraños */}
                <span
                  className={`mt-2 text-xs font-semibold text-center whitespace-nowrap leading-tight transition-colors ${
                    isSelected
                      ? 'text-blue-700 font-bold'
                      : hasItems
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
                <span
                  className={`mt-0.5 text-[11px] tabular-nums font-medium whitespace-nowrap ${
                    isSelected ? 'text-blue-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {count} {count === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="tabular-nums font-bold text-slate-800">{completedCount}</span>
          <span>de</span>
          <span className="tabular-nums font-bold text-slate-800">{total}</span>
          <span>registros han completado la etapa 6 (3-Way Match)</span>
          {rejectedCount > 0 && (
            <span className="text-slate-400 pl-1">
              • <strong className="text-rose-600 font-semibold">{rejectedCount}</strong> {rejectedCount === 1 ? 'solicitud rechazada' : 'solicitudes rechazadas'} (ciclo detenido)
            </span>
          )}
        </div>

        {isFiltering && (
          <div className="text-xs font-medium">
            {activeStage === 'rechazada' ? (
              <span className="text-rose-700 flex items-center gap-1">
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                Mostrando solicitudes con ciclo detenido:{' '}
                <strong className="font-bold uppercase underline">RECHAZADAS</strong>
              </span>
            ) : (
              <span className="text-blue-700">
                Mostrando registros filtrados por etapa:{' '}
                <strong className="font-bold uppercase underline">
                  {PIPELINE_STAGES.find((s) => s.key === activeStage)?.label || activeStage}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
