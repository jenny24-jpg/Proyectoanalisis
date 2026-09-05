import React from 'react';
import { Building, HelpCircle, Paperclip, CheckCircle, Trash2 } from 'lucide-react';
import { TextInput, Select } from '../../../components/ui';
import { IProveedor } from '@erp/contracts';
import { ICotizacionMatrizProveedorInput } from '../services/cotizacionClientService';

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

  // Asegurar que si hay una cotización cargada con un idProveedor, esté visible en el select
  if (data.idProveedor && !proveedorOptions.some((o) => o.value === data.idProveedor)) {
    proveedorOptions.unshift({
      value: data.idProveedor,
      label: data.nombreProveedor || `Proveedor #${data.idProveedor}`,
    });
  }

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 transition-all duration-200 ${
        isDisabled ? 'opacity-40 bg-slate-50/70 select-none pointer-events-none' : 'hover:border-slate-300'
      }`}
    >
      {/* Header with index badge & clear button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
            {index}
          </span>
          <h4 className="text-sm font-bold text-slate-800">Proveedor {index}</h4>
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

        {/* Precio Total */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center">
              PRECIO TOTAL (Q) <span className="text-red-500 ml-0.5">*</span>
            </label>
            <span title="Monto total cotizado por este proveedor" className="text-slate-400">
              <HelpCircle size={13} />
            </span>
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

        {/* Tiempo de Entrega */}
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

        {/* Plazo de Pago */}
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

        {/* Cotización PDF upload button */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center">
              COTIZACIÓN PDF
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
