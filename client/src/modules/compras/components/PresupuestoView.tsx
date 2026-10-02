import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  DollarSign,
  FileCheck,
  Layers,
  PieChart,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  Calendar,
  Printer,
  Download,
} from 'lucide-react';
import {
  Button,
  StatCard,
  DataTable,
  StatusBadge,
  TextArea,
  ConfirmDialog,
} from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';
import { OrdenCompraClientService } from '../services/ordenCompraClientService';
import { CotizacionClientService } from '../services/cotizacionClientService';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';
import { OrdenCompraDocumentModal } from './OrdenCompraDocumentModal';
import { CotizacionDetailModal } from './CotizacionDetailModal';
import { InlineValidationCard } from './InlineValidationCard';
import {
  IOrdenCompra,
  IOrdenCompraCompleta,
  ICotizacion,
  ISolicitudCompra,
} from '@erp/contracts';
import { getStageForSolicitud } from './PipelineProgress';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { generarOrdenCompraPdf } from '../utils/ordenCompraPdfGenerator';

export interface PresupuestoViewProps {
  solicitud?: SolicitudOriginalInfo | null;
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateToStage?: (stageId: 'aprobacion' | 'matriz' | 'seleccion' | 'presupuesto' | 'bodega' | '3way') => void;
}

export const PresupuestoView: React.FC<PresupuestoViewProps> = ({
  solicitud,
  onBack,
  onSuccess,
  onNavigateToStage,
}) => {
  // Estado para la vista de Solicitud Individual (Etapa 4 de Pipeline)
  const [cotizacionGanadora, setCotizacionGanadora] = useState<ICotizacion | null>(null);
  const [ordenCompraExistente, setOrdenCompraExistente] = useState<IOrdenCompraCompleta | null>(null);
  const [isLoadingDetalles, setIsLoadingDetalles] = useState<boolean>(false);

  // Notas de Autorización Presupuestaria
  const [notasPresupuesto, setNotasPresupuesto] = useState<string>('');

  // Modales
  const [isConfirmAuthOpen, setIsConfirmAuthOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isPoDocumentModalOpen, setIsPoDocumentModalOpen] = useState<boolean>(false);
  const [isCotizacionModalOpen, setIsCotizacionModalOpen] = useState<boolean>(false);
  const [selectedPoDocument, setSelectedPoDocument] = useState<IOrdenCompraCompleta | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mensajes de Alerta/Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estado para la vista general (Standalone Tab de Presupuesto)
  const [solicitudesGenerales, setSolicitudesGenerales] = useState<ISolicitudCompra[]>([]);
  const [ordenesCompraGenerales, setOrdenesCompraGenerales] = useState<IOrdenCompra[]>([]);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstadoPresupuesto, setFilterEstadoPresupuesto] = useState<string>('TODOS');
  const [selectedSolicitudFromTable, setSelectedSolicitudFromTable] = useState<SolicitudOriginalInfo | null>(null);

  // Determinar la solicitud activa actual (ya sea pasada por prop o seleccionada en tabla)
  const currentSolicitud = solicitud || selectedSolicitudFromTable;

  // Cargar datos de la solicitud individual
  const loadSingleSolicitudData = async (noDoc: string) => {
    setIsLoadingDetalles(true);
    setErrorMsg(null);
    try {
      const [cots, existingPo] = await Promise.all([
        CotizacionClientService.getCotizaciones({ noSolicitud: noDoc }),
        OrdenCompraClientService.getOrdenCompraPorSolicitud(noDoc).catch(() => null),
      ]);

      const ganadora = cots.find(
        (c) =>
          (c.cotEstadoAdjudicacion || '').toUpperCase() === 'GANADORA' ||
          (c.cotEstadoAdjudicacion || '').toUpperCase() === 'ADJUDICADA' ||
          c.cotEsExcepcionUnico === 1
      );

      setCotizacionGanadora(ganadora || (cots.length > 0 ? cots[0] : null));
      setOrdenCompraExistente(existingPo);
    } catch (err: any) {
      console.error('[PresupuestoView]: Error al cargar datos de presupuesto:', err);
      setErrorMsg(err.message || 'Error al obtener la información presupuestaria de la base de datos.');
    } finally {
      setIsLoadingDetalles(false);
    }
  };

  // Cargar datos de la vista general
  const loadGeneralData = async () => {
    setIsLoadingGeneral(true);
    setErrorMsg(null);
    try {
      const [sols, pos] = await Promise.all([
        SolicitudCompraClientService.getSolicitudes(),
        OrdenCompraClientService.getOrdenesCompra().catch(() => []),
      ]);
      setSolicitudesGenerales(sols);
      setOrdenesCompraGenerales(pos);
    } catch (err: any) {
      console.error('[PresupuestoView]: Error al cargar registros generales:', err);
      setErrorMsg(err.message || 'Error al obtener el listado general de presupuesto.');
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  useEffect(() => {
    if (currentSolicitud?.noDocumento) {
      loadSingleSolicitudData(currentSolicitud.noDocumento);
    } else {
      loadGeneralData();
    }
  }, [currentSolicitud?.noDocumento]);

  // Cálculos financieros de la cotización ganadora
  const finanzas = useMemo(() => {
    if (!cotizacionGanadora) {
      const tot = currentSolicitud?.montoTotal || 0;
      const sub = +(tot / 1.12).toFixed(2);
      const iv = +(tot - sub).toFixed(2);
      return { subtotal: sub, iva: iv, total: tot, ahorro: 0, ahorroPct: 0 };
    }
    const total = Number(cotizacionGanadora.cotPrecioTotal) || 0;
    const subtotal = +(total / 1.12).toFixed(2);
    const iva = +(total - subtotal).toFixed(2);
    const estimado = currentSolicitud?.montoTotal || 0;
    const ahorro = estimado > total ? +(estimado - total).toFixed(2) : 0;
    const ahorroPct = estimado > 0 ? Math.round((ahorro / estimado) * 100) : 0;

    return { subtotal, iva, total, ahorro, ahorroPct };
  }, [cotizacionGanadora, currentSolicitud]);

  // Solicitud con Monto Total enriquecido basado en la cotización ganadora
  const solicitudEnriquecida = useMemo(() => {
    if (!currentSolicitud) return null;
    const montoCalculado = finanzas.total > 0 ? finanzas.total : currentSolicitud.montoTotal;
    return {
      ...currentSolicitud,
      montoTotal: Number(montoCalculado || 0),
    };
  }, [currentSolicitud, finanzas.total]);

  // Ejecutar Autorización Presupuestaria y Emisión de PO
  const handleAutorizarPresupuesto = async () => {
    if (!currentSolicitud || !cotizacionGanadora) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const poResult = await OrdenCompraClientService.autorizarPresupuesto({
        noDocumento: currentSolicitud.noDocumento,
        idCotizacionGanadora: cotizacionGanadora.cotIdCotizacion,
        notasAutorizacion: notasPresupuesto.trim(),
        subtotal: finanzas.subtotal,
        montoIva: finanzas.iva,
        total: finanzas.total,
      });

      setSuccessMsg(
        `¡Presupuesto Autorizado exitosamente! Se ha generado la Orden de Compra ${poResult.ocoNoPo}.`
      );
      setIsConfirmAuthOpen(false);
      setOrdenCompraExistente(poResult);
      setSelectedPoDocument(poResult);
      setIsPoDocumentModalOpen(true);
    } catch (err: any) {
      console.error('[PresupuestoView]: Error al autorizar presupuesto:', err);
      setErrorMsg(err.message || 'Error al autorizar el presupuesto en el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ejecutar Rechazo Presupuestario
  const handleRechazarPresupuesto = async () => {
    if (!currentSolicitud) return;
    if (!motivoRechazo.trim()) {
      setErrorMsg('Debe detallar el motivo del rechazo presupuestario.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await OrdenCompraClientService.rechazarPresupuesto({
        noDocumento: currentSolicitud.noDocumento,
        motivoRechazo: motivoRechazo.trim(),
      });

      setSuccessMsg('Se ha registrado el rechazo presupuestario exitosamente.');
      setIsRejectModalOpen(false);
      setMotivoRechazo('');
      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (err: any) {
      console.error('[PresupuestoView]: Error al rechazar presupuesto:', err);
      setErrorMsg(err.message || 'Error al registrar el rechazo presupuestario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Métricas para la vista general
  const metricasGenerales = useMemo(() => {
    const totalComprometido = ordenesCompraGenerales.reduce((acc, curr) => acc + (curr.ocoTotal || 0), 0);
    const solicitudesPresupuesto = solicitudesGenerales.filter((s) => getStageForSolicitud(s) === 'presupuesto');
    const pendientesValidacion = solicitudesPresupuesto.length;
    const ordenesEmitidas = ordenesCompraGenerales.length;

    const ahorroTotal = ordenesCompraGenerales.reduce((acc, po) => {
      const estimado = po.solMontoTotalEstimado || 0;
      const real = po.ocoTotal || 0;
      return acc + (estimado > real ? estimado - real : 0);
    }, 0);

    return { totalComprometido, pendientesValidacion, ordenesEmitidas, ahorroTotal };
  }, [solicitudesGenerales, ordenesCompraGenerales]);

  // Lista enriquecida para la tabla general
  const registrosTablaGeneral = useMemo(() => {
    return solicitudesGenerales
      .filter((sol) => {
        const stage = getStageForSolicitud(sol);
        const hasPo = ordenesCompraGenerales.some((p) => p.solNoDocumento === sol.solNoDocumento);

        const matchSearch =
          !searchQuery ||
          sol.solNoDocumento.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sol.solNombreDepartamento && sol.solNombreDepartamento.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (sol.solNombreResponsable && sol.solNombreResponsable.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (sol.solNotas && sol.solNotas.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchEstado = false;
        if (filterEstadoPresupuesto === 'TODOS') {
          // Mostrar únicamente solicitudes que han llegado a la etapa de Presupuesto o que ya tienen PO autorizada
          matchEstado = stage === 'presupuesto' || hasPo;
        } else if (filterEstadoPresupuesto === 'PENDIENTES') {
          matchEstado = stage === 'presupuesto' && !hasPo;
        } else if (filterEstadoPresupuesto === 'AUTORIZADAS') {
          matchEstado = hasPo;
        } else if (filterEstadoPresupuesto === 'RECHAZADAS') {
          matchEstado = (sol.solNombreEstado || '').toUpperCase() === 'RECHAZADA';
        }

        return matchSearch && matchEstado;
      })
      .map((sol) => {
        const po = ordenesCompraGenerales.find((p) => p.solNoDocumento === sol.solNoDocumento);
        return {
          ...sol,
          poAsociada: po,
          tienePo: !!po,
        };
      });
  }, [solicitudesGenerales, ordenesCompraGenerales, searchQuery, filterEstadoPresupuesto]);

  // ==========================================
  // RENDERIZADO: MODO ETAPA INDIVIDUAL (PIPELINE)
  // ==========================================
  if (solicitudEnriquecida) {
    const isPoEmitida = !!ordenCompraExistente;

    return (
      <div className="space-y-6 w-full pb-12 animate-fadeIn min-w-0">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedSolicitudFromTable) {
                  setSelectedSolicitudFromTable(null);
                } else if (onBack) {
                  onBack();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Volver a Solicitudes</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-bold">Visto Bueno de Presupuesto</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
              Etapa 4 de 6
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPoEmitida && onNavigateToStage && (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => onNavigateToStage('bodega')}
                className="shadow-sm"
              >
                Avanzar a Recepción en Bodega (Etapa 5)
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadSingleSolicitudData(solicitudEnriquecida.noDocumento)}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Card de Información de Solicitud (Muestra Monto Total y Responsable Reales) */}
        <SolicitudOriginalCard solicitud={solicitudEnriquecida} />

        {/* Estado de la Orden de Compra si ya fue emitida */}
        {isPoEmitida && ordenCompraExistente && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                      ORDEN DE COMPRA EMITIDA
                    </span>
                    <span className="text-xs text-slate-500">
                      Fecha: {formatDate(ordenCompraExistente.ocoFechaEmision)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Número Oficial PO: <span className="text-blue-600 font-mono">{ordenCompraExistente.ocoNoPo}</span>
                  </h2>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="text-left sm:text-right pr-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-medium">Monto Total Autorizado</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatCurrency(ordenCompraExistente.ocoTotal)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {cotizacionGanadora && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={FileText}
                      onClick={() => {
                        const url = CotizacionClientService.getDocumentoUrl(cotizacionGanadora.cotIdCotizacion);
                        window.open(url, '_blank');
                      }}
                      className="text-xs shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    >
                      Ver Cotización PDF
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Printer}
                    onClick={() => {
                      setSelectedPoDocument(ordenCompraExistente);
                      setIsPoDocumentModalOpen(true);
                    }}
                    className="text-xs shrink-0"
                  >
                    Ver / Imprimir PO
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={() => {
                      generarOrdenCompraPdf(ordenCompraExistente);
                    }}
                    className="text-xs shrink-0"
                  >
                    Descargar PDF
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block mb-1 font-medium">Subtotal Neto:</span>
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(ordenCompraExistente.ocoSubtotal)}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block mb-1 font-medium">IVA (12%):</span>
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(ordenCompraExistente.ocoMontoIva)}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block mb-1 font-medium">Estado en Flujo:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {ordenCompraExistente.estNombreEstado || 'EN RECEPCIÓN / BODEGA'}
                </span>
              </div>
            </div>

            {ordenCompraExistente.detalles && ordenCompraExistente.detalles.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Líneas de Artículos de la Orden de Compra:
                </h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5 font-bold">Código</th>
                        <th className="py-2.5 px-3.5 font-bold">Descripción</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Cant. Pedida</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Total Línea</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ordenCompraExistente.detalles.map((det) => (
                        <tr key={det.docIdDetallePo} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 font-mono text-blue-600 font-semibold">{det.docCodigoArticulo}</td>
                          <td className="py-2.5 px-3.5 font-medium text-slate-800">{det.artDescripcion || det.docCodigoArticulo}</td>
                          <td className="py-2.5 px-3.5 text-right font-medium">{det.docCantidadPedida}</td>
                          <td className="py-2.5 px-3.5 text-right">{formatCurrency(det.docPrecioUnitario)}</td>
                          <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">{formatCurrency(det.docTotalLinea)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel Simplificado de Visto Bueno Presupuestario y Emisión de PO */}
        {!isPoEmitida && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold border border-blue-200">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Visto Bueno Presupuestario y Emisión de Orden de Compra
                  </h2>
                  <p className="text-xs text-slate-500">
                    Revise la oferta adjudicada y confirme la autorización final para generar formalmente la PO
                  </p>
                </div>
              </div>

              {cotizacionGanadora && (
                <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5 w-fit">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  OFERTA ADJUDICADA #{cotizacionGanadora.cotIdCotizacion}
                </span>
              )}
            </div>

            {cotizacionGanadora ? (
              <div className="space-y-6">
                {/* Resumen del Proveedor Adjudicado */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-slate-600" />
                      <span className="font-bold text-slate-900 text-sm">
                        {cotizacionGanadora.cotNombreProveedor || 'Proveedor Ganador'}
                      </span>
                    </div>
                    {cotizacionGanadora.cotNitProveedor && (
                      <span className="text-xs font-mono bg-white px-2.5 py-1 border border-slate-200 rounded-md text-slate-600">
                        NIT: {cotizacionGanadora.cotNitProveedor}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block">Tiempo de Entrega:</span>
                      <span className="font-semibold text-slate-800">
                        {cotizacionGanadora.cotTiempoEntregaDias
                          ? `${cotizacionGanadora.cotTiempoEntregaDias} días hábiles`
                          : 'Inmediato'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Condición de Pago:</span>
                      <span className="font-semibold text-slate-800">
                        {cotizacionGanadora.cotCondicionPagoDias
                          ? `${cotizacionGanadora.cotCondicionPagoDias} días crédito`
                          : 'Contado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Estado de Selección:</span>
                      <span className="font-semibold text-emerald-700">
                        {cotizacionGanadora.cotEstadoAdjudicacion || 'GANADORA'}
                      </span>
                    </div>
                  </div>

                  {/* Acceso y Descarga de Cotización Ganadora / Original (BLOB en Oracle DB) */}
                  <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-700 truncate">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          Cotización Original #{cotizacionGanadora.cotIdCotizacion}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {cotizacionGanadora.cotRutaArchivoPdf || `cotizacion_${cotizacionGanadora.cotIdCotizacion}.pdf`} (Documento Digital)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={FileText}
                        onClick={() => {
                          const url = CotizacionClientService.getDocumentoUrl(cotizacionGanadora.cotIdCotizacion);
                          window.open(url, '_blank');
                        }}
                        className="text-xs bg-white text-blue-700 hover:bg-blue-50 border-blue-200 shadow-2xs font-semibold"
                      >
                        Ver Cotización PDF
                      </Button>
                      <a
                        href={CotizacionClientService.getDocumentoUrl(cotizacionGanadora.cotIdCotizacion)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`cotizacion_${cotizacionGanadora.cotIdCotizacion}.pdf`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300 shadow-2xs"
                      >
                        <Download size={13} className="text-slate-600" />
                        Descargar Documento
                      </a>
                    </div>
                  </div>
                </div>

                {/* Desglose Financiero */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-xs text-slate-500 font-medium block mb-1">Subtotal Neto</span>
                    <span className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(finanzas.subtotal)}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-xs text-slate-500 font-medium block mb-1">IVA (12%)</span>
                    <span className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(finanzas.iva)}</span>
                  </div>
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
                    <span className="text-xs text-blue-700 font-semibold block mb-1">Monto Total de la Orden (PO)</span>
                    <span className="text-2xl font-black text-blue-950 font-mono">{formatCurrency(finanzas.total)}</span>
                  </div>
                </div>

                {/* Observaciones / Notas Opcionales */}
                <div className="space-y-2">
                  <TextArea
                    label="Observaciones o Notas de Autorización (Opcional)"
                    placeholder="Ingrese cualquier aclaración, resolución o visto bueno financiero..."
                    value={notasPresupuesto}
                    onChange={(e) => setNotasPresupuesto(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Alerta / Validación In-situ (Visible sin necesidad de scroll) */}
                <InlineValidationCard
                  error={errorMsg}
                  onDismiss={() => setErrorMsg(null)}
                  title="Validación Presupuestaria"
                />

                {/* Acciones de Visto Bueno / Autorización */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    icon={XCircle}
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    Rechazar Compra
                  </Button>

                  <Button
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-sm px-6"
                    icon={FileCheck}
                    onClick={() => setIsConfirmAuthOpen(true)}
                    disabled={!cotizacionGanadora || isSubmitting}
                  >
                    Autorizar Compra y Emitir Orden de Compra (PO)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
                <AlertTriangle size={32} className="text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No se ha seleccionado ninguna cotización</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Para autorizar el presupuesto y generar la Orden de Compra, primero debe seleccionar un proveedor ganador en la Etapa 3 (Selección de Cotización).
                </p>
                {onNavigateToStage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ArrowLeft}
                    onClick={() => onNavigateToStage('seleccion')}
                  >
                    Ir a Selección de Cotizaciones
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal de Confirmación de Autorización */}
        <ConfirmDialog
          isOpen={isConfirmAuthOpen}
          title="¿Confirmar Autorización y Emitir Orden de Compra?"
          description={`Se autorizará formalmente la compra por un monto total de ${formatCurrency(
            finanzas.total
          )}. Esto creará la Orden de Compra oficial y avanzará la solicitud a la etapa de Recepción en Bodega.`}
          confirmText="Autorizar y Emitir PO"
          cancelText="Cancelar"
          variant="primary"
          isLoading={isSubmitting}
          onConfirm={handleAutorizarPresupuesto}
          onClose={() => setIsConfirmAuthOpen(false)}
        />

        {/* Modal de Rechazo Presupuestario */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 text-red-600">
                  <AlertTriangle size={22} />
                  <h3 className="text-base font-bold text-slate-900">Rechazar Solicitud de Compra</h3>
                </div>
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Indique el motivo por el cual no se autoriza la compra (ej. fondos insuficientes o ajuste necesario):
              </p>

              <TextArea
                label="Motivo del Rechazo *"
                placeholder="Especifique detalladamente el motivo..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={4}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  icon={X}
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  icon={XCircle}
                  onClick={handleRechazarPresupuesto}
                  disabled={!motivoRechazo.trim() || isSubmitting}
                >
                  Confirmar Rechazo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Oficial de Impresión y Descarga de Orden de Compra */}
        <OrdenCompraDocumentModal
          isOpen={isPoDocumentModalOpen}
          onClose={() => setIsPoDocumentModalOpen(false)}
          ordenCompra={selectedPoDocument || ordenCompraExistente}
        />
      </div>
    );
  }

  // ==========================================
  // RENDERIZADO: MODO MÓDULO GENERAL (TAB PRESUPUESTO)
  // ==========================================
  const columnsTableGeneral = [
    {
      header: 'NO. DOCUMENTO',
      accessorKey: 'solNoDocumento',
      align: 'left' as const,
      cell: ({ value }: { value: string }) => (
        <span className="font-bold text-blue-600 hover:underline text-xs">{value}</span>
      ),
    },
    {
      header: 'NO. PO EMITIDA',
      accessorKey: 'poAsociada',
      align: 'left' as const,
      cell: ({ value }: { value?: IOrdenCompra }) => {
        if (!value || !value.ocoNoPo) {
          return (
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              Pendiente PO
            </span>
          );
        }
        return (
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-md text-xs">
            {value.ocoNoPo}
          </span>
        );
      },
    },
    {
      header: 'DEPARTAMENTO',
      accessorKey: 'solNombreDepartamento',
      align: 'left' as const,
      cell: ({ value, row }: { value: string; row: any }) => (
        <span className="text-slate-700 font-medium text-xs">
          {value || `Departamento #${row.solIdDepartamento}`}
        </span>
      ),
    },
    {
      header: 'RESPONSABLE',
      accessorKey: 'solNombreResponsable',
      align: 'left' as const,
      cell: ({ value, row }: { value: string; row: any }) => (
        <span className="text-slate-700 font-medium text-xs">
          {value || `Usuario #${row.solIdUsuarioResponsable}`}
        </span>
      ),
    },
    {
      header: 'FECHA',
      accessorKey: 'solFecha',
      align: 'left' as const,
      cell: ({ value }: { value: string | Date }) => (
        <span className="text-slate-600 text-xs">{formatDate(value)}</span>
      ),
    },
    {
      header: 'MONTO OFERTADO / PO',
      accessorKey: 'solMontoTotalEstimado',
      align: 'right' as const,
      cell: ({ value, row }: { value: number; row: any }) => {
        const montoFinal = row.poAsociada?.ocoTotal || value || 0;
        return (
          <span className="font-bold text-slate-900 text-xs">{formatCurrency(montoFinal)}</span>
        );
      },
    },
    {
      header: 'ESTADO',
      accessorKey: 'solNombreEstado',
      align: 'left' as const,
      cell: ({ value, row }: { value: string; row: any }) => {
        if (row.tienePo) {
          return <StatusBadge status="COMPLETADA" label="PO EMITIDA" />;
        }
        return <StatusBadge status={value || 'PENDIENTE'} />;
      },
    },
    {
      header: 'ACCIONES',
      accessorKey: 'acciones',
      align: 'center' as const,
      cell: ({ row }: { row: any }) => {
        return (
          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {row.tienePo && row.poAsociada && (
              <Button
                variant="secondary"
                size="sm"
                icon={Printer}
                onClick={() => {
                  OrdenCompraClientService.getOrdenCompraPorNoPo(row.poAsociada.ocoNoPo).then((po) => {
                    if (po) {
                      setSelectedPoDocument(po);
                      setIsPoDocumentModalOpen(true);
                    }
                  });
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800"
                title="Imprimir / Descargar Orden de Compra Oficial"
              >
                Imprimir PO
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={row.tienePo ? FileText : FileCheck}
              onClick={() => {
                setSelectedSolicitudFromTable({
                  noDocumento: row.solNoDocumento,
                  fecha: formatDate(row.solFecha),
                  entidad: row.solNombreEntidad || 'Empresa Principal',
                  departamento: row.solNombreDepartamento || `Departamento #${row.solIdDepartamento}`,
                  responsable: row.solNombreResponsable || `Usuario #${row.solIdUsuarioResponsable}`,
                  montoTotal: row.poAsociada?.ocoTotal || row.solMontoTotalEstimado || 0,
                  estado: row.solNombreEstado || 'Pendiente',
                });
              }}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              {row.tienePo ? 'Detalle' : 'Validar'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 w-full pb-12 min-w-0">
      {/* Header Corporativo del Módulo Presupuesto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <PieChart className="text-blue-600" size={28} />
            Módulo de Presupuesto y Órdenes de Compra
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visto bueno financiero de adquisiciones y emisión oficial de Órdenes de Compra
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={RefreshCw} onClick={loadGeneralData}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen / Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Presupuesto Comprometido"
          value={formatCurrency(metricasGenerales.totalComprometido)}
          icon={DollarSign}
          changeLabel="Total Órdenes Emitidas"
        />
        <StatCard
          title="Pendientes de Autorización"
          value={metricasGenerales.pendientesValidacion}
          icon={Clock}
          changeLabel="En Espera de Visto Bueno"
        />
        <StatCard
          title="Órdenes de Compra (PO)"
          value={metricasGenerales.ordenesEmitidas}
          icon={FileCheck}
          isPositive={true}
          changeLabel="Emitidas en el Sistema"
        />
        <StatCard
          title="Ahorro Financiero Total"
          value={formatCurrency(metricasGenerales.ahorroTotal)}
          icon={TrendingDown}
          isPositive={true}
          changeLabel="Vs Presupuesto Estimado"
        />
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="secondary" size="sm" onClick={loadGeneralData}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex items-center w-full md:w-80">
          <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por Documento, Responsable o Departamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter size={15} className="text-slate-400" />
            <span>Filtro de Estado:</span>
          </div>

          <select
            value={filterEstadoPresupuesto}
            onChange={(e) => setFilterEstadoPresupuesto(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
          >
            <option value="TODOS">Todos los Registros</option>
            <option value="PENDIENTES">Pendientes de Presupuesto</option>
            <option value="AUTORIZADAS">Autorizadas / PO Emitida</option>
            <option value="RECHAZADAS">Rechazadas</option>
          </select>

          {(filterEstadoPresupuesto !== 'TODOS' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterEstadoPresupuesto('TODOS');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla Principal de Registros Presupuestarios */}
      <DataTable
        columns={columnsTableGeneral}
        data={registrosTablaGeneral}
        isLoading={isLoadingGeneral}
        onRowClick={(row) => {
          setSelectedSolicitudFromTable({
            noDocumento: row.solNoDocumento,
            fecha: formatDate(row.solFecha),
            entidad: row.solNombreEntidad || 'Empresa Principal',
            departamento: row.solNombreDepartamento || `Departamento #${row.solIdDepartamento}`,
            responsable: row.solNombreResponsable || `Usuario #${row.solIdUsuarioResponsable}`,
            montoTotal: row.poAsociada?.ocoTotal || row.solMontoTotalEstimado || 0,
            estado: row.solNombreEstado || 'Pendiente',
          });
        }}
        emptyText="No se encontraron registros de presupuesto en la base de datos."
      />

      {/* Modal Oficial de Impresión y Descarga de Orden de Compra */}
      <OrdenCompraDocumentModal
        isOpen={isPoDocumentModalOpen}
        onClose={() => setIsPoDocumentModalOpen(false)}
        ordenCompra={selectedPoDocument || ordenCompraExistente}
      />

      {/* Modal de Previsualización y Descarga de Cotización Ganadora (BLOB) */}
      <CotizacionDetailModal
        isOpen={isCotizacionModalOpen}
        onClose={() => setIsCotizacionModalOpen(false)}
        cotizacion={cotizacionGanadora}
      />
    </div>
  );
};
