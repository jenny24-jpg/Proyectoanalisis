import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Save, Trash2, AlertCircle, ChevronDown, Search, RefreshCw, Sparkles, Box, Tag, Scale, Briefcase } from 'lucide-react';
import { Button } from '../../../components/ui';
import { ISolicitudCompraCreateDTO, ISolicitudCompraDetalleCreateDTO, IArticulo } from '@erp/contracts';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';
import { articuloService } from '../../inventario/services/articulo.service';
import { CategoriaClientService } from '../../inventario/services/categoriaClientService';
import { MarcaClientService } from '../../inventario/services/marcaClientService';
import { UnidadMedidaClientService } from '../../inventario/services/unidadMedidaClientService';

interface SolicitudCreacionViewProps {
  onSuccess?: () => void;
  onReload?: () => void;
  isModal?: boolean;
}

const USUARIOS_RESPONSABLES = [
  { id: 1, nombre: 'Ana López - Compras y Adquisiciones' },
  { id: 2, nombre: 'Luis Ramírez - Gestión de Compras' },
  { id: 3, nombre: 'Marta Girón - Bodega e Inventario' },
];

// === Componente de Selección con Búsqueda y Refetch Automático ===
interface AutocompleteSelectProps {
  options: { codigo: string; nombre: string; categoriaId?: number; unidadId?: number }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  onTriggerRefetch?: () => Promise<void> | void;
  isLoading?: boolean;
}

const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  onTriggerRefetch,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.codigo === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    setSearchTerm('');
    if (nextState && onTriggerRefetch) {
      onTriggerRefetch();
    }
  };

  const filteredOptions = options.filter(
    (opt) =>
      opt.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className={`w-full min-h-[38px] px-3 py-1.5 bg-white border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={handleOpenDropdown}
      >
        <span className={`text-xs sm:text-sm truncate ${selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
          {selectedOption ? (
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {selectedOption.codigo}
              </span>
              <span>{selectedOption.nombre}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1 ml-2 text-slate-400">
          {isLoading && <RefreshCw size={14} className="animate-spin text-blue-600" />}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-fadeIn">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              autoFocus
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {onTriggerRefetch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerRefetch();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-200/60"
                title="Actualizar catálogo de artículos"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
          <ul className="overflow-y-auto divide-y divide-slate-50 max-h-52">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt.codigo}
                  className={`px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors ${
                    opt.codigo === value ? 'bg-blue-50/70 font-semibold text-blue-900' : 'text-slate-700'
                  }`}
                  onClick={() => {
                    onChange(opt.codigo);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                      {opt.codigo}
                    </span>
                    <span className="truncate">{opt.nombre}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                    Activo
                  </span>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-xs text-center text-slate-500 flex flex-col items-center gap-1">
                <span>No se encontraron artículos activos</span>
                <span className="text-[11px] text-slate-400">Si es nuevo, marque la casilla "Ítem Nuevo"</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export const SolicitudCreacionView: React.FC<SolicitudCreacionViewProps> = ({ onSuccess, onReload, isModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingArticles, setIsRefreshingArticles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State (Master)
  const [notas, setNotas] = useState('');
  const [idUsuarioResponsable, setIdUsuarioResponsable] = useState<number | ''>(1);
  const idDepartamento = 2; // Bodega / Logística

  // Catalogs State
  const [articulosActivos, setArticulosActivos] = useState<{ codigo: string; nombre: string; categoriaId?: number; unidadId?: number }[]>([]);
  const [categorias, setCategorias] = useState<{ value: number; label: string }[]>([]);
  const [marcas, setMarcas] = useState<{ value: number; label: string }[]>([]);
  const [unidades, setUnidades] = useState<{ value: number; label: string }[]>([]);
  const [siguienteCodigoBase, setSiguienteCodigoBase] = useState<string>('ART-0001');

  // Form State (Details)
  const [detalles, setDetalles] = useState<ISolicitudCompraDetalleCreateDTO[]>([
    { cantidadPedida: 1, isNuevo: false, codigoArticulo: '', idCategoria: 1, idMarca: 1, idUnidadMedida: 1 }
  ]);

  // Cargar Catálogo de Artículos Activos y Siguiente Código desde DB
  const loadArticulos = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshingArticles(true);
    try {
      const [data, nextCode] = await Promise.all([
        articuloService.obtenerActivos(),
        articuloService.obtenerSiguienteCodigo().catch(() => 'ART-0001'),
      ]);

      if (Array.isArray(data)) {
        const mapped = data
          .filter((a: IArticulo) => a.ART_ACTIVO === 1)
          .map((a: IArticulo) => ({
            codigo: a.ART_CODIGO_ARTICULO,
            nombre: a.ART_DESCRIPCION,
            categoriaId: a.ART_ID_CATEGORIA,
            unidadId: a.ART_ID_UNIDAD_COMPRA,
          }));
        setArticulosActivos(mapped);
      }

      if (nextCode) {
        setSiguienteCodigoBase(nextCode);
      }
    } catch (err: any) {
      console.error('[SolicitudCreacionView] Error al cargar artículos activos:', err);
    } finally {
      if (!silent) setIsRefreshingArticles(false);
    }
  }, []);

  // Cargar Catálogos Iniciales (Artículos Activos, Categorías, Marcas y Unidades de Medida)
  useEffect(() => {
    const loadInitialCatalogs = async () => {
      try {
        const [catData, marData, uniData] = await Promise.allSettled([
          CategoriaClientService.getCategorias({ activo: 1 }),
          MarcaClientService.getMarcas({ activo: 1 }),
          UnidadMedidaClientService.getUnidadesMedida({ activo: 1 }),
        ]);

        if (catData.status === 'fulfilled' && catData.value.length > 0) {
          setCategorias(catData.value.map((c) => ({ value: c.catIdCategoria, label: c.catNombreCategoria })));
        } else {
          setCategorias([
            { value: 1, label: 'Suministros de oficina' },
            { value: 2, label: 'Equipo de cómputo' },
            { value: 3, label: 'Mobiliario' },
          ]);
        }

        if (marData.status === 'fulfilled' && marData.value.length > 0) {
          setMarcas(marData.value.map((m) => ({ value: m.marIdMarca, label: m.marNombreMarca })));
        } else {
          setMarcas([
            { value: 1, label: 'HP' },
            { value: 2, label: 'Genérica' },
            { value: 3, label: 'Herman Miller' },
          ]);
        }

        if (uniData.status === 'fulfilled' && uniData.value.length > 0) {
          setUnidades(uniData.value.map((u) => ({ value: u.umeIdUnidad, label: `${u.umeNombreUnidad} (${u.umeAbreviatura})` })));
        } else {
          setUnidades([
            { value: 1, label: 'Unidad (UND)' },
            { value: 2, label: 'Caja (CJA)' },
            { value: 3, label: 'Resma (RSM)' },
          ]);
        }

        await loadArticulos(true);
      } catch (err) {
        console.error('[SolicitudCreacionView] Error cargando catálogos iniciales:', err);
      }
    };

    loadInitialCatalogs();
  }, [loadArticulos]);

  // Calcular código autoincrementable secuencial para cada fila nueva
  const getCalculatedItemCode = (currentIndex: number) => {
    const match = siguienteCodigoBase.match(/\d+/);
    const baseNumber = match ? parseInt(match[0], 10) : 1;
    const newItemsBefore = detalles.slice(0, currentIndex).filter((d) => d.isNuevo).length;
    const finalNumber = baseNumber + newItemsBefore;
    return `ART-${finalNumber.toString().padStart(4, '0')}`;
  };

  const handleAddDetalle = () => {
    const defaultCat = categorias[0]?.value || 1;
    const defaultMar = marcas[0]?.value || 1;
    const defaultUni = unidades[0]?.value || 1;
    setDetalles([
      ...detalles,
      {
        cantidadPedida: 1,
        isNuevo: false,
        codigoArticulo: '',
        idCategoria: defaultCat,
        idMarca: defaultMar,
        idUnidadMedida: defaultUni,
      },
    ]);
  };

  const handleRemoveDetalle = (index: number) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((_, i) => i !== index));
    }
  };

  const handleChangeDetalle = (index: number, field: keyof ISolicitudCompraDetalleCreateDTO, value: any) => {
    const newDetalles = [...detalles];
    const defaultCat = categorias[0]?.value || 1;
    const defaultMar = marcas[0]?.value || 1;
    const defaultUni = unidades[0]?.value || 1;

    if (field === 'isNuevo') {
      newDetalles[index] = {
        ...newDetalles[index],
        isNuevo: Boolean(value),
        codigoArticulo: '',
        nombreArticuloNuevo: '',
        idCategoria: newDetalles[index].idCategoria || defaultCat,
        idMarca: newDetalles[index].idMarca || defaultMar,
        idUnidadMedida: newDetalles[index].idUnidadMedida || defaultUni,
      };
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
      setErrorMsg('Debe seleccionar un responsable de compras para la solicitud.');
      setIsLoading(false);
      return;
    }

    // Validar detalles
    for (let i = 0; i < detalles.length; i++) {
      const item = detalles[i];
      if (item.isNuevo) {
        if (!item.nombreArticuloNuevo || item.nombreArticuloNuevo.trim() === '') {
          setErrorMsg(`Línea #${i + 1}: Debe ingresar el nombre/descripción del ítem nuevo.`);
          setIsLoading(false);
          return;
        }
        if (!item.idCategoria) {
          setErrorMsg(`Línea #${i + 1}: Debe seleccionar la categoría del ítem nuevo.`);
          setIsLoading(false);
          return;
        }
        if (!item.idMarca) {
          setErrorMsg(`Línea #${i + 1}: Debe seleccionar la marca del ítem nuevo.`);
          setIsLoading(false);
          return;
        }
        if (!item.idUnidadMedida) {
          setErrorMsg(`Línea #${i + 1}: Debe seleccionar la unidad de medida del ítem nuevo.`);
          setIsLoading(false);
          return;
        }
      } else {
        if (!item.codigoArticulo || item.codigoArticulo.trim() === '') {
          setErrorMsg(`Línea #${i + 1}: Debe seleccionar un artículo activo del catálogo o marcar "Ítem Nuevo".`);
          setIsLoading(false);
          return;
        }
      }

      const cant = Number(item.cantidadPedida);
      if (!item.cantidadPedida || !Number.isInteger(cant) || cant <= 0) {
        setErrorMsg(`Línea #${i + 1}: La cantidad requerida debe ser un número entero positivo mayor a 0 (sin decimales ni signos).`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload: ISolicitudCompraCreateDTO = {
        idUsuarioResponsable: Number(idUsuarioResponsable),
        idDepartamento,
        notas: notas.trim() || undefined,
        detalles: detalles.map((d) => ({
          cantidadPedida: Math.trunc(Number(d.cantidadPedida)),
          isNuevo: Boolean(d.isNuevo),
          codigoArticulo: d.isNuevo ? undefined : d.codigoArticulo,
          nombreArticuloNuevo: d.isNuevo ? d.nombreArticuloNuevo?.trim() : undefined,
          idCategoria: d.isNuevo ? Number(d.idCategoria || 1) : undefined,
          idMarca: d.isNuevo ? Number(d.idMarca || 1) : undefined,
          idUnidadMedida: d.isNuevo ? Number(d.idUnidadMedida || 1) : undefined,
        })),
      };

      const nuevaSolicitud = await SolicitudCompraClientService.crearSolicitud(payload);

      // Refetch artículos activos y nuevo código secuencial
      await loadArticulos(true);

      if (onReload) {
        onReload();
      }

      setSuccessMsg(`Solicitud creada exitosamente con número: ${nuevaSolicitud.solNoDocumento}`);
      setNotas('');
      setDetalles([
        {
          cantidadPedida: 1,
          isNuevo: false,
          codigoArticulo: '',
          idCategoria: categorias[0]?.value || 1,
          idMarca: marcas[0]?.value || 1,
          idUnidadMedida: unidades[0]?.value || 1,
        },
      ]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error al crear la solicitud de compra.');
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
            Ingrese los artículos activos a requerir o registre nuevos ítems para ser incorporados al catálogo y a la solicitud.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {/* Cabecera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Responsable Solicitante <span className="text-red-500">*</span>
            </label>
            <select
              value={idUsuarioResponsable}
              onChange={(e) => setIdUsuarioResponsable(Number(e.target.value))}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              required
            >
              {USUARIOS_RESPONSABLES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Notas o Justificación de Compra
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Reabastecimiento urgente para el área operativa..."
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Detalles / Artículos */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Box size={18} className="text-blue-600" />
                Líneas de Artículos Solicitados
              </h3>
              <p className="text-xs text-slate-500">
                Seleccione artículos activos de la base de datos o expanda la línea para registrar un ítem nuevo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadArticulos(false)}
                disabled={isRefreshingArticles}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                title="Sincronizar artículos activos con la base de datos"
              >
                <RefreshCw size={13} className={isRefreshingArticles ? 'animate-spin text-blue-600' : ''} />
                <span>Actualizar Catálogo</span>
              </button>
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddDetalle}>
                Añadir Línea
              </Button>
            </div>
          </div>

          {/* Tabla / Lista de Líneas */}
          <div className="space-y-3">
            {detalles.map((detalle, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all ${
                  detalle.isNuevo
                    ? 'bg-slate-50/90 border-slate-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Checkbox Ítem Nuevo */}
                  <div className="flex items-center gap-2 pt-2 md:w-32 shrink-0">
                    <label className="relative flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={detalle.isNuevo}
                        onChange={(e) => handleChangeDetalle(index, 'isNuevo', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={`text-xs font-bold ${detalle.isNuevo ? 'text-blue-700' : 'text-slate-600'}`}>
                        Ítem Nuevo
                      </span>
                    </label>
                    {detalle.isNuevo && (
                      <Sparkles size={14} className="text-blue-600 animate-pulse" />
                    )}
                  </div>

                  {/* Selector o Formulario Expandido */}
                  <div className="flex-1 space-y-3">
                    {detalle.isNuevo ? (
                      /* Formulario Expandido para Ítem Nuevo (Estilos Corporativos) */
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-blue-600" />
                            Nuevo Artículo en Catálogo Maestro
                          </span>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                            <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-tight">Auto-asignado:</span>
                            {getCalculatedItemCode(index)}
                          </span>
                        </div>

                        {/* Campo Nombre / Descripción */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Nombre o Descripción del Artículo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={detalle.nombreArticuloNuevo || ''}
                            onChange={(e) => handleChangeDetalle(index, 'nombreArticuloNuevo', e.target.value)}
                            placeholder="Ej. Monitor HP 27'' FHD 75Hz con HDMI..."
                            className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                            required
                          />
                        </div>

                        {/* Campos Obligatorios: Categoría, Marca y Unidad de Medida */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Tag size={12} className="text-slate-500" />
                              Categoría <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={detalle.idCategoria || categorias[0]?.value || 1}
                              onChange={(e) => handleChangeDetalle(index, 'idCategoria', Number(e.target.value))}
                              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                              required
                            >
                              {categorias.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Briefcase size={12} className="text-slate-500" />
                              Marca <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={detalle.idMarca || marcas[0]?.value || 1}
                              onChange={(e) => handleChangeDetalle(index, 'idMarca', Number(e.target.value))}
                              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                              required
                            >
                              {marcas.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Scale size={12} className="text-slate-500" />
                              Unidad de Medida <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={detalle.idUnidadMedida || unidades[0]?.value || 1}
                              onChange={(e) => handleChangeDetalle(index, 'idUnidadMedida', Number(e.target.value))}
                              className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                              required
                            >
                              {unidades.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Buscador de Artículos Activos */
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Artículo del Catálogo Activo <span className="text-red-500">*</span>
                        </label>
                        <AutocompleteSelect
                          options={articulosActivos}
                          value={detalle.codigoArticulo || ''}
                          onChange={(val) => handleChangeDetalle(index, 'codigoArticulo', val)}
                          placeholder="Buscar artículo activo en catálogo..."
                          onTriggerRefetch={() => loadArticulos(true)}
                          isLoading={isRefreshingArticles}
                        />
                      </div>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="w-full md:w-32 shrink-0 space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Cantidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={detalle.cantidadPedida}
                      onKeyDown={(e) => {
                        if (['e', 'E', '.', ',', '-', '+'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        handleChangeDetalle(index, 'cantidadPedida', isNaN(parsed) ? 1 : Math.max(1, parsed));
                      }}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 text-center font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  {/* Botón Eliminar Fila */}
                  <div className="pt-6 shrink-0 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveDetalle(index)}
                      disabled={detalles.length === 1}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Eliminar línea"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Total de líneas: <span className="font-bold text-slate-800">{detalles.length}</span>
          </div>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Registrando Solicitud...' : 'Enviar Solicitud de Compra'}
          </Button>
        </div>
      </form>
    </div>
  );
};

