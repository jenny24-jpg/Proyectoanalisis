import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Checkbox } from '../../../components/ui';
import {
  ITipoMovimiento,
  ICreateTipoMovimientoDTO,
  IUpdateTipoMovimientoDTO,
  NaturalezaMovimientoType,
} from '@erp/contracts';

export interface TipoMovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateTipoMovimientoDTO | IUpdateTipoMovimientoDTO, id?: number) => Promise<void>;
  tipoMovimiento?: ITipoMovimiento | null;
}

export const TipoMovimientoModal: React.FC<TipoMovimientoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tipoMovimiento,
}) => {
  const isEditing = Boolean(tipoMovimiento);
  const [codigo, setCodigo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [naturaleza, setNaturaleza] = useState<NaturalezaMovimientoType>('+');
  const [afectaCosto, setAfectaCosto] = useState<boolean>(true);
  const [activo, setActivo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (tipoMovimiento) {
      setCodigo(tipoMovimiento.tmiCodigo);
      setDescripcion(tipoMovimiento.tmiDescripcion);
      setNaturaleza(tipoMovimiento.tmiNaturaleza);
      setAfectaCosto(tipoMovimiento.tmiAfectaCosto === 1);
      setActivo(tipoMovimiento.tmiActivo === 1);
    } else {
      setCodigo('');
      setDescripcion('');
      setNaturaleza('+');
      setAfectaCosto(true);
      setActivo(true);
    }
    setError(null);
  }, [tipoMovimiento, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codTrimmed = codigo.trim().toUpperCase();
    const descTrimmed = descripcion.trim();

    if (!codTrimmed) {
      setError('El código es obligatorio.');
      return;
    }
    if (!descTrimmed) {
      setError('La descripción es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ICreateTipoMovimientoDTO = {
        tmiCodigo: codTrimmed,
        tmiDescripcion: descTrimmed,
        tmiNaturaleza: naturaleza,
        tmiAfectaCosto: afectaCosto ? 1 : 0,
        tmiActivo: activo ? 1 : 0,
      };

      if (isEditing && tipoMovimiento) {
        await onSave(payload, tipoMovimiento.tmiIdTipoMovimiento);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el tipo de movimiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${tipoMovimiento?.tmiIdTipoMovimiento}` : 'Configuración de Reglas de Kardex'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="CÓDIGO ÚNICO"
              required
              placeholder="Ej. REC_COMPRA"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              maxLength={20}
              autoFocus
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                NATURALEZA
              </label>
              <select
                value={naturaleza}
                onChange={(e) => setNaturaleza(e.target.value as NaturalezaMovimientoType)}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-purple-600 font-bold"
              >
                <option value="+">+ Entrada a Inventario</option>
                <option value="-">- Salida de Inventario</option>
              </select>
            </div>
          </div>

          <TextInput
            label="DESCRIPCIÓN OPERATIVA"
            required
            placeholder="Ej. Recepción por orden de compra a proveedor..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={100}
          />

          <div className="pt-2 space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Checkbox
              label="Afecta Costo Promedio"
              helperText="El movimiento recalculará el costo ponderado unitario del artículo."
              checked={afectaCosto}
              onChange={(e) => setAfectaCosto(e.target.checked)}
            />
            <Checkbox
              label="Tipo de Movimiento Activo"
              helperText="Disponible para operar en transferencias, ajustes o recepciones."
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Tipo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
