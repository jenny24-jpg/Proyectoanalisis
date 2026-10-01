import React from 'react';
import { AlertTriangle, Trash2, X, CheckCircle2, LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmIcon?: LucideIcon;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro de eliminar este registro?',
  description,
  itemName,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  variant = 'danger',
  confirmIcon,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const IconComponent = confirmIcon || (isDanger ? Trash2 : isWarning ? AlertTriangle : CheckCircle2);

  const iconStyles = isDanger
    ? 'bg-red-50 text-red-600 ring-4 ring-red-50/60'
    : isWarning
    ? 'bg-amber-50 text-amber-600 ring-4 ring-amber-50/60'
    : 'bg-blue-50 text-blue-600 ring-4 ring-blue-50/60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Icon and Close Button */}
        <div className="p-6 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconStyles}`}>
              <IconComponent size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Confirmación de acción en el ERP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Cerrar confirmación"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3">
          {itemName && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-xs text-slate-500 font-medium block mb-0.5">Elemento seleccionado:</span>
              <span className="text-sm font-semibold text-slate-800 break-words">{itemName}</span>
            </div>
          )}

          {description && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {description}
            </p>
          )}

          {isDanger && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50/70 border border-red-100 rounded-xl text-xs text-red-700">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <span>
                Esta acción puede afectar registros vinculados o cambiar el estado del elemento a inactivo en la base de datos.
              </span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <Button
            variant="secondary"
            icon={X}
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            icon={IconComponent}
            onClick={onConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
