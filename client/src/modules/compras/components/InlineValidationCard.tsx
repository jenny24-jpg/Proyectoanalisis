import React from 'react';
import { AlertTriangle, AlertCircle, X, ShieldAlert } from 'lucide-react';

export interface InlineValidationCardProps {
  error: string | null;
  onDismiss?: () => void;
  title?: string;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

/**
 * Card de Advertencia / Alerta In-situ para Retroalimentación Inmediata de Formularios.
 * Se ubica directamente sobre la botonera de acción donde el usuario hace clic para
 * evitar la dependencia de tener que desplazarse hacia arriba.
 */
export const InlineValidationCard: React.FC<InlineValidationCardProps> = ({
  error,
  onDismiss,
  title = 'Se requiere completar información obligatoria',
  variant = 'error',
  className = '',
}) => {
  if (!error) return null;

  const isWarning = variant === 'warning';
  const isInfo = variant === 'info';

  const containerClasses = isWarning
    ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-200/50'
    : isInfo
    ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-200/50'
    : 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-200/60';

  const iconBgClasses = isWarning
    ? 'bg-amber-100 text-amber-700 border-amber-300'
    : isInfo
    ? 'bg-blue-100 text-blue-700 border-blue-300'
    : 'bg-rose-100 text-rose-700 border-rose-300';

  const IconComponent = isWarning ? AlertTriangle : isInfo ? AlertCircle : ShieldAlert;

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-md animate-fadeIn transition-all duration-200 ${containerClasses} ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${iconBgClasses}`}>
          <IconComponent size={20} />
        </div>
        <div className="space-y-0.5 pt-0.5 min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-inherit flex items-center gap-1.5">
            <span>{title}</span>
          </h4>
          <p className="text-xs font-medium leading-relaxed opacity-95 break-words">
            {error}
          </p>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors shrink-0 -mr-1 -mt-1"
          title="Descartar advertencia"
          aria-label="Cerrar advertencia"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
