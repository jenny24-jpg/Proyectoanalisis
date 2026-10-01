import React, { useState } from 'react';
import { X, ClipboardList, Play, AlertCircle } from 'lucide-react';
import { Button, Select, TextInput } from '../../../components/ui';

export interface AuditoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (idBodega: number, idUsuario: number, motivo?: string) => Promise<void>;
  bodegas: { id: number; nombre: string }[];
  currentBodegaId?: number;
}

const AUDITORES = [
  { value: 3, label: 'Marta Girón - Auditoría de Bodega' },
  { value: 1, label: 'Ana López - Control de Inventarios' },
  { value: 2, label: 'Luis Ramírez - Compras y Almacén' },
];

export const AuditoriaModal: React.FC<AuditoriaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bodegas,
  currentBodegaId,
}) => {
  const [idBodega, setIdBodega] = useState<number>(currentBodegaId || bodegas[0]?.id || 1);
  const [idUsuario, setIdUsuario] = useState<number>(3);
  const [motivo, setMotivo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idBodega) {
      setError('Seleccione una bodega válida para auditar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(Number(idBodega), Number(idUsuario), motivo.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al aperturar la auditoría.');
    } finally {
      setIsLoading(false);
    }
  };

  const bodegaOptions = bodegas.map(b => ({
    value: b.id,
    label: b.nombre,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Aperturar Auditoría de Inventario
              </h3>
              <p className="text-xs text-slate-500">
                Toma física y congelamiento de existencias
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

          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
            <p className="font-semibold text-indigo-950 mb-1">
              ¿Cómo funciona la Toma Física?
            </p>
            Al iniciar, el sistema capturará automáticamente el stock teórico actual de los artículos de la bodega seleccionada. Luego podrás ingresar el conteo físico real para calcular discrepancias.
          </div>

          <Select
            label="BODEGA A AUDITAR"
            required
            value={idBodega}
            onChange={(e) => setIdBodega(Number(e.target.value))}
            options={bodegaOptions}
          />

          <Select
            label="AUDITOR RESPONSABLE"
            required
            value={idUsuario}
            onChange={(e) => setIdUsuario(Number(e.target.value))}
            options={AUDITORES}
          />

          <TextInput
            label="MOTIVO / ALCANCE DE LA AUDITORÍA"
            placeholder="Ej. Auditoría mensual de cierre de mes, conteo cíclico..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isLoading} type="button">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={Play} 
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Iniciando Auditoría...' : 'Iniciar Toma Física'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
