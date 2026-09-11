import React, { useState, useEffect } from 'react';
import { X, Bookmark, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput } from '../../../components/ui';
import { IEstado, ICreateEstadoDTO, IUpdateEstadoDTO } from '@erp/contracts';

export interface EstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateEstadoDTO | IUpdateEstadoDTO, id?: number) => Promise<void>;
  estado?: IEstado | null;
}

export const EstadoModal: React.FC<EstadoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  estado,
}) => {
  const isEditing = Boolean(estado);
  const [nombre, setNombre] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (estado) {
      setNombre(estado.estNombreEstado);
    } else {
      setNombre('');
    }
    setError(null);
  }, [estado, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError('El nombre del estado es obligatorio.');
      return;
    }

    if (trimmed.length > 50) {
      setError('El nombre no puede exceder los 50 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && estado) {
        await onSave(
          {
            estNombreEstado: trimmed,
          },
          estado.estIdEstado
        );
      } else {
        await onSave({
          estNombreEstado: trimmed,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el estado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bookmark size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Estado' : 'Nuevo Estado'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${estado?.estIdEstado}` : 'Catálogo de Estados de Compras'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <TextInput
            label="NOMBRE DEL ESTADO"
            required
            placeholder="Ej. PENDIENTE, APROBADO, RECHAZADO, EN PROCESO..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={50}
            autoFocus
          />

          <p className="text-[11px] text-slate-400">
            Define la etiqueta descriptiva del estado utilizado en solicitudes, órdenes de compra y facturas (máx. 50 caracteres).
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Estado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
