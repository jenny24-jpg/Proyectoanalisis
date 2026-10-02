import React, { useState, useRef, useEffect } from 'react';
import {
  Building,
  HelpCircle,
  Paperclip,
  CheckCircle,
  Trash2,
  Plus,
  Package,
  ChevronDown,
  ChevronUp,
  Repeat,
  Ban,
  Tag,
  Search,
  Check,
  Edit3,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { TextInput, Select, Button } from '../../../components/ui';
import { IProveedor, IDetalleCotizacionInputDTO, IArticulo } from '@erp/contracts';
import { ICotizacionMatrizProveedorInput } from '../services/cotizacionClientService';
import { formatCurrency } from '../../../utils/formatters';
import { ProductoSustitutoModal, ProductoSustitutoData } from './ProductoSustitutoModal';

export interface ProveedorCotizacionCardProps {
  index: number; // 1, 2, or 3
  data: ICotizacionMatrizProveedorInput;
  proveedoresCatalogo?: IProveedor[];
  articulosCatalogo?: IArticulo[];
  onChange: (updatedData: ICotizacionMatrizProveedorInput) => void;
  onClear?: () => void;
  isDisabled?: boolean;
  isProveedorUnico?: boolean;
}

// Selector desplegable y buscador de artículos conectados a CMP_ARTICULO con soporte dual Catálogo / Sustituto
interface ArticuloSelectorProps {
  codigo: string;
  descripcion?: string;
  isSustituto?: boolean;
  observaciones?: string;
  articulosCatalogo: IArticulo[];
  isDisabled?: boolean;
  onSelectCatalogo: (codigo: string, descripcion: string) => void;
  onOpenSustitutoModal: () => void;
}

const ArticuloSelector: React.FC<ArticuloSelectorProps> = ({
  codigo,
  descripcion,
  isSustituto = false,
  observaciones,
  articulosCatalogo,
  isDisabled = false,
  onSelectCatalogo,
  onOpenSustitutoModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedArticulo = articulosCatalogo.find(
    (a) => a.ART_CODIGO_ARTICULO.toLowerCase() === (codigo || '').toLowerCase()
  );

  const filtered = articulosCatalogo.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.ART_CODIGO_ARTICULO.toLowerCase().includes(term) ||
      (a.ART_DESCRIPCION && a.ART_DESCRIPCION.toLowerCase().includes(term))
    );
  });

  // Si la línea está configurada en modo sustituto
  if (isSustituto) {
    return (
      <div className="relative w-full" ref={wrapperRef}>
        <div className="w-full min-h-[34px] px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50/70 text-amber-950 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
            <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300 shrink-0">
              {codigo || 'SUSTITUTO'}
            </span>
            <div className="truncate">
              <span className="font-bold text-xs text-amber-950 truncate block">
                {descripcion || 'Producto Sustituto Propuesto'}
              </span>
              {observaciones && (
                <span className="text-[10px] text-amber-800/80 truncate block">
                  {observaciones}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onOpenSustitutoModal}
              disabled={isDisabled}
              className="px-2 py-0.5 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors flex items-center gap-1"
              title="Editar especificaciones del producto sustituto"
            >
              <Edit3 size={11} />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={() => !isDisabled && setIsOpen(!isOpen)}
              disabled={isDisabled}
              className="px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-md transition-colors flex items-center gap-1"
              title="Cambiar por un artículo estándar del catálogo"
            >
              <ArrowRightLeft size={11} />
              <span className="hidden sm:inline">Catálogo</span>
            </button>
          </div>
        </div>

        {isOpen && !isDisabled && (
          <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[300px] sm:min-w-[400px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Reemplazar por artículo del catálogo (ej. ART-0001)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none placeholder-slate-400 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {filtered.map((art) => (
                <div
                  key={art.ART_CODIGO_ARTICULO}
                  onClick={() => {
                    onSelectCatalogo(art.ART_CODIGO_ARTICULO, art.ART_DESCRIPCION);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50/70 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                      {art.ART_CODIGO_ARTICULO}
                    </span>
                    <span className="font-medium text-slate-800 truncate">{art.ART_DESCRIPCION}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modo Catálogo Estándar
  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[34px] px-2.5 py-1 rounded-lg border flex items-center justify-between transition-all ${
          isDisabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-2xs cursor-pointer'
            : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
          <Tag size={13} className="text-blue-600 shrink-0" />
          <div className="truncate text-left flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-slate-800">
              {codigo || 'Seleccionar Artículo...'}
            </span>
            {(descripcion || selectedArticulo?.ART_DESCRIPCION) && (
              <span className="text-xs text-slate-500 truncate">
                — {descripcion || selectedArticulo?.ART_DESCRIPCION}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !isDisabled && (
        <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[300px] sm:min-w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* Search box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por código o nombre de artículo en catálogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none placeholder-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Catalog items list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No se encontraron artículos en el catálogo para "{searchTerm}".
              </div>
            ) : (
              filtered.map((art) => {
                const isSelected = art.ART_CODIGO_ARTICULO === codigo;
                return (
                  <div
                    key={art.ART_CODIGO_ARTICULO}
                    onClick={() => {
                      onSelectCatalogo(art.ART_CODIGO_ARTICULO, art.ART_DESCRIPCION);
                      setIsOpen(false);
                    }}
                    className={`px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/80 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                          {art.ART_CODIGO_ARTICULO}
                        </span>
                        <span className="truncate font-medium text-slate-800">{art.ART_DESCRIPCION}</span>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer option for opening substitute modal */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">¿El proveedor ofrece un alternativo?</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSustitutoModal();
              }}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200/90 px-3 py-1 rounded-xl border border-amber-300 transition-colors shadow-2xs"
            >
              <Repeat size={13} />
              <span>Registrar Producto Sustituto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProveedorCotizacionCard: React.FC<ProveedorCotizacionCardProps> = ({
  index,
  data,
  proveedoresCatalogo = [],
  articulosCatalogo = [],
  onChange,
  onClear,
  isDisabled = false,
  isProveedorUnico = false,
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);

  // Estado del Modal de Producto Sustituto
  const [substituteModalState, setSubstituteModalState] = useState<{
    isOpen: boolean;
    lineIdx: number | null;
    initialData?: Partial<ProductoSustitutoData>;
    sugerirCodigo?: string;
  }>({
    isOpen: false,
    lineIdx: null,
  });

  const handleFieldChange = (field: keyof ICotizacionMatrizProveedorInput, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleProveedorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    const selectedProv = proveedoresCatalogo.find((p) => p.proIdProveedor === selectedId);
    onChange({
      ...data,
      idProveedor: selectedId || undefined,
      nombreProveedor: selectedProv ? selectedProv.proNombreEntidad : '',
    });
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.includes(',') ? result.split(',')[1] : result;
      onChange({
        ...data,
        archivoPdfBase64: base64Content,
        archivoPdfNombre: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Manejo de la Grilla de Detalle de Artículos (CMP_DETALLE_COTIZACION)
  const currentDetalles: (IDetalleCotizacionInputDTO & { sinExistencias?: boolean })[] = (data.detalles || []).map(
    (d) => ({
      ...d,
      sinExistencias:
        (d as any).sinExistencias ??
        (Number(d.cantidadCotizada) === 0 && Number(d.precioUnitario) === 0),
    })
  );

  const updateDetallesAndTotal = (
    newDetalles: (IDetalleCotizacionInputDTO & { sinExistencias?: boolean })[]
  ) => {
    const calculatedTotal = newDetalles.reduce((acc, curr) => {
      if (curr.sinExistencias) return acc;
      const cant = Number(curr.cantidadCotizada || 0);
      const precio = Number(curr.precioUnitario || 0);
      const sub = curr.subtotalLinea !== undefined ? Number(curr.subtotalLinea) : +(cant * precio).toFixed(2);
      return acc + sub;
    }, 0);

    onChange({
      ...data,
      detalles: newDetalles,
      precioTotal: newDetalles.length > 0 ? calculatedTotal.toFixed(2) : data.precioTotal,
    });
  };

  const handleAddCatalogLine = () => {
    const defaultCatalogItem = articulosCatalogo[0];
    const newLine: IDetalleCotizacionInputDTO & { sinExistencias?: boolean } = {
      codigoArticulo: defaultCatalogItem?.ART_CODIGO_ARTICULO || `ART-${String(currentDetalles.length + 1).padStart(4, '0')}`,
      descripcionArticulo: defaultCatalogItem?.ART_DESCRIPCION || 'Artículo Adicional de Oferta',
      cantidadCotizada: 1,
      precioUnitario: '',
      subtotalLinea: 0,
      esSustituto: false,
      observaciones: '',
      sinExistencias: false,
    };
    updateDetallesAndTotal([...currentDetalles, newLine]);
  };

  const handleOpenSubstituteModalForNew = () => {
    setSubstituteModalState({
      isOpen: true,
      lineIdx: null,
      sugerirCodigo: undefined,
      initialData: {
        codigoSustituto: '',
        nombreSustituto: '',
        especificacionesTecnicas: '',
        unidadMedida: 'UNIDAD',
        cantidadCotizada: 1,
        precioUnitario: '',
      },
    });
  };

  const handleOpenSubstituteModalForEdit = (lineIdx: number) => {
    const line = currentDetalles[lineIdx];
    if (!line) return;
    const isAlreadySubstitute = Boolean(line.esSustituto);
    setSubstituteModalState({
      isOpen: true,
      lineIdx,
      sugerirCodigo: isAlreadySubstitute ? line.codigoArticulo : undefined,
      initialData: {
        codigoSustituto: isAlreadySubstitute ? line.codigoArticulo : '',
        nombreSustituto: isAlreadySubstitute ? (line.descripcionArticulo || '') : '',
        idMarca: line.idMarca ? Number(line.idMarca) : 1,
        idCategoria: line.idCategoria ? Number(line.idCategoria) : 1,
        idUnidadMedida: line.idUnidadMedida ? Number(line.idUnidadMedida) : 1,
        especificacionesTecnicas: line.observaciones || '',
        unidadMedida: 'UNIDAD',
        cantidadCotizada: Number(line.cantidadCotizada) || 1,
        precioUnitario: line.precioUnitario !== undefined ? line.precioUnitario : '',
      },
    });
  };

  const handleSaveSubstituteModal = (subData: ProductoSustitutoData) => {
    const cant = Number(subData.cantidadCotizada) || 1;
    const precio = Number(subData.precioUnitario) || 0;

    if (substituteModalState.lineIdx !== null) {
      // Edición de una línea existente
      const updated = currentDetalles.map((line, idx) => {
        if (idx !== substituteModalState.lineIdx) return line;
        return {
          ...line,
          codigoArticulo: subData.codigoSustituto,
          descripcionArticulo: subData.nombreSustituto,
          observaciones: subData.especificacionesTecnicas,
          idMarca: subData.idMarca,
          idCategoria: subData.idCategoria,
          idUnidadMedida: subData.idUnidadMedida,
          cantidadCotizada: cant,
          precioUnitario: subData.precioUnitario === '' ? '' : precio,
          subtotalLinea: +(cant * precio).toFixed(2),
          esSustituto: true,
          sinExistencias: false,
        };
      });
      updateDetallesAndTotal(updated);
    } else {
      // Creación de una nueva línea sustituta
      const newLine: IDetalleCotizacionInputDTO & { sinExistencias?: boolean } = {
        codigoArticulo: subData.codigoSustituto,
        descripcionArticulo: subData.nombreSustituto,
        observaciones: subData.especificacionesTecnicas,
        idMarca: subData.idMarca,
        idCategoria: subData.idCategoria,
        idUnidadMedida: subData.idUnidadMedida,
        cantidadCotizada: cant,
        precioUnitario: subData.precioUnitario === '' ? '' : precio,
        subtotalLinea: +(cant * precio).toFixed(2),
        esSustituto: true,
        sinExistencias: false,
      };
      updateDetallesAndTotal([...currentDetalles, newLine]);
    }
  };

  const handleRemoveDetailLine = (lineIdx: number) => {
    const updated = currentDetalles.filter((_, idx) => idx !== lineIdx);
    updateDetallesAndTotal(updated);
  };

  const handleToggleSinExistencias = (lineIdx: number) => {
    const updated = currentDetalles.map((line, idx) => {
      if (idx !== lineIdx) return line;
      const nowSinStock = !line.sinExistencias;
      return {
        ...line,
        sinExistencias: nowSinStock,
        subtotalLinea: nowSinStock ? 0 : +(Number(line.cantidadCotizada || 1) * Number(line.precioUnitario || 0)).toFixed(2),
        observaciones: nowSinStock
          ? (line.observaciones || 'Proveedor sin existencias / no disponible')
          : (line.observaciones === 'Proveedor sin existencias / no disponible' ? '' : line.observaciones),
      };
    });
    updateDetallesAndTotal(updated);
  };

  const handleToggleSustituto = (lineIdx: number) => {
    const line = currentDetalles[lineIdx];
    if (!line) return;

    if (!line.esSustituto) {
      // Abre el modal para capturar los datos del sustituto limpiamente
      handleOpenSubstituteModalForEdit(lineIdx);
    } else {
      // Revertir a artículo de catálogo estándar
      const matchingCatalog = articulosCatalogo.find((a) => a.ART_CODIGO_ARTICULO === line.codigoArticulo);
      const updated = currentDetalles.map((item, idx) => {
        if (idx !== lineIdx) return item;
        return {
          ...item,
          esSustituto: false,
          descripcionArticulo: matchingCatalog ? matchingCatalog.ART_DESCRIPCION : item.descripcionArticulo,
          observaciones: item.observaciones?.includes('sustituto') ? '' : item.observaciones,
        };
      });
      updateDetallesAndTotal(updated);
    }
  };

  const handleDetailChange = (
    lineIdx: number,
    field: keyof (IDetalleCotizacionInputDTO & { sinExistencias?: boolean }),
    value: any
  ) => {
    const updated = currentDetalles.map((line, idx) => {
      if (idx !== lineIdx) return line;

      const mod = { ...line, [field]: value };
      if (field === 'cantidadCotizada') {
        const parsed = parseInt(value, 10);
        mod.cantidadCotizada = isNaN(parsed) ? 1 : Math.max(1, parsed);
      }
      if (mod.sinExistencias) {
        mod.subtotalLinea = 0;
      } else {
        const cant = Number(mod.cantidadCotizada || 0);
        const precio = Number(mod.precioUnitario || 0);
        mod.subtotalLinea = +(cant * precio).toFixed(2);
      }
      return mod;
    });

    updateDetallesAndTotal(updated);
  };

  const isFilled = Boolean(
    data.idProveedor ||
      data.nombreProveedor.trim() ||
      data.precioTotal !== '' ||
      data.idCotizacion !== undefined
  );

  const proveedorOptions = proveedoresCatalogo.map((prov) => ({
    value: prov.proIdProveedor,
    label: `${prov.proNombreEntidad}${prov.proNit ? ` (NIT: ${prov.proNit})` : ''}`,
  }));

  if (data.idProveedor && !proveedorOptions.some((o) => o.value === data.idProveedor)) {
    proveedorOptions.unshift({
      value: data.idProveedor,
      label: data.nombreProveedor || `Proveedor #${data.idProveedor}`,
    });
  }

  return (
    <div
      className={`bg-white rounded-xl border p-3.5 sm:p-4 shadow-2xs space-y-3.5 transition-all duration-200 ${
        isDisabled
          ? 'opacity-40 bg-slate-50/70 select-none pointer-events-none border-slate-200'
          : isProveedorUnico
          ? 'border-amber-300 ring-1 ring-amber-200/60 shadow-xs hover:border-amber-400'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* ProductoSustitutoModal */}
      <ProductoSustitutoModal
        isOpen={substituteModalState.isOpen}
        onClose={() => setSubstituteModalState({ isOpen: false, lineIdx: null })}
        onSave={handleSaveSubstituteModal}
        initialData={substituteModalState.initialData}
        sugerirCodigo={substituteModalState.sugerirCodigo}
      />

      {/* Header with index badge, supplier summary & clear button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-6 h-6 rounded-lg font-extrabold text-xs flex items-center justify-center border shadow-2xs ${
              isProveedorUnico
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {isProveedorUnico ? '★' : index}
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span>{data.nombreProveedor || (isProveedorUnico ? 'Proveedor Único (Por asignar)' : `Proveedor ${index} (Por asignar)`)}</span>
              {isProveedorUnico && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Proveedor Exclusivo / Adjudicación Directa
                </span>
              )}
              {data.idProveedor && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  ID: {data.idProveedor}
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-400">
              {data.nombreProveedor
                ? (isProveedorUnico ? 'Propuesta económica y técnica del proveedor exclusivo' : 'Oferta económica y técnica registrada')
                : (isProveedorUnico ? 'Selecciona el proveedor exclusivo para registrar su cotización única' : 'Selecciona un proveedor para cargar su propuesta')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.precioTotal !== '' && !isNaN(Number(data.precioTotal)) && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
              <span className="text-[10px] text-emerald-600 font-normal">Total:</span>
              <span className="font-mono">{formatCurrency(Number(data.precioTotal))}</span>
            </div>
          )}

          {onClear && isFilled && !isDisabled && (
            <button
              type="button"
              onClick={onClear}
              className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-semibold border border-slate-200 hover:border-rose-200 shadow-2xs group"
              title="Descartar los datos de esta cotización"
            >
              <Trash2 size={12} className="text-slate-400 group-hover:text-rose-600" />
              <span>Descartar</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Datos Generales de la Cotización (Proveedor, Tiempos, Plazos, PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-start">
        {/* Selector Dinámico de Proveedor */}
        <div className="md:col-span-5">
          <Select
            label="PROVEEDOR"
            required
            icon={Building}
            placeholder="Seleccionar proveedor de la BD..."
            value={data.idProveedor || ''}
            onChange={handleProveedorSelect}
            options={proveedorOptions}
            isReadOnly={isDisabled}
          />
        </div>

        {/* Tiempo de Entrega */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center">
              ENTREGA (DÍAS)
            </label>
            <span title="Días calendario estimados para la entrega" className="text-slate-400">
              <HelpCircle size={12} />
            </span>
          </div>
          <TextInput
            placeholder="Ej. 7"
            type="number"
            value={data.tiempoEntregaDias}
            onChange={(e) => handleFieldChange('tiempoEntregaDias', e.target.value)}
            isReadOnly={isDisabled}
          />
        </div>

        {/* Plazo de Pago */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center">
              CONDICIÓN PAGO
            </label>
            <span title="Condición de crédito o pago" className="text-slate-400">
              <HelpCircle size={12} />
            </span>
          </div>
          <Select
            placeholder="Seleccionar..."
            value={data.plazoPago}
            onChange={(e) => handleFieldChange('plazoPago', e.target.value)}
            isReadOnly={isDisabled}
            options={[
              { value: 'Contado', label: 'Contado' },
              { value: '15 días', label: '15 días' },
              { value: '30 días', label: '30 días' },
              { value: '60 días', label: '60 días' },
            ]}
          />
        </div>

        {/* Cotización PDF upload button */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center">
              COTIZACIÓN PDF ADJUNTA
            </label>
            <span title="Documento escaneado o digital de la cotización" className="text-slate-400">
              <HelpCircle size={12} />
            </span>
          </div>

          <div className="relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              disabled={isDisabled}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <button
              type="button"
              disabled={isDisabled}
              className={`w-full h-[36px] px-3 rounded-xl border border-dashed text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                data.archivoPdfNombre
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              {data.archivoPdfNombre ? (
                <>
                  <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[140px]">{data.archivoPdfNombre}</span>
                </>
              ) : (
                <>
                  <Paperclip size={13} className="text-slate-400 shrink-0" />
                  <span>Adjuntar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: DESGLOSE POR LÍNEA DE ARTÍCULOS */}
      <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer text-slate-900 font-bold text-xs select-none hover:text-blue-700 transition-colors"
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          >
            <div className="p-1 rounded-md bg-blue-100 text-blue-700">
              <Package size={14} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800">Desglose de Artículos Cotizados</span>
              <span className="text-[11px] text-slate-500 font-normal ml-1.5">
                ({currentDetalles.length} {currentDetalles.length === 1 ? 'artículo' : 'artículos'})
              </span>
            </div>
            {isDetailsExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={handleAddCatalogLine}
              disabled={isDisabled}
              className="text-xs py-1 h-7.5 text-blue-700 hover:bg-blue-100/70 bg-white border border-blue-200 shadow-2xs font-semibold"
              title="Añadir un artículo estándar desde el catálogo"
            >
              + Añadir Artículo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Repeat}
              onClick={handleOpenSubstituteModalForNew}
              disabled={isDisabled}
              className="text-xs py-1 h-7.5 text-amber-800 hover:bg-amber-100 bg-amber-50 border border-amber-300 shadow-2xs font-semibold"
              title="Añadir una línea para cotizar un producto sustituto o alternativo"
            >
              + Producto Sustituto
            </Button>
          </div>
        </div>

        {isDetailsExpanded && (
          <div className="space-y-2 pt-0.5">
            {currentDetalles.length === 0 ? (
              <div className="p-3 bg-white rounded-lg border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  No hay artículos asignados a esta cotización. Utiliza "+ Añadir Artículo" o "+ Producto Sustituto" para comenzar.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentDetalles.map((line, lIdx) => {
                  const cant = Number(line.cantidadCotizada || 0);
                  const precio = Number(line.precioUnitario || 0);
                  const subtotal = line.sinExistencias ? 0 : +(cant * precio).toFixed(2);
                  const isSinStock = Boolean(line.sinExistencias);
                  const isSust = Boolean(line.esSustituto);

                  return (
                    <div
                      key={lIdx}
                      className={`p-2.5 sm:p-3 rounded-lg border transition-all text-xs space-y-2 ${
                        isSinStock
                          ? 'bg-slate-100/90 border-slate-300 opacity-80'
                          : isSust
                          ? 'bg-amber-50/70 border-amber-300 shadow-2xs ring-1 ring-amber-200/60'
                          : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      {/* Fila Principal de Controles */}
                      <div className="flex flex-wrap lg:flex-nowrap items-end gap-2 sm:gap-2.5">
                        {/* Selector de Artículo */}
                        <div className="flex-1 min-w-[260px]">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                            {isSust ? 'Producto Sustituto Propuesto' : 'Artículo / Producto Cotizado'}
                          </label>
                          <ArticuloSelector
                            codigo={line.codigoArticulo}
                            descripcion={line.descripcionArticulo}
                            isSustituto={isSust}
                            observaciones={line.observaciones || undefined}
                            articulosCatalogo={articulosCatalogo}
                            isDisabled={isDisabled || isSinStock}
                            onSelectCatalogo={(nuevoCodigo, nuevaDesc) => {
                              const updated = currentDetalles.map((d, idx) =>
                                idx === lIdx
                                  ? {
                                      ...d,
                                      codigoArticulo: nuevoCodigo,
                                      descripcionArticulo: nuevaDesc,
                                      esSustituto: false,
                                      observaciones: d.observaciones?.includes('sustituto') ? '' : d.observaciones,
                                    }
                                  : d
                              );
                              updateDetallesAndTotal(updated);
                            }}
                            onOpenSustitutoModal={() => handleOpenSubstituteModalForEdit(lIdx)}
                          />
                        </div>

                        {/* Cantidad */}
                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="1"
                            value={line.cantidadCotizada}
                            onKeyDown={(e) => {
                              if (['e', 'E', '.', ',', '-', '+'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => handleDetailChange(lIdx, 'cantidadCotizada', e.target.value)}
                            disabled={isDisabled || isSinStock}
                            className={`w-full h-[34px] px-2 text-xs text-center font-bold font-mono rounded-lg outline-none border transition-all ${
                              isSinStock
                                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                                : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                            }`}
                            title="Cantidad cotizada"
                          />
                        </div>

                        {/* Precio Unitario */}
                        <div className="w-28 sm:w-32 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                            Precio Unit. (Q)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0.00"
                            value={isSinStock ? '0.00' : (line.precioUnitario ?? '')}
                            onChange={(e) =>
                              handleDetailChange(
                                lIdx,
                                'precioUnitario',
                                e.target.value === '' ? '' : Number(e.target.value)
                              )
                            }
                            disabled={isDisabled || isSinStock}
                            className={`w-full h-[34px] px-2.5 text-xs text-right font-bold font-mono rounded-lg outline-none transition-all border ${
                              isSinStock
                                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                                : isSust
                                ? 'bg-amber-50 border-amber-300 text-amber-950 focus:bg-white focus:ring-2 focus:ring-amber-200'
                                : 'bg-blue-50/50 border-blue-300 text-blue-950 focus:bg-white focus:ring-2 focus:ring-blue-200'
                            }`}
                            title={isSinStock ? 'Artículo sin existencias (Precio Q0.00)' : 'Ingresa el precio unitario ofertado'}
                          />
                        </div>

                        {/* Subtotal Línea Calculado */}
                        <div className="w-28 sm:w-32 shrink-0">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5 text-right">
                            Subtotal
                          </label>
                          <div className="h-[34px] flex items-center justify-end px-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-xs">
                            {isSinStock ? (
                              <span className="text-slate-400 line-through">Q 0.00</span>
                            ) : (
                              <span className="text-slate-900">{formatCurrency(subtotal)}</span>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción alineados */}
                        <div className="flex items-center gap-1 pb-0.5 shrink-0">
                          {!isDisabled && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleSinExistencias(lIdx)}
                                className={`h-[34px] px-2 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                                  isSinStock
                                    ? 'text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 font-bold'
                                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200'
                                }`}
                                title={isSinStock ? 'Reactivar artículo (Proveedor tiene stock)' : 'Marcar Sin Stock / No Disponible'}
                              >
                                <Ban size={13} />
                                <span className="hidden sm:inline text-[10px] font-medium">
                                  {isSinStock ? 'Sin Stock' : 'Agotado'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleSustituto(lIdx)}
                                className={`h-[34px] px-2 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                                  isSust
                                    ? 'text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-400 font-bold'
                                    : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200'
                                }`}
                                title={isSust ? 'Editar datos del sustituto' : 'Convertir en Producto Sustituto'}
                              >
                                <Repeat size={13} />
                                <span className="hidden sm:inline text-[10px] font-medium">
                                  {isSust ? 'Sustituto' : 'Sustituto'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveDetailLine(lIdx)}
                                className="h-[34px] w-[34px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                                title="Eliminar línea de cotización"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Fila Inferior: Badges y Campo de Observación */}
                      <div className="pt-1.5 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSinStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <Ban size={10} /> Sin Stock
                            </span>
                          )}
                          {isSust && (
                            <button
                              type="button"
                              onClick={() => handleOpenSubstituteModalForEdit(lIdx)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors"
                              title="Haz clic para editar las especificaciones técnicas del sustituto"
                            >
                              <Repeat size={10} /> Sustituto <Edit3 size={9} className="ml-0.5 text-amber-700" />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            placeholder={
                              isSust
                                ? 'Especificaciones técnicas o notas del producto sustituto...'
                                : isSinStock
                                ? 'Observación sobre desabastecimiento o fecha estimada...'
                                : 'Observación, garantía o nota del artículo (opcional)...'
                            }
                            value={line.observaciones || ''}
                            onChange={(e) => handleDetailChange(lIdx, 'observaciones', e.target.value)}
                            disabled={isDisabled}
                            className={`w-full h-[30px] px-2.5 py-1 text-xs rounded-lg border outline-none transition-all ${
                              isSust
                                ? 'bg-amber-50/80 border-amber-300 text-amber-950 placeholder:text-amber-600/60 focus:bg-white focus:ring-1 focus:ring-amber-300'
                                : isSinStock
                                ? 'bg-rose-50/50 border-rose-200 text-rose-950 placeholder:text-rose-400 focus:bg-white'
                                : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-blue-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer de la Tarjeta con el Precio Total Cotizado */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <HelpCircle size={14} className="text-slate-400 shrink-0" />
          <span className="text-[11px]">
            {currentDetalles.length > 0
              ? `Total calculado sumando los subtotales de ${currentDetalles.filter(d => !d.sinExistencias).length} artículos con existencia.`
              : 'Ingresa los artículos o el precio global cotizado por el proveedor.'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PRECIO TOTAL COTIZADO
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Incluye impuestos</span>
          </div>
          <div className="w-full sm:w-44">
            <TextInput
              placeholder="Q 0.00"
              type="number"
              step="0.01"
              value={data.precioTotal}
              onChange={(e) => handleFieldChange('precioTotal', e.target.value)}
              isReadOnly={isDisabled}
              className="text-right font-mono font-bold text-sm bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
