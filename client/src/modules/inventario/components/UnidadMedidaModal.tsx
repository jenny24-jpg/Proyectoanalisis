import React, { useState, useEffect } from 'react';
import { X, Scale, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Checkbox } from '../../../components/ui';
import { IUnidadMedida, ICreateUnidadMedidaDTO, IUpdateUnidadMedidaDTO } from '@erp/contracts';

export interface UnidadMedidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateUnidadMedidaDTO | IUpdateUnidadMedidaDTO, id?: number) => Promise<void>;
  unidadMedida?: IUnidadMedida | null;
}

export const UnidadMedidaModal: React.FC<UnidadMedidaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  unidadMedida,
}) => {
  const isEditing = Boolean(unidadMedida);
  const [nombre, setNombre] = useState<string>('');
  const [abreviatura, setAbreviatura] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (unidadMedida) {
      setNombre(unidadMedida.umeNombreUnidad);
      setAbreviatura(unidadMedida.umeAbreviatura);
      setActivo(unidadMedida.umeActivo === 1);
    } else {
      setNombre('');
      setAbreviatura('');
      setActivo(true);
    }
    setError(null);
  }, [unidadMedida, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreTrimmed = nombre.trim();
    const abreviaturaTrimmed = abreviatura.trim().toUpperCase();

    if (!nombreTrimmed) {
      setError('El nombre de la unidad de medida es obligatorio.');
      return;
    }

    if (nombreTrimmed.length > 50) {
      setError('El nombre no puede exceder los 50 caracteres.');
      return;
    }

    if (!abreviaturaTrimmed) {
      setError('La abreviatura de la unidad de medida es obligatoria.');
      return;
    }

    if (abreviaturaTrimmed.length > 10) {
      setError('La abreviatura no puede exceder los 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && unidadMedida) {
        await onSave(
          {
            umeNombreUnidad: nombreTrimmed,
            umeAbreviatura: abreviaturaTrimmed,
            umeActivo: activo ? 1 : 0,
          },
          unidadMedida.umeIdUnidad
        );
      } else {
        await onSave({
          umeNombreUnidad: nombreTrimmed,
          umeAbreviatura: abreviaturaTrimmed,
          umeActivo: activo ? 1 : 0,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la unidad de medida.');
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
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${unidadMedida?.umeIdUnidad}` : 'Catálogo de Inventario y Compras'}
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
            label="NOMBRE DE LA UNIDAD"
            required
            placeholder="Ej. KILOGRAMO, METRO, LITRO, CAJA, UNIDAD..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={50}
            autoFocus
          />

          <TextInput
            label="ABREVIATURA / SÍMBOLO"
            required
            placeholder="Ej. KG, M, L, CJ, UND..."
            value={abreviatura}
            onChange={(e) => setAbreviatura(e.target.value.toUpperCase())}
            maxLength={10}
          />

          <div className="pt-1">
            <Checkbox
              label="Unidad de Medida Activa"
              helperText="Las unidades inactivas no estarán disponibles para la creación de nuevos artículos ni órdenes."
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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Unidad'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
