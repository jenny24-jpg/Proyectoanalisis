import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, AlertCircle, Layers } from 'lucide-react';
import { Button, TextInput } from '../../../components/ui';
import { ILote, ICreateLoteDTO, IUpdateLoteDTO, EstadoLoteType } from '@erp/contracts';
import { sanitizeStrictCode } from '../../../utils/sanitizers';

export interface LoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateLoteDTO | IUpdateLoteDTO, id?: number) => Promise<void>;
  lote?: ILote | null;
}

export const LoteModal: React.FC<LoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lote,
}) => {
  const isEditing = Boolean(lote);
  const [numeroLote, setNumeroLote] = useState<string>('');
  const [codigoArticulo, setCodigoArticulo] = useState<string>('');
  const [fechaProduccion, setFechaProduccion] = useState<string>('');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');
  const [estado, setEstado] = useState<EstadoLoteType>('ACTIVO');
  const [error, setError] = useState<string | null>(null);
  const [numeroLoteError, setNumeroLoteError] = useState<string | null>(null);
  const [codigoArticuloError, setCodigoArticuloError] = useState<string | null>(null);
  const [fechasError, setFechasError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (lote) {
      setNumeroLote(lote.lotNumeroLote);
      setCodigoArticulo(lote.lotCodigoArticulo);
      setFechaProduccion(lote.lotFechaProduccion ? String(lote.lotFechaProduccion).slice(0, 10) : '');
      setFechaVencimiento(lote.lotFechaVencimiento ? String(lote.lotFechaVencimiento).slice(0, 10) : '');
      setEstado(lote.lotEstado || 'ACTIVO');
    } else {
      setNumeroLote('');
      setCodigoArticulo('');
      setFechaProduccion('');
      setFechaVencimiento('');
      setEstado('ACTIVO');
    }
    setError(null);
    setNumeroLoteError(null);
    setCodigoArticuloError(null);
    setFechasError(null);
  }, [lote, isOpen]);

  if (!isOpen) return null;

  const handleNumeroLoteChange = (val: string) => {
    const { sanitized, error: numErr } = sanitizeStrictCode(val);
    setNumeroLote(sanitized);
    setNumeroLoteError(numErr);
  };

  const handleCodigoArticuloChange = (val: string) => {
    const { sanitized, error: artErr } = sanitizeStrictCode(val);
    setCodigoArticulo(sanitized);
    setCodigoArticuloError(artErr);
  };

  const handleFechaProduccionChange = (val: string) => {
    setFechaProduccion(val);
    if (val && fechaVencimiento && new Date(fechaVencimiento).getTime() < new Date(val).getTime()) {
      setFechasError('La fecha de vencimiento no puede ser anterior a la de producción.');
    } else {
      setFechasError(null);
    }
  };

  const handleFechaVencimientoChange = (val: string) => {
    setFechaVencimiento(val);
    if (fechaProduccion && val && new Date(val).getTime() < new Date(fechaProduccion).getTime()) {
      setFechasError('La fecha de vencimiento no puede ser anterior a la de producción.');
    } else {
      setFechasError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTrimmed = numeroLote.trim().toUpperCase();
    const artTrimmed = codigoArticulo.trim().toUpperCase();

    if (!numTrimmed) {
      setNumeroLoteError('El número de lote es obligatorio.');
      setError('Por favor complete los campos obligatorios.');
      return;
    }
    if (numTrimmed.length > 50) {
      setNumeroLoteError('El número de lote no puede exceder 50 caracteres.');
      setError('Por favor revise los campos con error.');
      return;
    }

    if (!artTrimmed) {
      setCodigoArticuloError('El código del artículo es obligatorio.');
      setError('Por favor complete los campos obligatorios.');
      return;
    }

    if (numeroLoteError || codigoArticuloError) {
      setError('Corrija los caracteres no válidos antes de continuar.');
      return;
    }

    if (fechaProduccion && fechaVencimiento && new Date(fechaVencimiento).getTime() < new Date(fechaProduccion).getTime()) {
      setFechasError('La fecha de vencimiento no puede ser anterior a la de producción.');
      setError('Verifique las fechas ingresadas.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ICreateLoteDTO = {
        lotNumeroLote: numTrimmed,
        lotCodigoArticulo: artTrimmed,
        lotFechaProduccion: fechaProduccion || null,
        lotFechaVencimiento: fechaVencimiento || null,
        lotEstado: estado,
      };

      if (isEditing && lote) {
        await onSave(payload, lote.lotIdLote);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el lote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Lote' : 'Nuevo Lote'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${lote?.lotIdLote} • Lote: ${lote?.lotNumeroLote}` : 'Trazabilidad y Control de Vencimientos'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(error || fechasError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{fechasError || error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="NÚMERO DE LOTE"
              required
              placeholder="Ej. LOT-2026-A1"
              value={numeroLote}
              onChange={(e) => handleNumeroLoteChange(e.target.value)}
              maxLength={50}
              autoFocus
              error={numeroLoteError || undefined}
            />
            <TextInput
              label="CÓDIGO ARTÍCULO"
              required
              placeholder="Ej. ART-001"
              value={codigoArticulo}
              onChange={(e) => handleCodigoArticuloChange(e.target.value)}
              maxLength={20}
              error={codigoArticuloError || undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                FECHA PRODUCCIÓN
              </label>
              <input
                type="date"
                value={fechaProduccion}
                onChange={(e) => handleFechaProduccionChange(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                FECHA VENCIMIENTO
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => handleFechaVencimientoChange(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              ESTADO DEL LOTE
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoLoteType)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-600 font-medium"
            >
              <option value="ACTIVO">ACTIVO (Disponible para uso y despacho)</option>
              <option value="VENCIDO">VENCIDO (Caducado)</option>
              <option value="BLOQUEADO">BLOQUEADO (En cuarentena o inspección)</option>
              <option value="AGOTADO">AGOTADO (Sin existencias)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Lote'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
