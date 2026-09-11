import React, { useState, useEffect } from 'react';
import { X, Tag, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Checkbox } from '../../../components/ui';
import { IMarca, ICreateMarcaDTO, IUpdateMarcaDTO } from '@erp/contracts';

export interface MarcaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateMarcaDTO | IUpdateMarcaDTO, id?: number) => Promise<void>;
  marca?: IMarca | null;
}

export const MarcaModal: React.FC<MarcaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  marca,
}) => {
  const isEditing = Boolean(marca);
  const [nombre, setNombre] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (marca) {
      setNombre(marca.marNombreMarca);
      setActivo(marca.marActivo === 1);
    } else {
      setNombre('');
      setActivo(true);
    }
    setError(null);
  }, [marca, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la marca es obligatorio.');
      return;
    }

    if (nombre.trim().length > 100) {
      setError('El nombre no puede exceder los 100 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && marca) {
        await onSave(
          {
            marNombreMarca: nombre.trim(),
            marActivo: activo ? 1 : 0,
          },
          marca.marIdMarca
        );
      } else {
        await onSave({
          marNombreMarca: nombre.trim(),
          marActivo: activo ? 1 : 0,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la marca.');
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
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Marca' : 'Nueva Marca'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${marca?.marIdMarca}` : 'Catálogo de Inventario'}
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
            label="NOMBRE DE LA MARCA"
            required
            placeholder="Ej. HP, Dell, Herman Miller, Genérica..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />

          <div className="pt-1">
            <Checkbox
              label="Marca Activa"
              helperText="Las marcas inactivas no estarán disponibles para la creación de nuevos artículos."
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Marca'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
