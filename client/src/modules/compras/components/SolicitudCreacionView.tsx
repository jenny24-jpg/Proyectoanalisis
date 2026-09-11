import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Plus, Save, Trash2, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { Button } from '../../../components/ui';
import { ISolicitudCompraCreateDTO, ISolicitudCompraDetalleCreateDTO } from '@erp/contracts';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';

interface SolicitudCreacionViewProps {
  onSuccess?: () => void;
  onReload?: () => void;
  isModal?: boolean;
}

// === Mocks para los Selectores con Búsqueda ===
const MOCK_USUARIOS = [
  { id: 1, nombre: 'Ana López - Compras' },
  { id: 2, nombre: 'Luis Ramírez - Compras' },
  { id: 3, nombre: 'Marta Girón - Bodega' },
];

const MOCK_ARTICULOS = [
  { codigo: 'ART-0001', nombre: 'Laptop HP ProBook' },
  { codigo: 'ART-0002', nombre: 'Mouse Inalámbrico Logitech' },
  { codigo: 'ART-0003', nombre: 'Teclado Mecánico Keychron' },
  { codigo: 'ART-0004', nombre: 'Monitor Dell 24"' },
  { codigo: 'ART-0005', nombre: 'Resma de Papel Tamaño Carta' },
];

// === Componente Auxiliar para Autocompletado ===
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
        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
      >
        <span className={`text-sm truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? `${selectedOption[valueKey]} - ${selectedOption[displayKey]}` : placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 text-slate-400">
            <Search size={16} />
            <input
              type="text"
              autoFocus
              className="w-full text-sm outline-none text-slate-800"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt[valueKey]}
                  className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    onChange(opt[valueKey]);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-medium text-slate-900 mr-2">{opt[valueKey]}</span>
                  {opt[displayKey]}
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-sm text-center text-slate-500">No se encontraron resultados</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};


export const SolicitudCreacionView: React.FC<SolicitudCreacionViewProps> = ({ onSuccess, onReload, isModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State (Master)
  const [notas, setNotas] = useState('');
  const [idUsuarioResponsable, setIdUsuarioResponsable] = useState<number | ''>('');
  const idDepartamento = 2; // Bodega / Logística

  // Form State (Details)
  const [detalles, setDetalles] = useState<ISolicitudCompraDetalleCreateDTO[]>([
    { cantidadPedida: 1, isNuevo: false, codigoArticulo: '' }
  ]);

  // Calcular el código base más alto en BD
  const baseArticleCount = Math.max(0, ...MOCK_ARTICULOS.map(a => parseInt(a.codigo.split('-')[1], 10) || 0));

  const getNextArticleCode = (currentIndex: number) => {
    // Contamos cuántos isNuevo hay antes de esta fila para asignar números consecutivos
    const newItemsBefore = detalles.slice(0, currentIndex).filter(d => d.isNuevo).length;
    const nextNum = baseArticleCount + 1 + newItemsBefore;
    return `ART-${nextNum.toString().padStart(4, '0')}`;
  };

  const handleAddDetalle = () => {
    setDetalles([
      ...detalles,
      { cantidadPedida: 1, isNuevo: false, codigoArticulo: '' }
    ]);
  };

  const handleRemoveDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleChangeDetalle = (index: number, field: keyof ISolicitudCompraDetalleCreateDTO, value: any) => {
    const newDetalles = [...detalles];
    if (field === 'isNuevo') {
      newDetalles[index] = { ...newDetalles[index], isNuevo: value, codigoArticulo: '', nombreArticuloNuevo: '' };
    } else {
      newDetalles[index] = { ...newDetalles[index], [field]: value };
    }
    setDetalles(newDetalles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!idUsuarioResponsable) {
      setErrorMsg('Debe seleccionar un responsable.');
      setIsLoading(false);
      return;
    }

    const validDetalles = detalles.filter(d => 
      (d.isNuevo && d.nombreArticuloNuevo?.trim() !== '') || 
      (!d.isNuevo && d.codigoArticulo?.trim() !== '')
    );

    if (validDetalles.length === 0) {
      setErrorMsg('Debe seleccionar un artículo de la lista o completar el nombre del artículo nuevo.');
      setIsLoading(false);
      return;
    }

    try {
      const payload: ISolicitudCompraCreateDTO = {
        idUsuarioResponsable: Number(idUsuarioResponsable),
        idDepartamento,
        notas: notas.trim() || undefined,
        detalles: validDetalles.map((d) => ({
          ...d,
          codigoArticulo: d.isNuevo ? getNextArticleCode(detalles.indexOf(d)) : d.codigoArticulo
        }))
      };

      const nuevaSolicitud = await SolicitudCompraClientService.crearSolicitud(payload);
      
      // Ejecutar de inmediato la función encargada de recargar o consultar la lista de solicitudes
      if (onReload) {
        onReload();
      }

      setSuccessMsg(`Solicitud creada exitosamente con número: ${nuevaSolicitud.solNoDocumento}`);
      
      setNotas('');
      setIdUsuarioResponsable('');
      setDetalles([{ cantidadPedida: 1, isNuevo: false, codigoArticulo: '' }]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error al crear la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${isModal ? 'pb-2' : 'pb-12'}`}>
      {!isModal && (
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingCart className="text-blue-600" size={28} />
            Nueva Solicitud de Compra
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ingrese los artículos que necesita reabastecer en bodega o solicite artículos nuevos.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium flex items-center gap-2">
          <AlertCircle size={18} />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* Cabecera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Responsable</label>
            <AutocompleteSelect 
              options={MOCK_USUARIOS}
              value={idUsuarioResponsable}
              onChange={(val) => setIdUsuarioResponsable(val)}
              placeholder="Buscar responsable..."
              displayKey="nombre"
              valueKey="id"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Notas Adicionales</label>
            <input 
              type="text" 
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Reabastecimiento urgente de papelería..."
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Detalles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Líneas de Solicitud</h3>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddDetalle}>
              Agregar Línea
            </Button>
          </div>

          <div className="overflow-x-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold w-20 text-center">Ítem Nuevo</th>
                  <th className="pb-3 font-semibold">Artículo (Buscar o Nombre Nuevo)</th>
                  <th className="pb-3 font-semibold w-32 text-center">Cantidad</th>
                  <th className="pb-3 font-semibold w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detalles.map((detalle, index) => (
                  <tr key={index} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-3 text-center align-top pt-5">
                      <input 
                        type="checkbox" 
                        checked={detalle.isNuevo}
                        onChange={(e) => handleChangeDetalle(index, 'isNuevo', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-600 cursor-pointer"
                        title="Marcar si es un artículo que no existe en el inventario"
                      />
                    </td>
                    <td className="py-3 pr-4 align-top pt-4">
                      {detalle.isNuevo ? (
                        <div className="flex items-center w-full h-9 bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                          <span className="px-3 py-2 bg-slate-100 text-slate-500 font-medium text-xs border-r border-slate-200 select-none whitespace-nowrap">
                            {getNextArticleCode(index)}
                          </span>
                          <input 
                            type="text" 
                            value={detalle.nombreArticuloNuevo || ''}
                            onChange={(e) => handleChangeDetalle(index, 'nombreArticuloNuevo', e.target.value)}
                            placeholder="Nombre del artículo nuevo..."
                            className="flex-1 px-3 h-full outline-none text-sm text-slate-800"
                            required
                          />
                        </div>
                      ) : (
                        <AutocompleteSelect 
                          options={MOCK_ARTICULOS}
                          value={detalle.codigoArticulo}
                          onChange={(val) => handleChangeDetalle(index, 'codigoArticulo', val)}
                          placeholder="Buscar artículo en base de datos..."
                          displayKey="nombre"
                          valueKey="codigo"
                        />
                      )}
                    </td>
                    <td className="py-3 px-2 align-top pt-4">
                      <input 
                        type="number" 
                        min="1"
                        value={detalle.cantidadPedida}
                        onChange={(e) => handleChangeDetalle(index, 'cantidadPedida', parseInt(e.target.value) || 1)}
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 text-center focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        required
                      />
                    </td>
                    <td className="py-3 text-center align-top pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveDetalle(index)}
                        disabled={detalles.length === 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50 transition-colors p-2 rounded-lg hover:bg-red-50 mt-[-4px]"
                        title="Eliminar fila"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button 
            type="submit" 
            variant="primary" 
            icon={Save} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Guardando...' : 'Enviar Solicitud'}
          </Button>
        </div>
      </form>
    </div>
  );
};
