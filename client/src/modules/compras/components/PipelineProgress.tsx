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
  | '3way';

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

// ─── Normalization & Status Helpers ─────────────────────────────────────────

export function normalizeStatus(status?: string | null): string {
  if (!status) return '';
  return status
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isStatusRejected(status?: string | null): boolean {
  const norm = normalizeStatus(status);
  return norm.includes('RECHAZAD') || norm.includes('DENEGAD') || norm.includes('CANCELAD');
}

export function isStatusFullyComplete(status?: string | null): boolean {
  const norm = normalizeStatus(status);
  return norm.includes('FINALIZ') || norm.includes('3WAY') || norm.includes('CERRAD');
}

export function getStageIndexForStatus(status?: string | null): number {
  const norm = normalizeStatus(status);
  if (!norm) return 1;

  if (isStatusRejected(norm)) return 0;
  if (norm.includes('PENDIENTE') || norm.includes('SOLICITAD') || norm.includes('REVISION')) return 0;
  if (norm.includes('COTIZAD') || norm.includes('SELECCION') || norm.includes('EVALUAC')) return 2;
  if (norm.includes('PRESUP') || norm.includes('ORDEN') || norm.includes('PO')) return 3;
  if (norm.includes('BODEGA') || norm.includes('RECEPC') || norm.includes('ALMACEN')) return 4;
  if (norm.includes('3WAY') || norm.includes('MATCH') || norm.includes('FACTUR') || norm.includes('FINALIZ')) return 5;
  if (norm.includes('APROBAD') || norm.includes('COTIZ') || norm.includes('MATRIZ')) return 1;

  return 1;
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

export function getPipelineSummary(status?: string | null): PipelineSummary {
  const raw = (status || '').trim();
  const isRejected = isStatusRejected(raw);
  const isComplete = isStatusFullyComplete(raw);
  const activeIndex = getStageIndexForStatus(raw);
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
  } else {
    const basePercentByStage = [16, 33, 50, 66, 83, 95];
    globalPercent = basePercentByStage[activeIndex] || 33;
    const stageNames = ['Pendiente', 'Aprobada', 'Cotizada', 'Presupuesto', 'Recepción', 'Finalizada'];
    stateBadgeText = stageNames[activeIndex] || 'Aprobada';
    stageSubtitle = PIPELINE_STAGES[activeIndex]?.label || 'En Curso';
  }

  return {
    activeIndex,
    stepNumber: activeIndex + 1,
    totalSteps,
    stage: PIPELINE_STAGES[activeIndex] || PIPELINE_STAGES[0],
    globalPercent,
    isRejected,
    isComplete,
    isPending,
    stateBadgeText,
    stageSubtitle,
    statusLabel: raw || stateBadgeText.toUpperCase(),
  };
}

export function getStageForSolicitud(solicitud: ISolicitudCompra): PipelineStageId {
  const estado = solicitud.solNombreEstado || 'Aprobada';
  const idx = getStageIndexForStatus(estado);
  return PIPELINE_STAGES[idx]?.key || 'matriz';
}

export type StageState = 'done' | 'active' | 'pending' | 'blocked' | 'rejected';

export function getStageState(
  stageIndex: number,
  activeIndex: number,
  isRejected: boolean,
): StageState {
  if (isRejected) {
    if (stageIndex === 0) return 'rejected';
    return 'blocked';
  }
  if (stageIndex < activeIndex) return 'done';
  if (stageIndex === activeIndex) return 'active';
  return 'pending';
}

// ─── Pure Card Component (Popover Body) ────────────────────────────────────

export interface PipelineProgressCardProps {
  status?: string;
  onStageClick: (stageKey: PipelineStageId) => void;
  className?: string;
}

export const PipelineProgressCard: React.FC<PipelineProgressCardProps> = ({
  status = 'Aprobada',
  onStageClick,
  className = '',
}) => {
  const summary = getPipelineSummary(status);
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
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-green-200 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Finalizada
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
            className={`text-xs font-bold tabular-nums ${
              isRejected
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
            className={`h-full rounded-full transition-all duration-500 ${
              isRejected
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
          const state = getStageState(idx, activeIndex, isRejected);
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
              className={`group flex w-full items-center gap-3 px-2.5 py-2 rounded-lg text-left border transition-all ${
                isBlocked
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
                className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md ${
                  isBlocked
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
                    className={`text-xs font-semibold leading-none ${
                      isBlocked
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
                  className={`w-4 h-4 flex-shrink-0 transition-all opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ${
                    isRej
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
  const summary = getPipelineSummary(rawStatus);

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
        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-blue-400 bg-blue-50/60 ring-2 ring-blue-100 shadow-sm'
            : summary.isRejected
            ? 'border-rose-200 bg-rose-50/40 hover:border-rose-300 hover:bg-rose-50/80'
            : summary.isPending
            ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50/80'
            : summary.isComplete
            ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50/80'
            : 'border-blue-200 bg-blue-50/30 hover:border-blue-300 hover:bg-blue-50/70'
        }`}
        title="Clic para ver ciclo de vida completo de la compra"
      >
        {summary.isRejected ? (
          <>
            {/* Rejected Trigger Badge */}
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-rose-100 text-rose-600 font-bold">
              <Ban className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-xs font-bold text-rose-800 leading-tight">
                Rechazada
              </span>
              <span className="text-[10px] text-rose-600 font-medium leading-tight">
                Ciclo Detenido
              </span>
            </div>
          </>
        ) : summary.isPending ? (
          <>
            {/* Pendiente Trigger Badge */}
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-amber-100 text-amber-700 font-bold">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-amber-900 leading-tight">
                  Pendiente
                </span>
                <span className="text-[9px] font-semibold text-amber-700 bg-amber-200/60 px-1 py-0.5 rounded leading-none">
                  1/6
                </span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                Aprobación
              </span>
            </div>
          </>
        ) : summary.isComplete ? (
          <>
            {/* Finalizada Trigger Badge */}
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-emerald-100 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-emerald-900 leading-tight">
                  Finalizada
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-200/60 px-1 py-0.5 rounded leading-none">
                  6/6
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 leading-tight">
                Ciclo Completo
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Aprobada / En Proceso Trigger Badge */}
            <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-xs ${activeStage.iconWrap} ${activeStage.iconActive}`}>
              {activeStage.icon}
            </span>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-blue-900 leading-tight">
                  {summary.stateBadgeText}
                </span>
                <span className="text-[9px] font-semibold text-blue-700 bg-blue-200/60 px-1 py-0.5 rounded leading-none">
                  {activeIndex + 1}/6
                </span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                {activeStage.label}
              </span>
            </div>
          </>
        )}

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-auto ${
            isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'
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
            onStageClick={handleStageSelection}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default PipelineProgress;
