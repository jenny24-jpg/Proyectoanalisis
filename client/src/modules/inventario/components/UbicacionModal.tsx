import React, { useState, useEffect } from 'react';
import { X, MapPin, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Checkbox } from '../../../components/ui';
import { IUbicacion, ICreateUbicacionDTO, IUpdateUbicacionDTO, IBodega } from '@erp/contracts';
import { BodegaClientService } from '../services/bodegaClientService';
import { sanitizeStrictCode } from '../../../utils/sanitizers';

export interface UbicacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICreateUbicacionDTO | IUpdateUbicacionDTO, id?: number) => Promise<void>;
  ubicacion?: IUbicacion | null;
}

export const UbicacionModal: React.FC<UbicacionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  ubicacion,
}) => {
  const isEditing = Boolean(ubicacion);
  const [bodegas, setBodegas] = useState<IBodega[]>([]);
  const [idBodega, setIdBodega] = useState<number>(1);
  const [codigo, setCodigo] = useState<string>('');
  const [pasillo, setPasillo] = useState<string>('');
  const [rack, setRack] = useState<string>('');
  const [nivel, setNivel] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [pasilloError, setPasilloError] = useState<string | null>(null);
  const [rackError, setRackError] = useState<string | null>(null);
  const [nivelError, setNivelError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      BodegaClientService.getBodegas({ activo: 1 })
        .then((data) => {
          setBodegas(data);
          if (data.length > 0 && !ubicacion) {
            setIdBodega(data[0].bodIdBodega);
          }
        })
        .catch((err) => console.error('Error al cargar bodegas para ubicaciones:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (ubicacion) {
      setIdBodega(ubicacion.ubiIdBodega);
      setCodigo(ubicacion.ubiCodigoUbicacion);
      setPasillo(ubicacion.ubiPasillo || '');
      setRack(ubicacion.ubiRack || '');
      setNivel(ubicacion.ubiNivel || '');
      setActivo(ubicacion.ubiActivo === 1);
    } else {
      setCodigo('');
      setPasillo('');
      setRack('');
      setNivel('');
      setActivo(true);
    }
    setError(null);
    setCodigoError(null);
    setPasilloError(null);
    setRackError(null);
    setNivelError(null);
  }, [ubicacion, isOpen]);

  if (!isOpen) return null;

  const handleCodigoChange = (val: string) => {
    const { sanitized, error: codErr } = sanitizeStrictCode(val);
    setCodigo(sanitized);
    setCodigoError(codErr);
  };

  const handlePasilloChange = (val: string) => {
    const { sanitized, error: pErr } = sanitizeStrictCode(val);
    setPasillo(sanitized);
    setPasilloError(pErr);
  };

  const handleRackChange = (val: string) => {
    const { sanitized, error: rErr } = sanitizeStrictCode(val);
    setRack(sanitized);
    setRackError(rErr);
  };

  const handleNivelChange = (val: string) => {
    const { sanitized, error: nErr } = sanitizeStrictCode(val);
    setNivel(sanitized);
    setNivelError(nErr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoTrimmed = codigo.trim().toUpperCase();

    if (!codigoTrimmed) {
      setCodigoError('El código de la ubicación es obligatorio.');
      setError('Por favor complete los campos obligatorios.');
      return;
    }
    if (codigoTrimmed.length > 30) {
      setCodigoError('El código no puede exceder los 30 caracteres.');
      setError('Por favor revise los campos con error.');
      return;
    }

    if (codigoError || pasilloError || rackError || nivelError) {
      setError('Corrija los caracteres no válidos antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ICreateUbicacionDTO = {
        ubiIdBodega: idBodega,
        ubiCodigoUbicacion: codigoTrimmed,
        ubiPasillo: pasillo.trim() || null,
        ubiRack: rack.trim() || null,
        ubiNivel: nivel.trim() || null,
        ubiActivo: activo ? 1 : 0,
      };

      if (isEditing && ubicacion) {
        await onSave(payload, ubicacion.ubiIdUbicacion);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la ubicación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${ubicacion?.ubiIdUbicacion}` : 'Control de Posiciones y Racks'}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              BODEGA ASIGNADA
            </label>
            <select
              value={idBodega}
              onChange={(e) => setIdBodega(Number(e.target.value))}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
            >
              {bodegas.map((b) => (
                <option key={b.bodIdBodega} value={b.bodIdBodega}>
                  {b.bodNombre} ({b.bodCodigo})
                </option>
              ))}
            </select>
          </div>

          <TextInput
            label="CÓDIGO DE UBICACIÓN"
            required
            placeholder="Ej. A-01-R2, PAS-1-N3..."
            value={codigo}
            onChange={(e) => handleCodigoChange(e.target.value)}
            maxLength={30}
            autoFocus
            error={codigoError || undefined}
          />

          <div className="grid grid-cols-3 gap-2.5">
            <TextInput
              label="PASILLO"
              placeholder="Ej. P1"
              value={pasillo}
              onChange={(e) => handlePasilloChange(e.target.value)}
              maxLength={20}
              error={pasilloError || undefined}
            />
            <TextInput
              label="RACK"
              placeholder="Ej. R2"
              value={rack}
              onChange={(e) => handleRackChange(e.target.value)}
              maxLength={20}
              error={rackError || undefined}
            />
            <TextInput
              label="NIVEL"
              placeholder="Ej. N3"
              value={nivel}
              onChange={(e) => handleNivelChange(e.target.value)}
              maxLength={20}
              error={nivelError || undefined}
            />
          </div>

          <div className="pt-1">
            <Checkbox
              label="Ubicación Activa"
              helperText="Las ubicaciones inactivas no están disponibles para asignar existencias de inventario."
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Ubicación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
