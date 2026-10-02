import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import { Button, Checkbox, TextArea } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';
import { ProveedorCotizacionCard } from './ProveedorCotizacionCard';
import { InlineValidationCard } from './InlineValidationCard';
import { IProveedor, IDetalleCotizacionInputDTO, ISolicitudCompraDetalle, IArticulo } from '@erp/contracts';
import {
  CotizacionClientService,
  ICotizacionMatrizProveedorInput,
} from '../services/cotizacionClientService';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';
import { articuloService } from '../../inventario/services/articulo.service';

export interface MatrizCotizacionesViewProps {
  solicitud?: SolicitudOriginalInfo;
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateToStage?: (stageId: 'aprobacion' | 'matriz' | 'seleccion' | 'presupuesto' | 'bodega' | '3way') => void;
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

  const [detallesSolicitud, setDetallesSolicitud] = useState<ISolicitudCompraDetalle[]>([]);
  const [proveedoresCatalogo, setProveedoresCatalogo] = useState<IProveedor[]>([]);
  const [articulosCatalogo, setArticulosCatalogo] = useState<IArticulo[]>([]);
  const [deletedCotizacionIds, setDeletedCotizacionIds] = useState<number[]>([]);
  const [esExcepcionUnico, setEsExcepcionUnico] = useState<boolean>(false);
  const [justificacionExcepcion, setJustificacionExcepcion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carga concurrente y limpia del catálogo de proveedores, detalles originales de solicitud y cotizaciones existentes
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [catalogo, existing, solCompleta, articulos] = await Promise.all([
          CotizacionClientService.getProveedores().catch((err) => {
            console.warn('[MatrizCotizacionesView]: Error al cargar proveedores:', err);
            return [];
          }),
          solicitud?.noDocumento
            ? CotizacionClientService.getCotizaciones({ noSolicitud: solicitud.noDocumento }).catch((err) => {
                console.warn('[MatrizCotizacionesView]: Error al cargar cotizaciones previas:', err);
                return [];
              })
            : Promise.resolve([]),
          solicitud?.noDocumento
            ? SolicitudCompraClientService.getSolicitudCompleta(solicitud.noDocumento).catch((err) => {
                console.warn('[MatrizCotizacionesView]: Error al cargar detalle original de la solicitud:', err);
                return null;
              })
            : Promise.resolve(null),
          articuloService.obtenerTodos().catch((err) => {
            console.warn('[MatrizCotizacionesView]: Error al cargar catálogo de artículos:', err);
            return [];
          }),
        ]);

        if (!isMounted) return;

        setProveedoresCatalogo(catalogo);
        setArticulosCatalogo(articulos);

        const loadedDetalles = solCompleta?.detalles || [];
        setDetallesSolicitud(loadedDetalles);

        // Artículos requeridos originalmente en CMP_DETALLE_SOLICITUD con códigos reales
        const articulosSolicitud: IDetalleCotizacionInputDTO[] = (loadedDetalles && loadedDetalles.length > 0)
          ? loadedDetalles.map((det) => ({
              codigoArticulo: det.dsoCodigoArticulo,
              descripcionArticulo: det.artDescripcion || det.dsoCodigoArticulo,
              cantidadCotizada: Number(det.dsoCantidadAprobada || det.dsoCantidadPedida || 1),
              precioUnitario: '',
              subtotalLinea: 0,
            }))
          : [];

        const updated: [
          ICotizacionMatrizProveedorInput,
          ICotizacionMatrizProveedorInput,
          ICotizacionMatrizProveedorInput
        ] = [
          { ...EMPTY_PROVEEDOR_INPUT(), detalles: articulosSolicitud.map((a) => ({ ...a })) },
          { ...EMPTY_PROVEEDOR_INPUT(), detalles: articulosSolicitud.map((a) => ({ ...a })) },
          { ...EMPTY_PROVEEDOR_INPUT(), detalles: articulosSolicitud.map((a) => ({ ...a })) },
        ];

        let isExcepcion = false;
        if (existing && existing.length > 0) {
          existing.forEach((item, idx) => {
            if (idx < 3) {
              if (item.cotEsExcepcionUnico === 1) isExcepcion = true;
              const itemDetalles = (item.detalles && item.detalles.length > 0)
                ? item.detalles.map((d: any) => ({
                    codigoArticulo: d.dcoCodigoArticulo || d.codigoArticulo || (articulosSolicitud[0]?.codigoArticulo ?? ''),
                    descripcionArticulo: d.artDescripcion || d.descripcionArticulo,
                    cantidadCotizada: Number(d.dcoCantidadCotizada || d.cantidadCotizada || 1),
                    precioUnitario: d.dcoPrecioUnitario !== undefined ? Number(d.dcoPrecioUnitario) : (d.precioUnitario !== undefined ? Number(d.precioUnitario) : ''),
                    subtotalLinea: Number(d.dcoSubtotalLinea || d.subtotalLinea || 0),
                    observaciones: d.dcoObservaciones || d.observaciones || null,
                    esSustituto: Boolean(d.dcoEsSustituto || d.esSustituto),
                    sinExistencias: Number(d.dcoCantidadCotizada || d.cantidadCotizada) === 0 || (d.dcoObservaciones && d.dcoObservaciones.toLowerCase().includes('sin existencias')),
                  }))
                : articulosSolicitud.map((a) => ({ ...a }));

              updated[idx] = {
                idCotizacion: item.cotIdCotizacion,
                nombreProveedor: item.cotNombreProveedor || `Proveedor #${item.cotIdProveedor}`,
                idProveedor: item.cotIdProveedor,
                precioTotal: item.cotPrecioTotal,
                tiempoEntregaDias: item.cotTiempoEntregaDias ?? '',
                plazoPago: item.cotCondicionPagoDias ? `${item.cotCondicionPagoDias} días` : '',
                archivoPdfBase64: item.cotRutaArchivoPdf || (item.cotArchivoPdf ? String(item.cotArchivoPdf) : null),
                archivoPdfNombre: item.cotRutaArchivoPdf || (item.cotArchivoPdf ? `cotizacion_${item.cotIdCotizacion}.pdf` : null),
                detalles: itemDetalles,
              };
            }
          });
        }

        setProveedores(updated);
        if (isExcepcion) {
          setEsExcepcionUnico(true);
        }
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    loadData();

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
    setSuccessMsg(null);

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
      setSuccessMsg(
        esExcepcionUnico
          ? '¡Cotización de Proveedor Único registrada exitosamente! Avanzando a la etapa de Selección...'
          : '¡Cotizaciones procesadas exitosamente! Transicionando a la etapa de Selección de Cotización...'
      );
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (onBack) {
          onBack();
        }
      }, 500);
    } catch (err: any) {
      console.error('[MatrizCotizacionesView.handleSubmit Error]:', err);
      const userMessage = err?.message || 'Error al guardar la matriz de cotizaciones en la base de datos de Oracle.';
      setErrorMsg(userMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12 min-w-0">
      {/* Top Breadcrumb & Document ID */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 hover:text-blue-600 font-semibold transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Solicitudes</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">Matriz de Cotizaciones</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
            Etapa 2 de 6
          </span>
        </div>
        <span className="font-semibold text-slate-400">{solicitud.noDocumento}</span>
      </div>

      {/* Solicitud Original Header Card */}
      <SolicitudOriginalCard solicitud={solicitud} detalles={detallesSolicitud} />

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Cotizaciones Section Header with Proveedor Único Toggle */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase">
                  Cotizaciones de Proveedores
                </h3>
                {esExcepcionUnico ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                    Modo Proveedor Único
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md hidden sm:inline">
                    1 a 3 Proveedores
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {esExcepcionUnico
                  ? 'Complete la propuesta económica del proveedor exclusivo y la justificación.'
                  : 'Registre las ofertas económicas de los proveedores para la comparativa.'}
              </p>
            </div>
          </div>

          {/* Toggle Button / Checkbox para Proveedor Único */}
          <div
            onClick={() => setEsExcepcionUnico(!esExcepcionUnico)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer select-none shadow-2xs ${
              esExcepcionUnico
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-200 text-amber-950 font-bold'
                : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-semibold'
            }`}
            title="Activar para registrar únicamente 1 proveedor con justificación técnica o comercial"
          >
            <input
              type="checkbox"
              id="chk-proveedor-unico"
              checked={esExcepcionUnico}
              onChange={(e) => setEsExcepcionUnico(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 border-slate-300 cursor-pointer"
            />
            <label
              htmlFor="chk-proveedor-unico"
              className="text-xs cursor-pointer flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Excepción Proveedor Único</span>
              <HelpCircle size={13} className="text-slate-400" />
            </label>
          </div>
        </div>

        {/* Justificación TextArea en la Cabecera si está activo Proveedor Único */}
        {esExcepcionUnico && (
          <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2 animate-fadeIn shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <label className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  JUSTIFICACIÓN DE PROVEEDOR ÚNICO <span className="text-red-500 ml-0.5">*</span>
                </label>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                (Requisito obligatorio para auditoría y compras directas)
              </span>
            </div>
            <TextArea
              placeholder="Describa de forma detallada por qué solo existe un proveedor disponible o calificado para este requerimiento..."
              rows={2}
              value={justificacionExcepcion}
              onChange={(e) => setJustificacionExcepcion(e.target.value)}
              className="bg-white border-amber-300 focus:border-amber-500 focus:ring-amber-200 text-amber-950 placeholder-amber-700/50 text-xs"
            />
          </div>
        )}
      </div>

      {/* Stacked Vertical Supplier Cards (Diseño en Cascada Adaptable) */}
      <div className="space-y-3.5 flex flex-col w-full transition-all duration-300">
        <ProveedorCotizacionCard
          index={1}
          data={proveedores[0]}
          proveedoresCatalogo={proveedoresCatalogo}
          articulosCatalogo={articulosCatalogo}
          onChange={(data) => handleProveedorChange(0, data)}
          onClear={() => handleClearCard(0)}
          isProveedorUnico={esExcepcionUnico}
        />
        {!esExcepcionUnico && (
          <>
            <ProveedorCotizacionCard
              index={2}
              data={proveedores[1]}
              proveedoresCatalogo={proveedoresCatalogo}
              articulosCatalogo={articulosCatalogo}
              onChange={(data) => handleProveedorChange(1, data)}
              onClear={() => handleClearCard(1)}
            />
            <ProveedorCotizacionCard
              index={3}
              data={proveedores[2]}
              proveedoresCatalogo={proveedoresCatalogo}
              articulosCatalogo={articulosCatalogo}
              onChange={(data) => handleProveedorChange(2, data)}
              onClear={() => handleClearCard(2)}
            />
          </>
        )}
      </div>

      {/* Alerta / Validación In-situ (Sin necesidad de scroll hacia arriba) */}
      <InlineValidationCard
        error={errorMsg}
        onDismiss={() => setErrorMsg(null)}
        title="Validación de Cotizaciones Pendiente"
      />

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
