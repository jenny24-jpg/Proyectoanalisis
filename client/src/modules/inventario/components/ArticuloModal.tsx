import React, { useState, useEffect } from 'react';
import { X, Package, Save, AlertCircle } from 'lucide-react';
import { Button, TextInput, Select, Checkbox } from '../../../components/ui';
import type { IArticulo, ICrearArticuloDTO, IActualizarArticuloDTO } from '@erp/contracts';
import { CategoriaClientService } from '../services/categoriaClientService';
import { MarcaClientService } from '../services/marcaClientService';
import { UnidadMedidaClientService } from '../services/unidadMedidaClientService';
import { sanitizeStrictCode, sanitizeNominalText } from '../../../utils/sanitizers';

import { articuloService } from '../services/articulo.service';

export interface ArticuloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ICrearArticuloDTO | IActualizarArticuloDTO, codigo?: string) => Promise<void>;
  articulo?: IArticulo | null;
}

export const ArticuloModal: React.FC<ArticuloModalProps> = ({
  isOpen,
  onClose,
  onSave,
  articulo,
}) => {
  const isEditing = Boolean(articulo);
  
  const [codigo, setCodigo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [idCategoria, setIdCategoria] = useState<number>(1);
  const [idMarca, setIdMarca] = useState<number>(1);
  const [idUnidadCompra, setIdUnidadCompra] = useState<number>(1);
  const [idUnidadVenta, setIdUnidadVenta] = useState<number>(1);
  const [manejaLote, setManejaLote] = useState<boolean>(false);
  const [activo, setActivo] = useState<boolean>(true);

  // Dynamic selector options
  const [categorias, setCategorias] = useState<{ value: number; label: string }[]>([]);
  const [marcas, setMarcas] = useState<{ value: number; label: string }[]>([]);
  const [unidades, setUnidades] = useState<{ value: number; label: string }[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [descripcionError, setDescripcionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [catData, marData, uniData] = await Promise.allSettled([
          CategoriaClientService.getCategorias({ activo: 1 }),
          MarcaClientService.getMarcas({ activo: 1 }),
          UnidadMedidaClientService.getUnidadesMedida({ activo: 1 }),
        ]);

        if (catData.status === 'fulfilled' && catData.value.length > 0) {
          setCategorias(catData.value.map(c => ({ value: c.catIdCategoria, label: c.catNombreCategoria })));
        } else {
          setCategorias([{ value: 1, label: 'Categoría General' }]);
        }

        if (marData.status === 'fulfilled' && marData.value.length > 0) {
          setMarcas(marData.value.map(m => ({ value: m.marIdMarca, label: m.marNombreMarca })));
        } else {
          setMarcas([{ value: 1, label: 'Marca Estándar / Genérica' }]);
        }

        if (uniData.status === 'fulfilled' && uniData.value.length > 0) {
          setUnidades(uniData.value.map(u => ({ value: u.umeIdUnidad, label: `${u.umeNombreUnidad} (${u.umeAbreviatura})` })));
        } else {
          setUnidades([{ value: 1, label: 'Unidad (UND)' }]);
        }
      } catch (err) {
        console.error('[ArticuloModal] Error al cargar catálogos:', err);
      }
    };

    const loadNextCode = async () => {
      if (!articulo) {
        try {
          const nextCode = await articuloService.obtenerSiguienteCodigo();
          setCodigo(nextCode);
        } catch (err) {
          console.error('[ArticuloModal] Error al obtener siguiente código:', err);
        }
      }
    };

    if (isOpen) {
      loadCatalogs();
      loadNextCode();
    }
  }, [isOpen, articulo]);

  useEffect(() => {
    if (articulo) {
      setCodigo(articulo.ART_CODIGO_ARTICULO);
      setDescripcion(articulo.ART_DESCRIPCION);
      setIdCategoria(articulo.ART_ID_CATEGORIA || 1);
      setIdMarca(articulo.ART_ID_MARCA || 1);
      setIdUnidadCompra(articulo.ART_ID_UNIDAD_COMPRA || 1);
      setIdUnidadVenta(articulo.ART_ID_UNIDAD_VENTA || 1);
      setManejaLote(articulo.ART_MANEJA_LOTE === 1);
      setActivo(articulo.ART_ACTIVO === 1);
    } else {
      setDescripcion('');
      setIdCategoria(1);
      setIdMarca(1);
      setIdUnidadCompra(1);
      setIdUnidadVenta(1);
      setManejaLote(false);
      setActivo(true);
    }
    setError(null);
    setCodigoError(null);
    setDescripcionError(null);
  }, [articulo, isOpen]);

  const handleCodigoChange = (val: string) => {
    const { sanitized, error: codeErr } = sanitizeStrictCode(val);
    setCodigo(sanitized);
    setCodigoError(codeErr);
  };

  const handleDescripcionChange = (val: string) => {
    const { sanitized, error: descErr } = sanitizeNominalText(val);
    setDescripcion(sanitized);
    setDescripcionError(descErr);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoTrimmed = codigo.trim().toUpperCase();
    const descripcionTrimmed = descripcion.trim();

    if (!codigoTrimmed) {
      setCodigoError('El código del artículo es obligatorio.');
      setError('Por favor complete los campos obligatorios correctamente.');
      return;
    }

    if (codigoTrimmed.length > 30) {
      setCodigoError('El código no puede exceder los 30 caracteres.');
      setError('Por favor revise los campos con error.');
      return;
    }

    if (!descripcionTrimmed) {
      setDescripcionError('La descripción del artículo es obligatoria.');
      setError('Por favor complete los campos obligatorios correctamente.');
      return;
    }

    if (descripcionTrimmed.length > 250) {
      setDescripcionError('La descripción no puede exceder los 250 caracteres.');
      setError('Por favor revise los campos con error.');
      return;
    }

    if (codigoError || descripcionError) {
      setError('Corrija los caracteres no válidos antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && articulo) {
        await onSave(
          {
            ART_DESCRIPCION: descripcionTrimmed,
          },
          articulo.ART_CODIGO_ARTICULO
        );
      } else {
        const payload: ICrearArticuloDTO = {
          ART_CODIGO_ARTICULO: codigoTrimmed,
          ART_DESCRIPCION: descripcionTrimmed,
          ART_ID_CATEGORIA: Number(idCategoria) || 1,
          ART_ID_MARCA: Number(idMarca) || 1,
          ART_ID_UNIDAD_COMPRA: Number(idUnidadCompra) || 1,
          ART_ID_UNIDAD_VENTA: Number(idUnidadVenta) || 1,
          ART_MANEJA_LOTE: manejaLote ? 1 : 0,
        };
        await onSave(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el artículo.');
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Código: ${articulo?.ART_CODIGO_ARTICULO}` : 'Catálogo Central de Productos e Inventario'}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <TextInput
                label="CÓDIGO (AUTO-ASIGNADO)"
                required
                placeholder="Calculando código..."
                value={codigo}
                onChange={(e) => handleCodigoChange(e.target.value)}
                isReadOnly={true}
                maxLength={30}
                error={codigoError || undefined}
                helperText="Asignado automáticamente"
              />
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="DESCRIPCIÓN DEL ARTÍCULO"
                required
                placeholder="Ej. Laptop HP ProBook 450 G9 16GB..."
                value={descripcion}
                onChange={(e) => handleDescripcionChange(e.target.value)}
                maxLength={250}
                autoFocus={true}
                error={descripcionError || undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Select
                label="CATEGORÍA"
                required
                value={idCategoria}
                onChange={(e) => setIdCategoria(Number(e.target.value))}
                options={categorias}
                disabled={isEditing}
              />
            </div>
            <div>
              <Select
                label="MARCA"
                required
                value={idMarca}
                onChange={(e) => setIdMarca(Number(e.target.value))}
                options={marcas}
                disabled={isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Select
                label="UNIDAD COMPRA"
                value={idUnidadCompra}
                onChange={(e) => setIdUnidadCompra(Number(e.target.value))}
                options={unidades}
                disabled={isEditing}
              />
            </div>
            <div>
              <Select
                label="UNIDAD VENTA"
                value={idUnidadVenta}
                onChange={(e) => setIdUnidadVenta(Number(e.target.value))}
                options={unidades}
                disabled={isEditing}
              />
            </div>
          </div>

          <div className="pt-2 space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <Checkbox
              label="Maneja Control de Lote y Vencimiento"
              helperText="Exige registrar lote y fecha de expiración en las entradas y salidas de inventario."
              checked={manejaLote}
              onChange={(e) => setManejaLote(e.target.checked)}
              disabled={isEditing}
            />
            {isEditing && (
              <Checkbox
                label="Artículo Activo"
                helperText="Los artículos inactivos no pueden solicitarse en compras ni transferirse."
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                disabled
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" icon={X} onClick={onClose} disabled={isSubmitting} type="button">
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar Artículo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
