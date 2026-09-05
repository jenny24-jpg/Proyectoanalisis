import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, Send } from 'lucide-react';
import { Button, Checkbox, TextArea } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';
import { ProveedorCotizacionCard } from './ProveedorCotizacionCard';
import { IProveedor } from '@erp/contracts';
import {
  CotizacionClientService,
  ICotizacionMatrizProveedorInput,
} from '../services/cotizacionClientService';

export interface MatrizCotizacionesViewProps {
  solicitud?: SolicitudOriginalInfo;
  onBack?: () => void;
  onSuccess?: () => void;
}

const DEFAULT_SOLICITUD: SolicitudOriginalInfo = {
  noDocumento: 'SOL-2026-0001',
  fecha: new Date().toISOString().split('T')[0],
  entidad: 'Empresa Principal S.A.',
  departamento: 'Departamento General',
  responsable: 'Usuario Responsable',
  montoTotal: 0,
  estado: 'Aprobado',
};

const EMPTY_PROVEEDOR_INPUT = (): ICotizacionMatrizProveedorInput => ({
  nombreProveedor: '',
  idProveedor: undefined,
  precioTotal: '',
  tiempoEntregaDias: '',
  plazoPago: '',
  archivoPdfBase64: null,
  archivoPdfNombre: null,
});

export const MatrizCotizacionesView: React.FC<MatrizCotizacionesViewProps> = ({
  solicitud = DEFAULT_SOLICITUD,
  onBack,
  onSuccess,
}) => {
  const [proveedores, setProveedores] = useState<
    [ICotizacionMatrizProveedorInput, ICotizacionMatrizProveedorInput, ICotizacionMatrizProveedorInput]
  >([EMPTY_PROVEEDOR_INPUT(), EMPTY_PROVEEDOR_INPUT(), EMPTY_PROVEEDOR_INPUT()]);

  const [proveedoresCatalogo, setProveedoresCatalogo] = useState<IProveedor[]>([]);
  const [deletedCotizacionIds, setDeletedCotizacionIds] = useState<number[]>([]);
  const [esExcepcionUnico, setEsExcepcionUnico] = useState<boolean>(false);
  const [justificacionExcepcion, setJustificacionExcepcion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar catálogo de proveedores y cotizaciones existentes desde la base de datos Oracle
  useEffect(() => {
    let isMounted = true;

    // 1. Cargar catálogo de proveedores activos
    CotizacionClientService.getProveedores()
      .then((catalogo) => {
        if (isMounted) setProveedoresCatalogo(catalogo);
      })
      .catch((err) => {
        console.warn('[MatrizCotizacionesView]: Error al cargar catálogo de proveedores:', err);
      });

    // 2. Cargar cotizaciones existentes para esta solicitud
    const loadExistingCotizaciones = async () => {
      if (!solicitud?.noDocumento) return;
      try {
        const existing = await CotizacionClientService.getCotizaciones({ noSolicitud: solicitud.noDocumento });
        if (isMounted && existing && existing.length > 0) {
          const updated: [ICotizacionMatrizProveedorInput, ICotizacionMatrizProveedorInput, ICotizacionMatrizProveedorInput] = [
            EMPTY_PROVEEDOR_INPUT(),
            EMPTY_PROVEEDOR_INPUT(),
            EMPTY_PROVEEDOR_INPUT(),
          ];

          let isExcepcion = false;
          existing.forEach((item, idx) => {
            if (idx < 3) {
              if (item.cotEsExcepcionUnico === 1) isExcepcion = true;
              updated[idx] = {
                idCotizacion: item.cotIdCotizacion,
                nombreProveedor: item.cotNombreProveedor || `Proveedor #${item.cotIdProveedor}`,
                idProveedor: item.cotIdProveedor,
                precioTotal: item.cotPrecioTotal,
                tiempoEntregaDias: item.cotTiempoEntregaDias ?? '',
                plazoPago: item.cotCondicionPagoDias ? `${item.cotCondicionPagoDias} días` : '',
                archivoPdfBase64: item.cotArchivoPdf ? String(item.cotArchivoPdf) : null,
                archivoPdfNombre: item.cotArchivoPdf ? `cotizacion_${item.cotIdCotizacion}.pdf` : null,
              };
            }
          });

          setProveedores(updated);
          if (isExcepcion) {
            setEsExcepcionUnico(true);
          }
        }
      } catch (err) {
        console.warn('[MatrizCotizacionesView]: No se pudieron cargar cotizaciones previas:', err);
      }
    };

    loadExistingCotizaciones();
    return () => {
      isMounted = false;
    };
  }, [solicitud?.noDocumento]);

  const handleProveedorChange = (index: number, updated: ICotizacionMatrizProveedorInput) => {
    setProveedores((prev) => {
      const copy = [...prev] as [
        ICotizacionMatrizProveedorInput,
        ICotizacionMatrizProveedorInput,
        ICotizacionMatrizProveedorInput
      ];
      copy[index] = updated;
      return copy;
    });
  };

  const handleClearCard = (index: number) => {
    const target = proveedores[index];
    if (target.idCotizacion) {
      setDeletedCotizacionIds((prev) => [...prev, target.idCotizacion!]);
    }
    setProveedores((prev) => {
      const copy = [...prev] as [
        ICotizacionMatrizProveedorInput,
        ICotizacionMatrizProveedorInput,
        ICotizacionMatrizProveedorInput
      ];
      copy[index] = EMPTY_PROVEEDOR_INPUT();
      return copy;
    });
  };

  const isProveedorFilled = (prov: ICotizacionMatrizProveedorInput) =>
    Boolean(
      prov.idProveedor &&
        prov.precioTotal !== '' &&
        !isNaN(Number(prov.precioTotal)) &&
        Number(prov.precioTotal) >= 0
    );

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (esExcepcionUnico) {
      if (!isProveedorFilled(proveedores[0])) {
        setErrorMsg('Por favor seleccione un proveedor y especifique el precio total en la Excepción.');
        return;
      }
      if (!justificacionExcepcion.trim()) {
        setErrorMsg('Por favor ingrese la justificación obligatoria para la Excepción de Proveedor Único.');
        return;
      }
    } else {
      const validos = proveedores.filter(isProveedorFilled);
      if (validos.length === 0 && deletedCotizacionIds.length === 0) {
        setErrorMsg('Por favor complete los datos de al menos 1 proveedor (Seleccione Proveedor y Precio Total).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await CotizacionClientService.saveMatrizCotizaciones(
        solicitud.noDocumento,
        proveedores,
        esExcepcionUnico,
        justificacionExcepcion,
        deletedCotizacionIds
      );
      alert('¡Cotización(es) procesada(s) exitosamente en la base de datos Oracle!');
      if (onSuccess) {
        onSuccess();
      } else if (onBack) {
        onBack();
      }
    } catch (err: any) {
      console.error('[MatrizCotizacionesView Error]:', err);
      setErrorMsg(err.message || 'Error al guardar la matriz de cotizaciones en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Document ID */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 hover:text-blue-600 font-semibold transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Solicitudes</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">Matriz de Cotizaciones</span>
        </button>
        <span className="font-semibold text-slate-400">{solicitud.noDocumento}</span>
      </div>

      {/* Solicitud Original Header Card */}
      <SolicitudOriginalCard solicitud={solicitud} />

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold hover:underline ml-2">
            Descartar
          </button>
        </div>
      )}

      {/* Cotizaciones Section Title */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase">
            Cotizaciones
          </h3>
          <span className="text-xs text-slate-400">
            — Complete de 1 a 3 proveedores o marque la excepción de proveedor único
          </span>
        </div>
      </div>

      {/* 3 Side-by-side Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProveedorCotizacionCard
          index={1}
          data={proveedores[0]}
          proveedoresCatalogo={proveedoresCatalogo}
          onChange={(data) => handleProveedorChange(0, data)}
          onClear={() => handleClearCard(0)}
        />
        <ProveedorCotizacionCard
          index={2}
          data={proveedores[1]}
          proveedoresCatalogo={proveedoresCatalogo}
          onChange={(data) => handleProveedorChange(1, data)}
          onClear={() => handleClearCard(1)}
          isDisabled={esExcepcionUnico}
        />
        <ProveedorCotizacionCard
          index={3}
          data={proveedores[2]}
          proveedoresCatalogo={proveedoresCatalogo}
          onChange={(data) => handleProveedorChange(2, data)}
          onClear={() => handleClearCard(2)}
          isDisabled={esExcepcionUnico}
        />
      </div>

      {/* Excepción Proveedor Único Section */}
      <div
        className={`bg-white rounded-xl border transition-all duration-200 p-5 space-y-4 shadow-sm ${
          esExcepcionUnico
            ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-200/50'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            label="Excepción Proveedor Único"
            checked={esExcepcionUnico}
            onChange={(e) => setEsExcepcionUnico(e.target.checked)}
            helperText="Aplica cuando existe un solo proveedor calificado para este bien o servicio."
          />
          <span title="Habilitar justificación para contratar un único proveedor" className="text-slate-400 mb-4">
            <HelpCircle size={14} />
          </span>
        </div>

        {/* Justificación TextArea */}
        {esExcepcionUnico && (
          <div className="pt-2 animate-fadeIn space-y-1.5">
            <label className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
              JUSTIFICACIÓN <span className="text-red-500 ml-0.5">*</span>
            </label>
            <TextArea
              placeholder="Describa por qué solo existe un proveedor disponible para este requerimiento..."
              rows={3}
              value={justificacionExcepcion}
              onChange={(e) => setJustificacionExcepcion(e.target.value)}
              className="bg-white border-amber-300 focus:border-amber-500 focus:ring-amber-200 text-amber-950 placeholder-amber-700/50"
            />
          </div>
        )}
      </div>

      {/* Footer Info & Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HelpCircle size={15} className="text-slate-400" />
          <span>Complete al menos 1 proveedor o la excepción para enviar a Selección Financiera.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon={Send}
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Guardando en BD...' : 'Enviar a Selección Financiera'}
          </Button>
        </div>
      </div>
    </div>
  );
};
