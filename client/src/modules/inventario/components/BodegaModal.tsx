import React, { useState, useEffect } from 'react';
import { X, Warehouse, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Checkbox } from '../../../components/ui';
import { IBodega, ICreateBodegaDTO, IUpdateBodegaDTO } from '@erp/contracts';

export interface BodegaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateBodegaDTO | IUpdateBodegaDTO, id?: number) => Promise<void>;
  bodega?: IBodega | null;
}

export const BodegaModal: React.FC<BodegaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bodega,
}) => {
  const isEditing = Boolean(bodega);
  const [codigo, setCodigo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [permiteVentas, setPermiteVentas] = useState<boolean>(true);
  const [activo, setActivo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (bodega) {
      setCodigo(bodega.bodCodigo);
      setNombre(bodega.bodNombre);
      setDireccion(bodega.bodDireccion || '');
      setPermiteVentas(bodega.bodPermiteVentas === 1);
      setActivo(bodega.bodActivo === 1);
    } else {
      setCodigo('');
      setNombre('');
      setDireccion('');
      setPermiteVentas(true);
      setActivo(true);
    }
    setError(null);
  }, [bodega, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoTrimmed = codigo.trim().toUpperCase();
    const nombreTrimmed = nombre.trim();
    const direccionTrimmed = direccion.trim();

    if (!codigoTrimmed) {
      setError('El código de la bodega es obligatorio.');
      return;
    }

    if (codigoTrimmed.length > 20) {
      setError('El código no puede exceder los 20 caracteres.');
      return;
    }

    if (!nombreTrimmed) {
      setError('El nombre de la bodega es obligatorio.');
      return;
    }

    if (nombreTrimmed.length > 100) {
      setError('El nombre no puede exceder los 100 caracteres.');
      return;
    }

    if (direccionTrimmed.length > 250) {
      setError('La dirección no puede exceder los 250 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && bodega) {
        await onSave(
          {
            bodCodigo: codigoTrimmed,
            bodNombre: nombreTrimmed,
            bodDireccion: direccionTrimmed || null,
            bodPermiteVentas: permiteVentas ? 1 : 0,
            bodActivo: activo ? 1 : 0,
          },
          bodega.bodIdBodega
        );
      } else {
        await onSave({
          bodCodigo: codigoTrimmed,
          bodNombre: nombreTrimmed,
          bodDireccion: direccionTrimmed || null,
          bodPermiteVentas: permiteVentas ? 1 : 0,
          bodActivo: activo ? 1 : 0,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la bodega.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Warehouse size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Bodega' : 'Nueva Bodega'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${bodega?.bodIdBodega} • Código: ${bodega?.bodCodigo}` : 'Catálogo de Almacenes e Inventario'}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <TextInput
                label="CÓDIGO"
                required
                placeholder="Ej. BOD-01"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="NOMBRE DE LA BODEGA"
                required
                placeholder="Ej. Bodega Central, Bodega Materia Prima..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <TextInput
            label="DIRECCIÓN / UBICACIÓN FÍSICA"
            placeholder="Ej. Km 14.5 Carretera al Atlántico, Nave 3B..."
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            maxLength={250}
          />

          <div className="pt-2 space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <Checkbox
              label="Habilitada para Ventas y Despacho"
              helperText="Permite despachar pedidos y facturar directamente existencias de esta bodega."
              checked={permiteVentas}
              onChange={(e) => setPermiteVentas(e.target.checked)}
            />
            <Checkbox
              label="Bodega Activa"
              helperText="Las bodegas inactivas quedan bloqueadas para nuevas transferencias e ingresos."
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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Bodega'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
