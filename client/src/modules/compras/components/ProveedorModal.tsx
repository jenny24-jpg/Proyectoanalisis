import React, { useState, useEffect } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Checkbox } from '../../../components/ui';
import { IProveedor, ICreateProveedorDTO, IUpdateProveedorDTO } from '@erp/contracts';

export interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateProveedorDTO | IUpdateProveedorDTO, id?: number) => Promise<void>;
  proveedor?: IProveedor | null;
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  proveedor,
}) => {
  const isEditing = Boolean(proveedor);
  const [nombreEntidad, setNombreEntidad] = useState<string>('');
  const [nit, setNit] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (proveedor) {
      setNombreEntidad(proveedor.proNombreEntidad || '');
      setNit(proveedor.proNit || '');
      setActivo(proveedor.proActivo === 1);
    } else {
      setNombreEntidad('');
      setNit('');
      setActivo(true);
    }
    setError(null);
  }, [proveedor, isOpen]);

  if (!isOpen) return null;

  const handleNitChange = (val: string) => {
    // Convierte el texto a mayúsculas y permite únicamente números, guiones y la letra K
    const sanitized = val.toUpperCase().replace(/[^0-9\-K]/g, '');
    setNit(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreEntidad.trim()) {
      setError('El nombre o razón social del proveedor es obligatorio.');
      return;
    }

    if (nombreEntidad.trim().length > 150) {
      setError('El nombre no puede exceder los 150 caracteres.');
      return;
    }

    if (!nit.trim()) {
      setError('El NIT del proveedor es estrictamente obligatorio.');
      return;
    }

    const nitNormalized = nit.trim().toUpperCase();

    if (nitNormalized === 'CF') {
      setError('No se permite registrar proveedores con "CF". Debe ingresar un número de NIT válido.');
      return;
    }

    if (nitNormalized.length > 50) {
      setError('El NIT no puede exceder los 50 caracteres.');
      return;
    }

    const nitRegex = /^[0-9]+(-[0-9K])?$/;
    if (!nitRegex.test(nitNormalized)) {
      setError('El formato del NIT es inválido. Debe contener únicamente números y opcionalmente un guion con dígito verificador (ej. 1234567-8, 1234567-K). No se admite "CF".');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && proveedor) {
        await onSave(
          {
            proNombreEntidad: nombreEntidad.trim(),
            proNit: nit.trim() || null,
            proActivo: activo ? 1 : 0,
          },
          proveedor.proIdProveedor
        );
      } else {
        await onSave({
          proNombreEntidad: nombreEntidad.trim(),
          proNit: nit.trim() || null,
          proActivo: activo ? 1 : 0,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el proveedor.');
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
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${proveedor?.proIdProveedor}` : 'Catálogo de Compras'}
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
            label="NOMBRE O RAZÓN SOCIAL"
            required
            placeholder="Ej. Distribuidora Central, S.A."
            value={nombreEntidad}
            onChange={(e) => setNombreEntidad(e.target.value)}
            autoFocus
          />

          <TextInput
            label="NIT / IDENTIFICACIÓN TRIBUTARIA"
            required
            placeholder="Ej. 1234567-8, 1234567-K"
            value={nit}
            onChange={(e) => handleNitChange(e.target.value)}
            helperText="Obligatorio. Solo números y opcionalmente guion con dígito verificador (0-9, K). No se permite CF."
          />

          <div className="pt-1">
            <Checkbox
              label="Proveedor Activo"
              helperText="Los proveedores inactivos no estarán disponibles para nuevas cotizaciones u órdenes de compra."
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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
