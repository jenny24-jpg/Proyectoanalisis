import React, { useState } from 'react';
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
} from 'lucide-react';
import { TextInput, Select, Button } from '../../../components/ui';
import { IProveedor, IDetalleCotizacionInputDTO } from '@erp/contracts';
import { ICotizacionMatrizProveedorInput } from '../services/cotizacionClientService';
import { formatCurrency } from '../../../utils/formatters';

export interface ProveedorCotizacionCardProps {
  index: number; // 1, 2, or 3
  data: ICotizacionMatrizProveedorInput;
  proveedoresCatalogo?: IProveedor[];
  onChange: (updatedData: ICotizacionMatrizProveedorInput) => void;
  onClear?: () => void;
  isDisabled?: boolean;
}

export const ProveedorCotizacionCard: React.FC<ProveedorCotizacionCardProps> = ({
  index,
  data,
  proveedoresCatalogo = [],
  onChange,
  onClear,
  isDisabled = false,
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);

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
  const currentDetalles: IDetalleCotizacionInputDTO[] = data.detalles || [];

  const updateDetallesAndTotal = (newDetalles: IDetalleCotizacionInputDTO[]) => {
    const calculatedTotal = newDetalles.reduce((acc, curr) => {
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

  const handleAddDetailLine = () => {
    const nextLineNum = currentDetalles.length + 1;
    const newLine: IDetalleCotizacionInputDTO = {
      codigoArticulo: `ART-OFERTA-${String(nextLineNum).padStart(2, '0')}`,
      descripcionArticulo: 'Artículo Adicional / Oferta',
      cantidadCotizada: 1,
      precioUnitario: '',
      subtotalLinea: 0,
    };
    updateDetallesAndTotal([...currentDetalles, newLine]);
  };

  const handleRemoveDetailLine = (lineIdx: number) => {
    const updated = currentDetalles.filter((_, idx) => idx !== lineIdx);
    updateDetallesAndTotal(updated);
  };

  const handleDetailChange = (
    lineIdx: number,
    field: keyof IDetalleCotizacionInputDTO,
    value: any
  ) => {
    const updated = currentDetalles.map((line, idx) => {
      if (idx !== lineIdx) return line;

      const mod = { ...line, [field]: value };
      const cant = field === 'cantidadCotizada' ? Number(value || 0) : Number(line.cantidadCotizada || 0);
      const precio = field === 'precioUnitario' ? Number(value || 0) : Number(line.precioUnitario || 0);
      mod.subtotalLinea = +(cant * precio).toFixed(2);
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
      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 transition-all duration-200 ${
        isDisabled ? 'opacity-40 bg-slate-50/70 select-none pointer-events-none' : 'hover:border-slate-300'
      }`}
    >
      {/* Header with index badge & clear button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
            {index}
          </span>
          <h4 className="text-sm font-bold text-slate-800">
            {data.nombreProveedor || `Proveedor ${index}`}
          </h4>
        </div>

        {onClear && isFilled && !isDisabled && (
          <button
            type="button"
            onClick={onClear}
            className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200 shadow-2xs"
            title="Descartar esta cotización"
          >
            <Trash2 size={13} className="text-slate-400" />
            <span>Descartar</span>
          </button>
        )}
      </div>

      {/* Inputs Form */}
      <div className="space-y-3.5">
        {/* Selector Dinámico de Proveedor (desde tabla PROVEEDOR) */}
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

        {/* Tiempo de Entrega y Plazo de Pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center">
                TIEMPO DE ENTREGA (DÍAS)
              </label>
              <span title="Días calendario estimados para la entrega" className="text-slate-400">
                <HelpCircle size={13} />
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

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center">
                PLAZO DE PAGO
              </label>
              <span title="Condición de crédito o pago" className="text-slate-400">
                <HelpCircle size={13} />
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
        </div>

        {/* 1. SECCIÓN: GRILLA DE DETALLE POR LÍNEA DE ARTÍCULOS (CMP_DETALLE_COTIZACION) */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/70 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 cursor-pointer text-slate-800 font-bold text-xs select-none"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            >
              <Package size={15} className="text-blue-600" />
              <span>Desglose por Línea ({currentDetalles.length} artículos)</span>
              {isDetailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={handleAddDetailLine}
              disabled={isDisabled}
              className="text-xs py-1 h-7 text-blue-700 hover:bg-blue-50 bg-white border border-blue-200/80 shadow-2xs"
            >
              Añadir Línea / Oferta
            </Button>
          </div>

          {isDetailsExpanded && (
            <div className="space-y-2 pt-1">
              {currentDetalles.length === 0 ? (
                <div className="p-3 bg-white rounded-lg border border-dashed border-slate-200 text-center">
                  <p className="text-[11px] text-slate-500">
                    No hay líneas de artículos añadidas. Haz clic en "Añadir Línea" para registrar ofertas o ítems adicionales.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Encabezado de Columnas */}
                  <div className="grid grid-cols-12 gap-1.5 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="col-span-4">Artículo</span>
                    <span className="col-span-2 text-center">Cant.</span>
                    <span className="col-span-3 text-right">Precio Unit. (Q)</span>
                    <span className="col-span-2 text-right">Subtotal</span>
                    <span className="col-span-1"></span>
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                    {currentDetalles.map((line, lIdx) => {
                      const cant = Number(line.cantidadCotizada || 0);
                      const precio = Number(line.precioUnitario || 0);
                      const subtotal = +(cant * precio).toFixed(2);

                      return (
                        <div
                          key={lIdx}
                          className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs grid grid-cols-12 gap-1.5 items-center text-xs"
                        >
                          {/* Código y descripción */}
                          <div className="col-span-4 min-w-0">
                            <input
                              type="text"
                              placeholder="ART-0001"
                              value={line.codigoArticulo}
                              onChange={(e) => handleDetailChange(lIdx, 'codigoArticulo', e.target.value)}
                              disabled={isDisabled}
                              className="w-full px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-md focus:bg-white outline-none"
                              title="Código del Artículo"
                            />
                            {line.descripcionArticulo && line.descripcionArticulo !== line.codigoArticulo && (
                              <div className="text-[10px] text-slate-500 truncate mt-0.5" title={line.descripcionArticulo}>
                                {line.descripcionArticulo}
                              </div>
                            )}
                          </div>

                          {/* Cantidad requerida/cotizada */}
                          <div className="col-span-2">
                            <input
                              type="number"
                              min={1}
                              placeholder="Cant."
                              value={line.cantidadCotizada}
                              onChange={(e) => handleDetailChange(lIdx, 'cantidadCotizada', Number(e.target.value))}
                              disabled={isDisabled}
                              className="w-full px-1.5 py-1 text-xs text-center font-bold bg-slate-50 border border-slate-200 rounded-md focus:bg-white outline-none font-mono"
                              title="Cantidad Requerida"
                            />
                          </div>

                          {/* Precio Unitario del Proveedor (Campo Principal de Entrada) */}
                          <div className="col-span-3">
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              value={line.precioUnitario ?? ''}
                              onChange={(e) => handleDetailChange(lIdx, 'precioUnitario', e.target.value === '' ? '' : Number(e.target.value))}
                              disabled={isDisabled}
                              className="w-full px-2 py-1 text-xs text-right font-mono font-bold bg-blue-50/40 border border-blue-300 text-blue-900 rounded-md focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              title="Ingresa el Precio Unitario propuesto por el proveedor"
                              autoFocus={lIdx === 0 && !line.precioUnitario}
                            />
                          </div>

                          {/* Subtotal Línea Calculado */}
                          <div className="col-span-2 text-right font-mono font-bold text-slate-900 text-[11px] truncate">
                            {formatCurrency(subtotal)}
                          </div>

                          {/* Botón eliminar línea */}
                          <div className="col-span-1 text-right">
                            {!isDisabled && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDetailLine(lIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                title="Remover artículo"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Precio Total Consolidado */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-800 flex items-center">
              PRECIO TOTAL COTIZADO (Q) <span className="text-red-500 ml-0.5">*</span>
            </label>
            {currentDetalles.length > 0 && (
              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Calculado automáticamente ({currentDetalles.length} líneas)
              </span>
            )}
          </div>
          <TextInput
            placeholder="Q 0.00"
            type="number"
            step="0.01"
            value={data.precioTotal}
            onChange={(e) => handleFieldChange('precioTotal', e.target.value)}
            isReadOnly={isDisabled}
          />
        </div>

        {/* Cotización PDF upload button */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center">
              COTIZACIÓN PDF ADJUNTA
            </label>
            <span title="Documento escaneado o digital de la cotización" className="text-slate-400">
              <HelpCircle size={13} />
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
              className={`w-full h-10 px-3.5 rounded-xl border border-dashed text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${
                data.archivoPdfNombre
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              {data.archivoPdfNombre ? (
                <>
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[180px]">{data.archivoPdfNombre}</span>
                </>
              ) : (
                <>
                  <Paperclip size={15} className="text-slate-400 shrink-0" />
                  <span>Adjuntar Cotización PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
