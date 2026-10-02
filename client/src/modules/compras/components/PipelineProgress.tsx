import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Table2,
  Award,
  Wallet,
  Warehouse,
  ScrollText,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { ISolicitudCompra } from '@erp/contracts';

// ─── Stage definition ───────────────────────────────────────────────────────

export type PipelineStageId =
  | 'aprobacion'
  | 'matriz'
  | 'seleccion'
  | 'presupuesto'
  | 'bodega'
  | '3way'
  | 'rechazada';

export interface PipelineStage {
  key: PipelineStageId;
  label: string;
  percent: number; // overall completion percent this stage represents
  icon: React.ReactNode;
  iconWrap: string; // Tailwind bg class for the icon container
  iconActive: string; // text color when active
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    key: 'aprobacion',
    label: 'Aprobación',
    percent: 16,
    icon: <ShieldCheck className="w-4 h-4" />,
    iconWrap: 'bg-indigo-50',
    iconActive: 'text-indigo-600',
  },
  {
    key: 'matriz',
    label: 'Matriz',
    percent: 33,
    icon: <Table2 className="w-4 h-4" />,
    iconWrap: 'bg-blue-50',
    iconActive: 'text-blue-600',
  },
  {
    key: 'seleccion',
    label: 'Selección',
    percent: 50,
    icon: <Award className="w-4 h-4" />,
    iconWrap: 'bg-emerald-50',
    iconActive: 'text-emerald-700',
  },
  {
    key: 'presupuesto',
    label: 'Presupuesto',
    percent: 66,
    icon: <Wallet className="w-4 h-4" />,
    iconWrap: 'bg-violet-50',
    iconActive: 'text-violet-700',
  },
  {
    key: 'bodega',
    label: 'Bodega',
    percent: 83,
    icon: <Warehouse className="w-4 h-4" />,
    iconWrap: 'bg-amber-50',
    iconActive: 'text-amber-700',
  },
  {
    key: '3way',
    label: '3-Way Match',
    percent: 100,
    icon: <ScrollText className="w-4 h-4" />,
    iconWrap: 'bg-slate-100',
    iconActive: 'text-slate-700',
  },
];

export interface PipelineStageOption {
  value: string;
  label: string;
  stageKey?: PipelineStageId;
}

export const PIPELINE_STAGE_OPTIONS: PipelineStageOption[] = [
  { value: 'TODAS', label: 'Todas las Etapas Operativas (6)' },
  { value: 'aprobacion', label: '1. Aprobación Inicial', stageKey: 'aprobacion' },
  { value: 'matriz', label: '2. Matriz de Cotizaciones', stageKey: 'matriz' },
  { value: 'seleccion', label: '3. Selección Financiera', stageKey: 'seleccion' },
  { value: 'presupuesto', label: '4. Validación Presupuestaria', stageKey: 'presupuesto' },
  { value: 'bodega', label: '5. Recepción en Bodega', stageKey: 'bodega' },
  { value: '3way', label: '6. 3-Way Match / Liquidación', stageKey: '3way' },
  { value: 'rechazada', label: '🚫 Solicitudes Rechazadas', stageKey: 'rechazada' },
];

// ─── Normalization & Status Helpers ─────────────────────────────────────────

export function normalizeStatus(status?: string | null): string {
  if (!status) return '';
  return status
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isStatusRejected(status?: string | null, notas?: string | null): boolean {
  const norm = normalizeStatus(status);
  const normNotas = normalizeStatus(notas);
  return (
    norm.includes('RECHAZAD') ||
    norm.includes('DENEGAD') ||
    norm.includes('CANCELAD') ||
    norm.includes('ANULAD') ||
    normNotas.includes('[RECHAZADA]') ||
    normNotas.includes('RECHAZAD')
  );
}

export function isStatusFullyComplete(status?: string | null, notas?: string | null): boolean {
  if (isStatusRejected(status, notas)) return false;
  const norm = normalizeStatus(status);
  const normNotas = normalizeStatus(notas);

  // Nadie aparece como Finalizada/Completada a menos que esté formalmente cerrada o liquidada
  const isExplicitlyFinal =
    norm === 'FINALIZADA' ||
    norm === 'FINALIZADO' ||
    norm === 'CERRADA' ||
    norm === 'CERRADO' ||
    norm === 'LIQUIDADA' ||
    norm === 'LIQUIDADO' ||
    normNotas.includes('[3-WAY MATCH LIQUIDADO]') ||
    normNotas.includes('[LIQUIDADA]');

  return isExplicitlyFinal && !isStatusRejected(status, notas);
}

export function getStageIndexForStatus(status?: string | null, notas?: string | null): number {
  if (isStatusRejected(status, notas)) return 0;
  const norm = normalizeStatus(status);
  const normNotas = normalizeStatus(notas);
  if (!norm) return 0;

  if (isStatusRejected(norm, notas)) return 0;

  // 1. Aprobación (Etapa 1)
  if (
    norm.includes('PENDIENTE') ||
    norm.includes('SOLICITAD') ||
    norm.includes('REVISION')
  ) {
    return 0;
  }

  // 6. Finalizada / 3-Way Match & Liquidación (Etapa 6)
  if (
    norm.includes('FINALIZ') ||
    norm.includes('COMPLETAD') ||
    norm.includes('3WAY') ||
    norm.includes('MATCH') ||
    norm.includes('FACTUR') ||
    norm.includes('CERRAD') ||
    norm.includes('LIQUID') ||
    normNotas.includes('[3-WAY MATCH')
  ) {
    return 5;
  }

  // 5. Bodega / Recepción (Etapa 5)
  if (
    norm.includes('BODEGA') ||
    norm.includes('RECEPC') ||
    norm.includes('ALMACEN') ||
    norm.includes('RECIBID') ||
    normNotas.includes('[RECEPCION BODEGA')
  ) {
    return 4;
  }

  // 4. Presupuesto (Etapa 4 - cuando ya fue adjudicada o autorizada)
  if (
    norm.includes('PRESUP') ||
    norm.includes('ADJUDICAD') ||
    normNotas.includes('[ADJUDICADA') ||
    normNotas.includes('[PRESUPUESTO')
  ) {
    return 3;
  }

  // 3. Selección Financiera (Etapa 3)
  if (
    norm.includes('SELECCION') ||
    norm.includes('EVALUAC') ||
    norm.includes('COTIZAD') ||
    norm.includes('EN_PROCESO') ||
    norm.includes('PROCESO')
  ) {
    return 2;
  }

  // 2. Matriz de Cotizaciones (Etapa 2)
  if (
    norm === 'APROBADA' ||
    norm === 'APROBADO' ||
    norm.includes('MATRIZ') ||
    norm.startsWith('APROBAD')
  ) {
    return 1;
  }

  if (norm.includes('APROBACION')) {
    return 0;
  }

  return 0;
}

// ─── Shared Summary Helper ──────────────────────────────────────────────────

export interface PipelineSummary {
  activeIndex: number;
  stepNumber: number;
  totalSteps: number;
  stage: PipelineStage;
  globalPercent: number;
  isRejected: boolean;
  isComplete: boolean;
  isPending: boolean;
  stateBadgeText: string;
  stageSubtitle: string;
  statusLabel: string;
}

export function getPipelineSummary(status?: string | null, notas?: string | null): PipelineSummary {
  const raw = (status || '').trim();
  const isRejected = isStatusRejected(raw, notas);
  const isComplete = isStatusFullyComplete(raw, notas);
  const activeIndex = getStageIndexForStatus(raw, notas);
  const isPending = !isRejected && activeIndex === 0;
  const totalSteps = PIPELINE_STAGES.length;

  let globalPercent = 0;
  let stateBadgeText = 'Aprobada';
  let stageSubtitle = 'En Curso';

  if (isRejected) {
    globalPercent = 0;
    stateBadgeText = 'Rechazada';
    stageSubtitle = 'Ciclo Detenido';
  } else if (isComplete) {
    globalPercent = 100;
    stateBadgeText = 'Finalizada';
    stageSubtitle = 'Ciclo Completo';
  } else if (isPending) {
    globalPercent = 16;
    stateBadgeText = 'Pendiente';
    stageSubtitle = 'Aprobación';
  } else if (activeIndex === 5) {
    // En etapa 6 (3-Way Match) pero aún pendiente de liquidación formal
    globalPercent = 88;
    stateBadgeText = '3-Way Match';
    stageSubtitle = 'Cotejo Documental';
  } else {
    const basePercentByStage = [16, 33, 50, 66, 83, 88];
    globalPercent = basePercentByStage[activeIndex] || 33;
    const stageNames = ['Pendiente', 'Aprobada', 'Selección', 'Presupuesto', 'Recepción', '3-Way Match'];
    stateBadgeText = stageNames[activeIndex] || 'Aprobada';
    stageSubtitle = PIPELINE_STAGES[activeIndex]?.label || 'En Curso';
  }

  return {
    activeIndex,
    stepNumber: isRejected ? 0 : (isComplete ? totalSteps : activeIndex + 1),
    totalSteps,
    stage: PIPELINE_STAGES[activeIndex] || PIPELINE_STAGES[0],
    globalPercent,
    isRejected,
    isComplete,
    isPending,
    stateBadgeText,
    stageSubtitle,
    statusLabel: isRejected ? 'RECHAZADA' : isComplete ? 'FINALIZADA' : (raw || stateBadgeText.toUpperCase()),
  };
}

export function getStageForSolicitud(
  solicitud?: Partial<ISolicitudCompra> | { solNombreEstado?: string | null; estado?: string | null; solNotas?: string | null;[key: string]: any } | null
): PipelineStageId {
  if (!solicitud) return 'aprobacion';
  const estado = solicitud.solNombreEstado || (solicitud as any).estado || '';
  const rawNotas = solicitud.solNotas || (solicitud as any).notas || '';
  const estadoNombre = (estado || '').toUpperCase();
  const notasUpper = (rawNotas || '').toUpperCase();

  if (isStatusRejected(estadoNombre, notasUpper)) {
    return 'aprobacion';
  }
  if ((solicitud as any).stage && PIPELINE_STAGES.some((s) => s.key === (solicitud as any).stage)) {
    return (solicitud as any).stage as PipelineStageId;
  }
  if ((solicitud as any).etapa && PIPELINE_STAGES.some((s) => s.key === (solicitud as any).etapa)) {
    return (solicitud as any).etapa as PipelineStageId;
  }

  const estadoId = Number(solicitud.solIdEstado || 0);

  // 1. Si está rechazada -> Aprobación (Etapa 1 detenida)
  if (estadoId === 6 || isStatusRejected(estadoNombre, notasUpper)) {
    return 'aprobacion';
  }

  // 6. Etapa 6: Finalizada / 3-Way Match & Liquidación (Estado 5 o tiene recepción registrada)
  if (
    estadoId === 5 ||
    solicitud.tieneRecepcion ||
    estadoNombre.includes('FINALIZ') ||
    estadoNombre.includes('COMPLETAD') ||
    estadoNombre.includes('CERRAD') ||
    estadoNombre.includes('3WAY') ||
    estadoNombre.includes('LIQUID')
  ) {
    return '3way';
  }

  // 5. Etapa 5: Recepción en Bodega (Tiene PO emitida y aún no se ha recibido físicamente)
  if (
    estadoId === 4 ||
    solicitud.tienePo ||
    estadoNombre.includes('RECIBID') ||
    estadoNombre.includes('BODEGA') ||
    estadoNombre.includes('ALMACEN')
  ) {
    return 'bodega';
  }

  // 4. Etapa 4: Validación Presupuestaria y Emisión de PO (Cuando ya fue adjudicada o autorizada)
  if (
    estadoNombre.includes('PRESUP') ||
    estadoNombre.includes('ADJUDICAD') ||
    (solicitud.tieneCotizacionGanadora && estadoId >= 3) ||
    notasUpper.includes('[ADJUDICADA') ||
    notasUpper.includes('[PRESUPUESTO')
  ) {
    return 'presupuesto';
  }

  // 3. Etapa 3: Selección Financiera (Estado 3 o EN_PROCESO / COTIZADA / EVALUACION sin adjudicar aún)
  if (
    estadoId === 3 ||
    estadoNombre.includes('EN_PROCESO') ||
    estadoNombre.includes('COTIZAD') ||
    estadoNombre.includes('SELECCION') ||
    estadoNombre.includes('EVALUAC') ||
    estadoNombre.includes('PROCESO')
  ) {
    return 'seleccion';
  }

  // 2. Etapa 2: Matriz de Cotizaciones (Estado 2 o APROBADA para cotizar)
  if (
    estadoId === 2 ||
    estadoNombre === 'APROBADA' ||
    estadoNombre === 'APROBADO' ||
    estadoNombre.includes('MATRIZ') ||
    estadoNombre.startsWith('APROBAD')
  ) {
    return 'matriz';
  }

  // 1. Etapa 1: Aprobación Inicial (Estado 1 o PENDIENTE / SOLICITADA / REVISION)
  return 'aprobacion';
}

export type StageState = 'done' | 'active' | 'pending' | 'blocked' | 'rejected';

export function getStageState(
  stageIndex: number,
  activeIndex: number,
  isRejected: boolean,
  isComplete: boolean = false,
): StageState {
  if (isRejected) {
    if (stageIndex === 0) return 'rejected';
    return 'blocked';
  }
  if (isComplete) return 'done';
  if (stageIndex < activeIndex) return 'done';
  if (stageIndex === activeIndex) return 'active';
  return 'pending';
}

// ─── Pure Card Component (Popover Body) ────────────────────────────────────

export interface PipelineProgressCardProps {
  status?: string;
  notas?: string | null;
  solicitud?: ISolicitudCompra;
  onStageClick: (stageKey: PipelineStageId) => void;
  className?: string;
}

export const PipelineProgressCard: React.FC<PipelineProgressCardProps> = ({
  status = 'Aprobada',
  notas = '',
  solicitud,
  onStageClick,
  className = '',
}) => {
  const summary = getPipelineSummary(solicitud?.solNombreEstado || status, solicitud?.solNotas || notas);
  const { activeIndex, globalPercent, isRejected, isComplete } = summary;

  return (
    <div className={`px-3 pb-3 pt-1 select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Ciclo de vida de la compra
        </p>
        {isRejected ? (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1">
            <Ban className="w-3 h-3" /> Rechazada
          </span>
        ) : summary.isPending ? (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        ) : isComplete ? (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Finalizada
          </span>
        ) : activeIndex === 5 ? (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-full flex items-center gap-1 shadow-2xs">
            <ScrollText className="w-3.5 h-3.5 text-indigo-600" /> 3-Way Matching
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {summary.stateBadgeText}
          </span>
        )}
      </div>

      {/* Banner if Rejected */}
      {isRejected && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-900 leading-tight">Ciclo Detenido</p>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-tight">
              Solicitud denegada en aprobación. Las etapas posteriores se encuentran bloqueadas.
            </p>
          </div>
        </div>
      )}

      {/* Global progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 font-medium">Progreso total</span>
          <span
            className={`text-xs font-bold tabular-nums ${isRejected
              ? 'text-rose-600'
              : summary.isPending
                ? 'text-amber-700'
                : isComplete
                  ? 'text-emerald-600'
                  : 'text-blue-600'
              }`}
          >
            {Math.round(globalPercent)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isRejected
              ? 'bg-rose-400'
              : summary.isPending
                ? 'bg-amber-500'
                : isComplete
                  ? 'bg-emerald-500'
                  : 'bg-blue-600'
              }`}
            style={{ width: `${globalPercent}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="flex flex-col gap-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const state = getStageState(idx, activeIndex, isRejected, isComplete);
          const isDone = state === 'done';
          const isActive = state === 'active';
          const isBlocked = state === 'blocked';
          const isRej = state === 'rejected';

          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => !isBlocked && onStageClick(stage.key)}
              disabled={isBlocked}
              className={`group flex w-full items-center gap-3 px-2.5 py-2 rounded-lg text-left border transition-all ${isBlocked
                ? 'opacity-40 cursor-not-allowed border-transparent bg-slate-50/50'
                : isRej
                  ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/80 hover:shadow-xs cursor-pointer'
                  : isDone
                    ? 'bg-emerald-50/60 border-transparent hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-xs cursor-pointer'
                    : isActive
                      ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/80 hover:border-blue-300 hover:shadow-xs cursor-pointer'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200 hover:shadow-xs cursor-pointer'
                }`}
            >
              {/* Icon */}
              <span
                className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md ${isBlocked
                  ? 'bg-slate-100 text-slate-400'
                  : isRej
                    ? 'bg-rose-100 text-rose-600'
                    : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isActive
                        ? `${stage.iconWrap} ${stage.iconActive}`
                        : `${stage.iconWrap} text-slate-400`
                  }`}
              >
                {isBlocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : isRej ? (
                  <Ban className="w-3.5 h-3.5" />
                ) : isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  stage.icon
                )}
              </span>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold leading-none ${isBlocked
                      ? 'text-slate-400'
                      : isRej
                        ? 'text-rose-800'
                        : isDone
                          ? 'text-emerald-800'
                          : isActive
                            ? 'text-blue-800'
                            : 'text-slate-700'
                      }`}
                  >
                    {stage.label}
                  </span>
                  {isRej && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                      Rechazada
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded">
                      Completada
                    </span>
                  )}
                  {isActive && !isRej && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded">
                      En Curso
                    </span>
                  )}
                </div>
              </div>

              {/* Affordance */}
              {!isBlocked && (
                <ChevronRight
                  className={`w-4 h-4 flex-shrink-0 transition-all opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ${isRej
                    ? 'text-rose-500'
                    : isDone
                      ? 'text-emerald-500'
                      : isActive
                        ? 'text-blue-500'
                        : 'text-slate-400'
                    }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Integrated Component (Table Trigger & Popover) ───────────────────

export interface PipelineProgressProps {
  solicitud?: ISolicitudCompra;
  status?: string;
  currentStage?: PipelineStageId;
  onSelectStage?: (stageId: PipelineStageId, solicitud: ISolicitudCompra) => void;
  onStageClick?: (stageKey: string) => void;
  asCard?: boolean;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  solicitud,
  status: statusProp,
  currentStage,
  onSelectStage,
  onStageClick,
  asCard = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const rawStatus = statusProp || solicitud?.solNombreEstado || 'Aprobada';
  const rawNotas = solicitud?.solNotas || '';
  const summary = getPipelineSummary(rawStatus, rawNotas);

  const activeStage = currentStage
    ? PIPELINE_STAGES.find((s) => s.key === currentStage) || summary.stage
    : summary.stage;
  const activeIndex = PIPELINE_STAGES.findIndex((s) => s.key === activeStage.key);

  const handleStageSelection = (stageKey: PipelineStageId) => {
    setIsOpen(false);
    if (onStageClick) {
      onStageClick(stageKey);
    }
    if (onSelectStage && solicitud) {
      onSelectStage(stageKey, solicitud);
    }
  };

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const popoverHeight = 350;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < popoverHeight && rect.top > popoverHeight;

        const top = openUp ? Math.max(8, rect.top - popoverHeight - 6) : rect.bottom + 6;
        const right = Math.max(16, window.innerWidth - rect.right);

        setPopoverStyle({
          position: 'fixed',
          top: `${top}px`,
          right: `${right}px`,
          zIndex: 9999,
          boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    } else {
      setPopoverStyle(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Si asCard es true, renderiza la tarjeta directamente
  if (asCard) {
    return (
      <PipelineProgressCard
        status={rawStatus}
        notas={rawNotas}
        solicitud={solicitud}
        onStageClick={handleStageSelection}
      />
    );
  }

  // Integración en fila de tabla con trigger pill interactivo y popover flotante
  return (
    <div
      className="relative inline-block select-none"
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition-all cursor-pointer shadow-2xs whitespace-nowrap ${isOpen
          ? 'border-blue-400 bg-blue-50/60 ring-2 ring-blue-100 shadow-sm'
          : summary.isRejected
            ? 'border-rose-200 bg-rose-50/40 hover:border-rose-300 hover:bg-rose-50/80'
            : summary.isPending
              ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50/80'
              : summary.isComplete
                ? 'border-emerald-300 bg-emerald-50/80 hover:border-emerald-400 hover:bg-emerald-100/80 text-emerald-900'
                : activeIndex === 5
                  ? 'border-indigo-300 bg-indigo-50/70 hover:border-indigo-400 hover:bg-indigo-100/80 text-indigo-900'
                  : 'border-blue-200 bg-blue-50/30 hover:border-blue-300 hover:bg-blue-50/70'
          }`}
        title="Clic para ver ciclo de vida completo de la compra"
      >
        {summary.isRejected ? (
          <>
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[11px] bg-rose-100 text-rose-600 font-bold">
              <Ban className="w-3 h-3" />
            </span>
            <span className="text-[11px] font-bold text-rose-800 leading-none">
              Rechazada
            </span>
            <span className="text-[9px] font-semibold text-rose-600 bg-rose-100/70 px-1 py-0.5 rounded leading-none">
              Detenido
            </span>
          </>
        ) : summary.isPending ? (
          <>
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[11px] bg-amber-100 text-amber-700 font-bold">
              <Clock className="w-3 h-3" />
            </span>
            <span className="text-[11px] font-bold text-amber-900 leading-none">
              Aprobación
            </span>
            <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded leading-none">
              1/6
            </span>
          </>
        ) : summary.isComplete ? (
          <>
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[11px] bg-emerald-100 text-emerald-700 font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <span className="text-[11px] font-bold text-emerald-800 leading-none">
              Finalizada
            </span>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.5 rounded-full leading-none shadow-2xs">
              Completada
            </span>
          </>
        ) : activeIndex === 5 ? (
          <>
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[11px] bg-indigo-100 text-indigo-700 font-bold shadow-2xs">
              <ScrollText className="w-3.5 h-3.5 text-indigo-600" />
            </span>
            <span className="text-[11px] font-bold text-indigo-900 leading-none">
              3-Way Matching
            </span>
            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-full leading-none shadow-2xs">
              6/6
            </span>
          </>
        ) : (
          <>
            <span className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[11px] ${activeStage.iconWrap} ${activeStage.iconActive}`}>
              {activeStage.icon}
            </span>
            <span className="text-[11px] font-bold text-slate-800 leading-none">
              {activeStage.label}
            </span>
            <span className="text-[9px] font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded leading-none">
              {activeIndex + 1}/6
            </span>
          </>
        )}

        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'
            }`}
        />
      </button>

      {/* Popover Dropdown Card rendered into document.body to avoid ANY container clipping */}
      {isOpen && popoverStyle && createPortal(
        <div
          ref={popoverRef}
          className="fixed w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 animate-fadeIn select-none"
          style={popoverStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <PipelineProgressCard
            status={rawStatus}
            notas={rawNotas}
            solicitud={solicitud}
            onStageClick={handleStageSelection}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default PipelineProgress;
