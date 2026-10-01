import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRightLeft, Plus, Trash2, Printer, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { IMovimientoInventarioCreateDTO, IMovimientoInventarioDetalleCreateDTO } from '@erp/contracts';
import { MovimientoInventarioClientService } from '../services/movimientoInventarioClientService';

export interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (movimientoCreado: any, payload: IMovimientoInventarioCreateDTO) => void;
  bodegas: { id: number; nombre: string }[];
  articulos: { codigo: string; nombre: string }[];
  usuarios: { id: number; nombre: string }[];
}

// === Componente Auxiliar para Autocompletado con Estilos Corporativos ===
const AutocompleteSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  displayKey, 
  valueKey 
}: { 
  options: any[]; 
  value: any; 
  onChange: (val: any) => void; 
  placeholder: string;
  displayKey: string;
  valueKey: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt[valueKey] === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    String(opt[displayKey]).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(opt[valueKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-slate-400 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all text-xs sm:text-sm"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
          {selectedOption ? `${selectedOption[valueKey]} - ${selectedOption[displayKey]}` : placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400 shrink-0 ml-1" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-hidden flex flex-col animate-scaleUp">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 text-slate-400 bg-slate-50">
            <Search size={15} />
            <input
              type="text"
              autoFocus
              className="w-full text-xs outline-none text-slate-800 bg-transparent"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="overflow-y-auto divide-y divide-slate-50 text-xs">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt[valueKey]}
                  className="px-3 py-2.5 text-slate-700 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors"
                  onClick={() => {
                    onChange(opt[valueKey]);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-semibold text-slate-900 mr-2">{opt[valueKey]}</span>
                  <span className="text-slate-600 truncate">{opt[displayKey]}</span>
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-center text-slate-400 italic">No se encontraron opciones</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export const MovimientoModal: React.FC<MovimientoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bodegas,
  articulos,
  usuarios,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State (Master)
  const [idBodegaOrigen, setIdBodegaOrigen] = useState<number | ''>('');
  const [idBodegaDestino, setIdBodegaDestino] = useState<number | ''>('');
  const [idUsuario, setIdUsuario] = useState<number | ''>(usuarios[0]?.id || 1);
  const [observaciones, setObservaciones] = useState('');

  // Form State (Details)
  const [detalles, setDetalles] = useState<IMovimientoInventarioDetalleCreateDTO[]>([
    { codigoArticulo: '', cantidad: 1 }
  ]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (bodegas.length >= 2) {
        setIdBodegaOrigen(bodegas[0].id);
        setIdBodegaDestino(bodegas[1].id);
      } else if (bodegas.length === 1) {
        setIdBodegaOrigen(bodegas[0].id);
        setIdBodegaDestino('');
      }
      if (usuarios.length > 0) {
        setIdUsuario(usuarios[0].id);
      }
      setObservaciones('');
      setDetalles([{ codigoArticulo: articulos[0]?.codigo || '', cantidad: 1 }]);
    }
  }, [isOpen, bodegas, usuarios, articulos]);

  if (!isOpen) return null;

  const handleAddDetalle = () => {
    setDetalles([...detalles, { codigoArticulo: '', cantidad: 1 }]);
  };

  const handleRemoveDetalle = (index: number) => {
    if (detalles.length === 1) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleChangeDetalle = (index: number, field: keyof IMovimientoInventarioDetalleCreateDTO, value: any) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!idUsuario) {
      setErrorMsg('Seleccione un usuario responsable.');
      setIsLoading(false);
      return;
    }
    if (!idBodegaOrigen) {
      setErrorMsg('Seleccione la bodega de salida.');
      setIsLoading(false);
      return;
    }
    if (!idBodegaDestino) {
      setErrorMsg('Seleccione la bodega de entrada.');
      setIsLoading(false);
      return;
    }
    if (idBodegaOrigen === idBodegaDestino) {
      setErrorMsg('La bodega de salida y entrada no pueden ser iguales.');
      setIsLoading(false);
      return;
    }

    const validDetalles = detalles.filter(d => d.codigoArticulo?.trim() !== '' && d.cantidad > 0);

    if (validDetalles.length === 0) {
      setErrorMsg('Debe seleccionar al menos un artículo válido con cantidad mayor a 0.');
      setIsLoading(false);
      return;
    }

    try {
      const payload: IMovimientoInventarioCreateDTO = {
        tipoMovimiento: 'TRF_SALIDA',
        idBodegaOrigen: Number(idBodegaOrigen),
        idBodegaDestino: Number(idBodegaDestino),
        idUsuario: Number(idUsuario),
        observaciones: observaciones.trim() || undefined,
        detalles: validDetalles,
      };

      const res = await MovimientoInventarioClientService.crearMovimiento(payload);
      onSuccess(res, payload);
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error al procesar el traslado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scaleUp my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Nuevo Traslado de Inventario
              </h3>
              <p className="text-xs text-slate-500">
                Transferencia entre bodegas y despacho automático
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Rutas y Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                BODEGA DE SALIDA (ORIGEN) <span className="text-red-500">*</span>
              </label>
              <AutocompleteSelect 
                options={bodegas}
                value={idBodegaOrigen}
                onChange={(val) => setIdBodegaOrigen(val)}
                placeholder="Seleccione bodega origen..."
                displayKey="nombre"
                valueKey="id"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-700 block">
                BODEGA DE ENTRADA (DESTINO) <span className="text-red-500">*</span>
              </label>
              <AutocompleteSelect 
                options={bodegas.filter(b => b.id !== idBodegaOrigen)}
                value={idBodegaDestino}
                onChange={(val) => setIdBodegaDestino(val)}
                placeholder="Seleccione bodega destino..."
                displayKey="nombre"
                valueKey="id"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                USUARIO RESPONSABLE <span className="text-red-500">*</span>
              </label>
              <AutocompleteSelect 
                options={usuarios}
                value={idUsuario}
                onChange={(val) => setIdUsuario(val)}
                placeholder="Buscar responsable..."
                displayKey="nombre"
                valueKey="id"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                OBSERVACIONES / MOTIVO
              </label>
              <input 
                type="text" 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Reabastecimiento de sucursal..."
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Artículos a Trasladar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Artículos a Trasladar ({detalles.length})
              </span>
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddDetalle}>
                Agregar Renglón
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-2.5">Artículo / Producto</th>
                    <th className="px-3 py-2.5 w-28 text-center">Cantidad</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {detalles.map((detalle, index) => (
                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5">
                        <AutocompleteSelect 
                          options={articulos}
                          value={detalle.codigoArticulo}
                          onChange={(val) => handleChangeDetalle(index, 'codigoArticulo', val)}
                          placeholder="Buscar artículo..."
                          displayKey="nombre"
                          valueKey="codigo"
                        />
                      </td>
                      <td className="p-2.5">
                        <input 
                          type="number" 
                          min="1"
                          value={detalle.cantidad}
                          onChange={(e) => handleChangeDetalle(index, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-full h-10 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                          required
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveDetalle(index)}
                          disabled={detalles.length === 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors p-1.5 rounded-md hover:bg-rose-50"
                          title="Eliminar renglón"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isLoading} type="button">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={Printer} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              {isLoading ? 'Procesando...' : 'Aplicar e Imprimir'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
