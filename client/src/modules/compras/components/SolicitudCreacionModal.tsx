import React from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { SolicitudCreacionView } from './SolicitudCreacionView';

export interface SolicitudCreacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onReload?: () => void;
}

export const SolicitudCreacionModal: React.FC<SolicitudCreacionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onReload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingCart size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nueva Solicitud de Compra
              </h2>
              <p className="text-xs text-slate-500">
                Ingrese los artículos requeridos para iniciar el ciclo de adquisiciones
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <SolicitudCreacionView
            isModal={true}
            onReload={onReload}
            onSuccess={() => {
              if (onSuccess) onSuccess();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
