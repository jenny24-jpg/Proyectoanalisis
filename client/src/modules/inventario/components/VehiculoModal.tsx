import React, { useState, useEffect } from 'react';
import { X, Truck, Save, AlertCircle, Calendar, Hash } from 'lucide-react';
import { Button, TextInput, Select } from '../../../components/ui';
import { IVehiculo, ICreateVehiculoDTO, IUpdateVehiculoDTO } from '@erp/contracts';
import { sanitizePlaca, sanitizeNominalText } from '../../../utils/sanitizers';

export interface VehiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateVehiculoDTO | IUpdateVehiculoDTO, id?: number) => Promise<void>;
  vehiculo?: IVehiculo | null;
}

export const VehiculoModal: React.FC<VehiculoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehiculo,
}) => {
  const isEditing = Boolean(vehiculo);
  const [placa, setPlaca] = useState<string>('');
  const [marca, setMarca] = useState<string>('');
  const [modelo, setModelo] = useState<string>('');
  const [anio, setAnio] = useState<string>('');
  const [estado, setEstado] = useState<'ACTIVO' | 'MANTENIMIENTO' | 'BAJA'>('ACTIVO');

  const [error, setError] = useState<string | null>(null);
  const [placaError, setPlacaError] = useState<string | null>(null);
  const [marcaError, setMarcaError] = useState<string | null>(null);
  const [modeloError, setModeloError] = useState<string | null>(null);
  const [anioError, setAnioError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (vehiculo) {
      setPlaca(vehiculo.vehPlaca);
      setMarca(vehiculo.vehMarca);
      setModelo(vehiculo.vehModelo);
      setAnio(vehiculo.vehAnio ? String(vehiculo.vehAnio) : '');
      setEstado(vehiculo.vehEstado);
    } else {
      setPlaca('');
      setMarca('');
      setModelo('');
      setAnio(String(new Date().getFullYear()));
      setEstado('ACTIVO');
    }
    setError(null);
    setPlacaError(null);
    setMarcaError(null);
    setModeloError(null);
    setAnioError(null);
  }, [vehiculo, isOpen]);

  if (!isOpen) return null;

  const handlePlacaChange = (val: string) => {
    const { sanitized, error: pErr } = sanitizePlaca(val);
    setPlaca(sanitized);
    setPlacaError(pErr);
  };

  const handleMarcaChange = (val: string) => {
    const { sanitized, error: mErr } = sanitizeNominalText(val);
    setMarca(sanitized);
    setMarcaError(mErr);
  };

  const handleModeloChange = (val: string) => {
    const { sanitized, error: modErr } = sanitizeNominalText(val);
    setModelo(sanitized);
    setModeloError(modErr);
  };

  const handleAnioChange = (val: string) => {
    const cleanNum = val.replace(/\D/g, '').slice(0, 4);
    setAnio(cleanNum);
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 2;

    if (cleanNum && (Number(cleanNum) < 1970 || Number(cleanNum) > maxYear)) {
      setAnioError(`El año debe estar entre 1970 y ${maxYear}.`);
    } else {
      setAnioError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPlaca = placa.trim().toUpperCase();
    const trimmedMarca = marca.trim();
    const trimmedModelo = modelo.trim();
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 2;

    if (!trimmedPlaca) {
      setPlacaError('La placa del vehículo es obligatoria.');
      setError('Por favor ingrese la placa del vehículo.');
      return;
    }

    if (trimmedPlaca.length < 3 || trimmedPlaca.length > 20) {
      setPlacaError('La placa debe tener entre 3 y 20 caracteres.');
      setError('Formato de placa inválido.');
      return;
    }

    if (!trimmedMarca) {
      setMarcaError('La marca del vehículo es obligatoria.');
      setError('Por favor ingrese la marca del vehículo.');
      return;
    }

    if (!trimmedModelo) {
      setModeloError('El modelo del vehículo es obligatorio.');
      setError('Por favor ingrese el modelo del vehículo.');
      return;
    }

    let parsedAnio: number | null = null;
    if (anio.trim()) {
      const num = Number(anio.trim());
      if (isNaN(num) || num < 1970 || num > maxYear) {
        setAnioError(`El año debe ser un número entre 1970 y ${maxYear}.`);
        setError('Por favor revise el año del vehículo.');
        return;
      }
      parsedAnio = num;
    }

    if (placaError || marcaError || modeloError || anioError) {
      setError('Por favor corrija los campos con error antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && vehiculo) {
        await onSave(
          {
            vehPlaca: trimmedPlaca,
            vehMarca: trimmedMarca,
            vehModelo: trimmedModelo,
            vehAnio: parsedAnio,
            vehEstado: estado,
          },
          vehiculo.vehIdVehiculo
        );
      } else {
        await onSave({
          vehPlaca: trimmedPlaca,
          vehMarca: trimmedMarca,
          vehModelo: trimmedModelo,
          vehAnio: parsedAnio,
          vehEstado: estado,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el vehículo.');
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${vehiculo?.vehIdVehiculo} - ${vehiculo?.vehPlaca}` : 'Flota de Transporte de la Empresa'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="PLACA VEHICULAR"
              required
              placeholder="Ej. P-123ABC, C-456XYZ"
              value={placa}
              onChange={(e) => handlePlacaChange(e.target.value)}
              autoFocus
              maxLength={20}
              error={placaError || undefined}
            />

            <TextInput
              label="AÑO DEL VEHÍCULO"
              placeholder="Ej. 2024"
              value={anio}
              onChange={(e) => handleAnioChange(e.target.value)}
              maxLength={4}
              error={anioError || undefined}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="MARCA"
              required
              placeholder="Ej. Toyota, Isuzu, Hino..."
              value={marca}
              onChange={(e) => handleMarcaChange(e.target.value)}
              maxLength={50}
              error={marcaError || undefined}
            />

            <TextInput
              label="MODELO / VERSIÓN"
              required
              placeholder="Ej. Hilux 2.8, Dyna 300..."
              value={modelo}
              onChange={(e) => handleModeloChange(e.target.value)}
              maxLength={50}
              error={modeloError || undefined}
            />
          </div>

          <Select
            label="ESTADO OPERATIVO"
            required
            value={estado}
            onChange={(e) => setEstado(e.target.value as any)}
            options={[
              { value: 'ACTIVO', label: 'ACTIVO (Disponible para rutas y entregas)' },
              { value: 'MANTENIMIENTO', label: 'MANTENIMIENTO (En taller o revisión mecánica)' },
              { value: 'BAJA', label: 'BAJA (Fuera de circulación)' },
            ]}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Vehículo' : 'Registrar Vehículo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
