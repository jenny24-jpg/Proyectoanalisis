import React, { useState, useEffect } from 'react';
import { X, UserCheck, Save, AlertCircle, IdCard, ShieldAlert, Calendar } from 'lucide-react';
import { Button, TextInput, Select } from '../../../components/ui';
import { IConductor, ICreateConductorDTO, IUpdateConductorDTO, IEmpleadoOption } from '@erp/contracts';
import { sanitizeDpiGuatemala, validateLicenciaVencimiento, sanitizeNominalText } from '../../../utils/sanitizers';
import { ConductorClientService } from '../services/conductorClientService';

export interface ConductorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateConductorDTO | IUpdateConductorDTO, id?: number) => Promise<void>;
  conductor?: IConductor | null;
}

export const ConductorModal: React.FC<ConductorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  conductor,
}) => {
  const isEditing = Boolean(conductor);
  const [empleados, setEmpleados] = useState<IEmpleadoOption[]>([]);
  const [idEmpleado, setIdEmpleado] = useState<string>('');
  const [dpi, setDpi] = useState<string>('');
  const [tipoLicencia, setTipoLicencia] = useState<'A' | 'B' | 'C' | 'M'>('B');
  const [noLicencia, setNoLicencia] = useState<string>('');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');
  const [estado, setEstado] = useState<'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO'>('ACTIVO');

  const [error, setError] = useState<string | null>(null);
  const [dpiError, setDpiError] = useState<string | null>(null);
  const [noLicenciaError, setNoLicenciaError] = useState<string | null>(null);
  const [fechaError, setFechaError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      ConductorClientService.getEmpleados().then((emps) => {
        setEmpleados(emps);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (conductor) {
      setIdEmpleado(String(conductor.conIdEmpleado));
      setDpi(conductor.conDpi);
      setTipoLicencia(conductor.conTipoLicencia);
      setNoLicencia(conductor.conNoLicencia);
      setFechaVencimiento(conductor.conFechaVencimientoLic);
      setEstado(conductor.conEstado);
    } else {
      setIdEmpleado('');
      setDpi('');
      setTipoLicencia('B');
      setNoLicencia('');
      // Fecha por defecto 3 años en el futuro
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 3);
      setFechaVencimiento(defaultExp.toISOString().slice(0, 10));
      setEstado('ACTIVO');
    }
    setError(null);
    setDpiError(null);
    setNoLicenciaError(null);
    setFechaError(null);
  }, [conductor, isOpen]);

  if (!isOpen) return null;

  const handleDpiChange = (val: string) => {
    const { sanitized, error: dErr } = sanitizeDpiGuatemala(val);
    setDpi(sanitized);
    setDpiError(dErr);
  };

  const handleNoLicenciaChange = (val: string) => {
    const upper = val.toUpperCase().trim();
    setNoLicencia(upper);
    if (upper.length < 3) {
      setNoLicenciaError('El número de licencia debe tener al menos 3 caracteres.');
    } else {
      setNoLicenciaError(null);
    }
  };

  const handleFechaChange = (val: string) => {
    setFechaVencimiento(val);
    if (estado === 'ACTIVO') {
      const err = validateLicenciaVencimiento(val);
      setFechaError(err);
    } else {
      setFechaError(null);
    }
  };

  const handleEmpleadoChange = (empIdStr: string) => {
    setIdEmpleado(empIdStr);
    const selectedEmp = empleados.find((e) => String(e.idEmpleado) === empIdStr);
    // Si el empleado tiene DPI precargado y el DPI del form está vacío
    if (selectedEmp?.dpi && !dpi) {
      const { sanitized } = sanitizeDpiGuatemala(selectedEmp.dpi);
      if (sanitized.length === 13) {
        setDpi(sanitized);
        setDpiError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idEmpleado) {
      setError('Debe seleccionar un empleado para asociar el conductor.');
      return;
    }

    const cleanDpi = dpi.trim().replace(/[\s\-]/g, '');
    if (!cleanDpi || cleanDpi.length !== 13 || !/^\d{13}$/.test(cleanDpi)) {
      setDpiError('El DPI debe contener exactamente 13 dígitos numéricos.');
      setError('Revise el DPI ingresado.');
      return;
    }

    const cleanNoLic = noLicencia.trim().toUpperCase();
    if (!cleanNoLic) {
      setNoLicenciaError('El número de licencia es obligatorio.');
      setError('Ingrese el número de licencia.');
      return;
    }

    if (!fechaVencimiento) {
      setFechaError('La fecha de vencimiento es obligatoria.');
      setError('Ingrese la fecha de vencimiento de la licencia.');
      return;
    }

    if (estado === 'ACTIVO') {
      const vencErr = validateLicenciaVencimiento(fechaVencimiento);
      if (vencErr) {
        setFechaError(vencErr);
        setError(vencErr);
        return;
      }
    }

    if (dpiError || noLicenciaError || fechaError) {
      setError('Por favor corrija los campos con error antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && conductor) {
        await onSave(
          {
            conIdEmpleado: Number(idEmpleado),
            conDpi: cleanDpi,
            conTipoLicencia: tipoLicencia,
            conNoLicencia: cleanNoLic,
            conFechaVencimientoLic: fechaVencimiento,
            conEstado: estado,
          },
          conductor.conIdConductor
        );
      } else {
        await onSave({
          conIdEmpleado: Number(idEmpleado),
          conDpi: cleanDpi,
          conTipoLicencia: tipoLicencia,
          conNoLicencia: cleanNoLic,
          conFechaVencimientoLic: fechaVencimiento,
          conEstado: estado,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el conductor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const empleadoOptions = [
    { value: '', label: '-- Seleccione un Empleado --' },
    ...empleados.map((emp) => ({
      value: String(emp.idEmpleado),
      label: `${emp.nombreCompleto} (ID #${emp.idEmpleado})`,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${conductor?.conIdConductor} - ${conductor?.conNombreEmpleado}` : 'Padrón Oficial de Choferes de la Empresa'}
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

          <Select
            label="EMPLEADO TITULAR *"
            required
            value={idEmpleado}
            onChange={(e) => handleEmpleadoChange(e.target.value)}
            options={empleadoOptions}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <TextInput
                label="DPI (13 DÍGITOS GUATEMALA) *"
                required
                placeholder="Ej. 2489123450101"
                value={dpi}
                onChange={(e) => handleDpiChange(e.target.value)}
                maxLength={13}
                error={dpiError || undefined}
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                {dpi.length}/13 dígitos numéricos
              </span>
            </div>

            <Select
              label="TIPO DE LICENCIA *"
              required
              value={tipoLicencia}
              onChange={(e) => setTipoLicencia(e.target.value as any)}
              options={[
                { value: 'A', label: 'TIPO A - Transporte Pesado / Trailer' },
                { value: 'B', label: 'TIPO B - Transporte Liviano / Camiones' },
                { value: 'C', label: 'TIPO C - Vehículos Particulares' },
                { value: 'M', label: 'TIPO M - Motocicletas' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="NÚMERO DE LICENCIA *"
              required
              placeholder="Ej. LIC-998877 o DPI"
              value={noLicencia}
              onChange={(e) => handleNoLicenciaChange(e.target.value)}
              maxLength={50}
              error={noLicenciaError || undefined}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                VENCIMIENTO LICENCIA *
              </label>
              <input
                type="date"
                required
                value={fechaVencimiento}
                onChange={(e) => handleFechaChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  fechaError ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                }`}
              />
              {fechaError && (
                <span className="text-[11px] text-red-600 block mt-1 font-medium">
                  {fechaError}
                </span>
              )}
            </div>
          </div>

          <Select
            label="ESTADO DEL CONDUCTOR *"
            required
            value={estado}
            onChange={(e) => setEstado(e.target.value as any)}
            options={[
              { value: 'ACTIVO', label: 'ACTIVO (Habilitado para conducir y despachos)' },
              { value: 'SUSPENDIDO', label: 'SUSPENDIDO (Temporalmente no autorizado)' },
              { value: 'INACTIVO', label: 'INACTIVO (Baja o desvinculado)' },
            ]}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Conductor' : 'Registrar Conductor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
