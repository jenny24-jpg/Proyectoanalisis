import React, { useState, useEffect } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Checkbox } from '../../../components/ui';
import type { IProveedor, ICreateProveedorDTO, IUpdateProveedorDTO } from '@erp/contracts';

export const PROVEEDOR_NIT_MIN_LENGTH = 8;
export const PROVEEDOR_NIT_MAX_LENGTH = 13;

/**
 * Valida de forma estricta el formato y longitud del número de identificación (NIT / DPI) del proveedor.
 * Exige exclusivamente dígitos numéricos y una longitud de entre 8 y 13 caracteres.
 */
export function validarIdentificacionProveedor(nit?: string | null): { valido: boolean; mensaje?: string } {
  if (!nit || typeof nit !== 'string' || nit.trim() === '') {
    return {
      valido: false,
      mensaje: 'El número de identificación (NIT / DPI) es estrictamente obligatorio.',
    };
  }

  const trimmed = nit.trim();

  if (!/^[0-9]+$/.test(trimmed)) {
    return {
      valido: false,
      mensaje: 'El número de identificación (NIT / DPI) debe contener exclusivamente dígitos numéricos (0-9).',
    };
  }

  if (trimmed.length < PROVEEDOR_NIT_MIN_LENGTH || trimmed.length > PROVEEDOR_NIT_MAX_LENGTH) {
    return {
      valido: false,
      mensaje: `El número de identificación (NIT / DPI) debe tener entre ${PROVEEDOR_NIT_MIN_LENGTH} y ${PROVEEDOR_NIT_MAX_LENGTH} caracteres (actualmente tiene ${trimmed.length}).`,
    };
  }

  // Regla: Los NITs (menos de 13 dígitos) no pueden iniciar con cero.
  // Los DPIs de 13 dígitos sí pueden iniciar con cero (códigos de departamento 01 al 22 de Guatemala).
  if (trimmed.startsWith('0') && trimmed.length < 13) {
    return {
      valido: false,
      mensaje: 'El NIT no puede iniciar con cero (únicamente permitido para DPI de 13 dígitos).',
    };
  }

  return { valido: true };
}

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
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [nitError, setNitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Expresiones regulares de validación y seguridad
  const CARACTERES_PROHIBIDOS_REGEX = /[*\/@<>=;\\!$%#^?{}[\]~+&|`]/;
  const NOMBRE_PERMITIDO_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-]*$/;
  const NIT_NUMERICO_REGEX = /^[0-9]+$/;

  useEffect(() => {
    if (proveedor) {
      setNombreEntidad(proveedor.proNombreEntidad || '');
      // Saneamiento de NIT para proveedores existentes a solo dígitos (máximo 13)
      setNit((proveedor.proNit || '').replace(/\D/g, '').slice(0, PROVEEDOR_NIT_MAX_LENGTH));
      setActivo(proveedor.proActivo === 1);
    } else {
      setNombreEntidad('');
      setNit('');
      setActivo(true);
    }
    setError(null);
    setNombreError(null);
    setNitError(null);
  }, [proveedor, isOpen]);

  if (!isOpen) return null;

  // Validación y saneamiento en tiempo real para Nombre
  const handleNombreChange = (val: string) => {
    // Si intenta ingresar caracteres peligrosos como *, /, @, <, >, =, etc.
    if (CARACTERES_PROHIBIDOS_REGEX.test(val)) {
      setNombreError('No se permiten caracteres especiales no válidos (*, /, @, <, >, =, etc.).');
      // Filtra de inmediato el carácter peligroso
      const sanitized = val.replace(/[*\/@<>=;\\!$%#^?{}[\]~+&|`]/g, '');
      setNombreEntidad(sanitized);
      return;
    }

    if (val && !NOMBRE_PERMITIDO_REGEX.test(val)) {
      setNombreError('Solo se permiten letras, números, espacios, puntos y guiones.');
    } else {
      setNombreError(null);
    }

    setNombreEntidad(val);
  };

  // Validación y saneamiento en tiempo real para NIT / DPI (exclusivamente 8 a 13 números 0-9)
  const handleNitChange = (val: string) => {
    const hasNonNumeric = /[^0-9]/.test(val);
    // Limitar a máximo 13 dígitos numéricos en tiempo real
    const sanitized = val.replace(/\D/g, '').slice(0, PROVEEDOR_NIT_MAX_LENGTH);
    setNit(sanitized);

    if (hasNonNumeric) {
      setNitError('El número de identificación (NIT / DPI) acepta exclusivamente dígitos numéricos (0-9).');
    } else if (sanitized.startsWith('0') && sanitized.length < 13) {
      setNitError('El NIT no puede iniciar con cero (únicamente permitido para DPI de 13 dígitos).');
    } else if (sanitized.length > 0 && sanitized.length < PROVEEDOR_NIT_MIN_LENGTH) {
      setNitError(
        `La identificación (NIT / DPI) debe tener al menos ${PROVEEDOR_NIT_MIN_LENGTH} dígitos (actualmente tiene ${sanitized.length}).`
      );
    } else {
      setNitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasValidationErrors = false;

    // Validación estricta del Nombre
    const trimmedNombre = nombreEntidad.trim();
    if (!trimmedNombre) {
      setNombreError('El nombre o razón social del proveedor es obligatorio.');
      hasValidationErrors = true;
    } else if (trimmedNombre.length > 150) {
      setNombreError('El nombre no puede exceder los 150 caracteres.');
      hasValidationErrors = true;
    } else if (CARACTERES_PROHIBIDOS_REGEX.test(trimmedNombre)) {
      setNombreError('No se permiten caracteres especiales como *, /, @, <, >, =, etc.');
      hasValidationErrors = true;
    } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-]+$/.test(trimmedNombre)) {
      setNombreError('Solo se permiten letras, números, espacios, puntos y guiones comerciales.');
      hasValidationErrors = true;
    } else {
      setNombreError(null);
    }

    // Validación estricta del NIT / DPI (8 a 13 caracteres numéricos)
    const trimmedNit = nit.trim();
    const validacionNit = validarIdentificacionProveedor(trimmedNit);
    if (!validacionNit.valido) {
      setNitError(validacionNit.mensaje || 'Número de identificación (NIT / DPI) inválido.');
      hasValidationErrors = true;
    } else {
      setNitError(null);
    }

    if (hasValidationErrors) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && proveedor) {
        await onSave(
          {
            proNombreEntidad: trimmedNombre,
            proNit: trimmedNit || null,
            proActivo: activo ? 1 : 0,
          },
          proveedor.proIdProveedor
        );
      } else {
        await onSave({
          proNombreEntidad: trimmedNombre,
          proNit: trimmedNit || null,
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
            onChange={(e) => handleNombreChange(e.target.value)}
            error={nombreError || undefined}
            helperText="Solo se permiten letras, espacios, puntos y guiones. Caracteres como *, /, @, <, >, = están prohibidos."
            autoFocus
          />

          <TextInput
            label="NIT / DPI (IDENTIFICACIÓN TRIBUTARIA O PERSONAL)"
            required
            placeholder="Ej. 12345678 (8 a 13 dígitos)"
            value={nit}
            onChange={(e) => handleNitChange(e.target.value)}
            error={nitError || undefined}
            helperText="Mínimo 8 y máximo 13 dígitos numéricos (0-9). Los NITs no pueden iniciar con 0 (permitido para DPI de 13 dígitos)."
            maxLength={PROVEEDOR_NIT_MAX_LENGTH}
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
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isSubmitting} type="button">
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
