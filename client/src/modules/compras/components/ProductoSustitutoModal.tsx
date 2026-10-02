import React, { useState, useEffect } from 'react';
import { X, Sparkles, Repeat, DollarSign, Check, Tag, ShieldCheck, Lock } from 'lucide-react';
import { Button, TextInput, Select, TextArea } from '../../../components/ui';
import { formatCurrency } from '../../../utils/formatters';
import { MarcaClientService } from '../../inventario/services/marcaClientService';
import { UnidadMedidaClientService } from '../../inventario/services/unidadMedidaClientService';
import { CategoriaClientService } from '../../inventario/services/categoriaClientService';
import { articuloService } from '../../inventario/services/articulo.service';

export interface ProductoSustitutoData {
  codigoSustituto: string;
  nombreSustituto: string;
  idMarca?: number;
  nombreMarca?: string;
  idCategoria?: number;
  idUnidadMedida?: number;
  unidadMedida?: string;
  especificacionesTecnicas: string;
  cantidadCotizada: number;
  precioUnitario: number | string;
}

export interface ProductoSustitutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductoSustitutoData) => void;
  initialData?: Partial<ProductoSustitutoData>;
  sugerirCodigo?: string;
}

export const ProductoSustitutoModal: React.FC<ProductoSustitutoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  sugerirCodigo,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [idMarca, setIdMarca] = useState<number>(1);
  const [idCategoria, setIdCategoria] = useState<number>(1);
  const [idUnidad, setIdUnidad] = useState<number>(1);
  const [especificaciones, setEspecificaciones] = useState('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioUnitario, setPrecioUnitario] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Dynamic Options from DB
  const [marcas, setMarcas] = useState<{ value: number; label: string }[]>([]);
  const [categorias, setCategorias] = useState<{ value: number; label: string }[]>([]);
  const [unidades, setUnidades] = useState<{ value: number; label: string }[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState<boolean>(false);

  // Carga de catálogos reales desde la base de datos
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoadingCatalogs(true);
      try {
        const [marData, catData, uniData] = await Promise.allSettled([
          MarcaClientService.getMarcas({ activo: 1 }),
          CategoriaClientService.getCategorias({ activo: 1 }),
          UnidadMedidaClientService.getUnidadesMedida({ activo: 1 }),
        ]);

        if (!isMounted) return;

        if (marData.status === 'fulfilled' && marData.value.length > 0) {
          setMarcas(marData.value.map((m) => ({ value: m.marIdMarca, label: m.marNombreMarca })));
        } else {
          setMarcas([{ value: 1, label: 'Marca Estándar / Genérica' }]);
        }

        if (catData.status === 'fulfilled' && catData.value.length > 0) {
          setCategorias(catData.value.map((c) => ({ value: c.catIdCategoria, label: c.catNombreCategoria })));
        } else {
          setCategorias([{ value: 1, label: 'Categoría General' }]);
        }

        if (uniData.status === 'fulfilled' && uniData.value.length > 0) {
          setUnidades(
            uniData.value.map((u) => ({
              value: u.umeIdUnidad,
              label: `${u.umeNombreUnidad} (${u.umeAbreviatura})`,
            }))
          );
        } else {
          setUnidades([{ value: 1, label: 'Unidad (UND)' }]);
        }
      } catch (err) {
        console.error('[ProductoSustitutoModal] Error al cargar catálogos desde BD:', err);
      } finally {
        if (isMounted) setIsLoadingCatalogs(false);
      }
    };

    const loadNextSkuCode = async () => {
      if (initialData?.codigoSustituto) {
        setCodigo(initialData.codigoSustituto);
      } else if (sugerirCodigo) {
        setCodigo(sugerirCodigo);
      } else {
        try {
          const nextSku = await articuloService.obtenerSiguienteCodigo();
          if (isMounted) setCodigo(nextSku);
        } catch (_err) {
          if (isMounted) setCodigo(`ART-${Date.now().toString().slice(-4)}`);
        }
      }
    };

    loadData();
    loadNextSkuCode();

    // Valores iniciales
    setNombre(initialData?.nombreSustituto || '');
    setIdMarca(initialData?.idMarca ? Number(initialData.idMarca) : 1);
    setIdCategoria(initialData?.idCategoria ? Number(initialData.idCategoria) : 1);
    setIdUnidad(initialData?.idUnidadMedida ? Number(initialData.idUnidadMedida) : 1);
    setEspecificaciones(initialData?.especificacionesTecnicas || '');
    setCantidad(initialData?.cantidadCotizada ? Number(initialData.cantidadCotizada) : 1);
    setPrecioUnitario(initialData?.precioUnitario !== undefined ? String(initialData.precioUnitario) : '');
    setError(null);

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData, sugerirCodigo]);

  if (!isOpen) return null;

  const numCant = Math.max(1, Number(cantidad) || 1);
  const numPrecio = Number(precioUnitario) || 0;
  const subtotal = +(numCant * numPrecio).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre o descripción del producto sustituto es obligatorio.');
      return;
    }
    if (!codigo.trim()) {
      setError('El código SKU correlativo es obligatorio.');
      return;
    }

    const selectedMarca = marcas.find((m) => m.value === idMarca)?.label || 'Marca Genérica';
    const selectedUnidad = unidades.find((u) => u.value === idUnidad)?.label || 'Unidad (UND)';

    onSave({
      codigoSustituto: codigo.trim().toUpperCase(),
      nombreSustituto: nombre.trim(),
      idMarca,
      nombreMarca: selectedMarca,
      idCategoria,
      idUnidadMedida: idUnidad,
      unidadMedida: selectedUnidad,
      especificacionesTecnicas: especificaciones.trim(),
      cantidadCotizada: numCant,
      precioUnitario: precioUnitario === '' ? '' : numPrecio,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300/80 shadow-2xs">
              <Repeat size={20} className="text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Producto Sustituto / Alternativo</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  Inactivo por Defecto
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Registra la alternativa técnica cotizada vinculada a este proveedor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="text-rose-500 font-bold hover:underline ml-2">
                ✕
              </button>
            </div>
          )}

          {/* Nombre y Código SKU */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                NOMBRE / DESCRIPCIÓN DEL PRODUCTO SUSTITUTO <span className="text-rose-500">*</span>
              </label>
              <TextInput
                placeholder="Ej. Laptop Dell Latitude 5420 (Alternativa a ThinkPad)"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Código SKU Automático (Bloqueado para edición manual) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    CÓDIGO / SKU <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                    <Lock size={10} /> Automático
                  </span>
                </div>
                <TextInput
                  value={codigo}
                  isReadOnly={true}
                  className="font-mono bg-slate-100 text-slate-700 font-bold border-slate-300 select-none cursor-not-allowed"
                  placeholder="Generando código..."
                />
              </div>

              {/* Marca del Producto (Dinámica desde tabla CMP_MARCA) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  MARCA DEL PRODUCTO <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={idMarca}
                  onChange={(e) => setIdMarca(Number(e.target.value))}
                  options={marcas}
                  disabled={isLoadingCatalogs}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Unidad de Medida (Dinámica desde tabla CMP_UNIDAD_MEDIDA) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  UNIDAD DE MEDIDA <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={idUnidad}
                  onChange={(e) => setIdUnidad(Number(e.target.value))}
                  options={unidades}
                  disabled={isLoadingCatalogs}
                />
              </div>

              {/* Categoría de Artículo (Dinámica desde tabla CMP_CATEGORIA) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  CATEGORÍA DE PRODUCTO
                </label>
                <Select
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(Number(e.target.value))}
                  options={categorias}
                  disabled={isLoadingCatalogs}
                />
              </div>
            </div>
          </div>

          {/* Especificaciones Técnicas / Motivo */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ESPECIFICACIONES TÉCNICAS / DETALLES DE LA PROPUESTA
            </label>
            <TextArea
              placeholder="Indica modelo exacto, especificaciones técnicas comparativas, garantía o condiciones del sustituto ofrecido..."
              rows={3}
              value={especificaciones}
              onChange={(e) => setEspecificaciones(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Cantidad, Precio y Subtotal */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-600" />
              <span>Valores de Cotización</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  CANTIDAD
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="1"
                  value={cantidad}
                  onKeyDown={(e) => {
                    if (['e', 'E', '.', ',', '-', '+'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full h-[36px] px-2.5 text-xs text-center font-bold font-mono rounded-lg outline-none border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  PRECIO UNIT. (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0.00"
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(e.target.value)}
                  className="w-full h-[36px] px-3 text-xs text-right font-bold font-mono rounded-lg outline-none border border-amber-300 bg-amber-50/40 text-amber-950 focus:bg-white focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 text-right">
                  SUBTOTAL ESTIMADO
                </label>
                <div className="h-[36px] flex items-center justify-end px-3 rounded-lg bg-white border border-slate-200 font-mono font-bold text-xs text-slate-900">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Aviso de Inactividad por Defecto */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900">
            <ShieldCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Registro Seguro:</span> Este artículo se registrará en la base de datos con estado <span className="font-bold text-amber-950">Inactivo (0)</span> por defecto. Se habilitará formalmente en el inventario general solo cuando la cotización resulte adjudicada y autorizada en presupuesto.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Check}
              className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-xs"
            >
              Guardar Producto Sustituto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
