import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Scale,
  TrendingDown,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Eye,
  ShieldCheck,
  ArrowRight,
  Download,
} from 'lucide-react';
import { Button, StatusBadge } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';
import { CotizacionClientService } from '../services/cotizacionClientService';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';
import { ICotizacion, ISolicitudCompraDetalle } from '@erp/contracts';
import { formatCurrency } from '../../../utils/formatters';
import { CotizacionDetailModal } from './CotizacionDetailModal';

export interface SeleccionCotizacionViewProps {
  solicitud: SolicitudOriginalInfo;
  onBack: () => void;
  onSuccess?: () => void;
  onNavigateToStage?: (stageId: 'aprobacion' | 'matriz' | 'seleccion' | 'presupuesto' | 'bodega' | '3way') => void;
}

export const SeleccionCotizacionView: React.FC<SeleccionCotizacionViewProps> = ({
  solicitud,
  onBack,
  onSuccess,
  onNavigateToStage,
}) => {
  const [cotizaciones, setCotizaciones] = useState<ICotizacion[]>([]);
  const [detallesSolicitud, setDetallesSolicitud] = useState<ISolicitudCompraDetalle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal para ver detalle completo de cotización
  const [selectedCotizacionDetail, setSelectedCotizacionDetail] = useState<ICotizacion | null>(null);

  // Estado para el modal de adjudicación
  const [adjudicarTarget, setAdjudicarTarget] = useState<ICotizacion | null>(null);
  const [criterioSeleccion, setCriterioSeleccion] = useState<string>('MENOR_COSTO');
  const [justificacionAdjudicacion, setJustificacionAdjudicacion] = useState<string>('');
  const [isAdjudicating, setIsAdjudicating] = useState<boolean>(false);

  // Cargar cotizaciones y detalles de la solicitud desde Oracle DB
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [cots, solCompleta] = await Promise.all([
        CotizacionClientService.getCotizaciones({ noSolicitud: solicitud.noDocumento }),
        SolicitudCompraClientService.getSolicitudCompleta(solicitud.noDocumento).catch(() => null),
      ]);

      setCotizaciones(cots);
      if (solCompleta && solCompleta.detalles) {
        setDetallesSolicitud(solCompleta.detalles);
      }
    } catch (err: any) {
      console.error('[SeleccionCotizacionView]: Error al cargar datos de Oracle DB:', err);
      setErrorMsg(err.message || 'Error al obtener las cotizaciones de la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (solicitud.noDocumento) {
      loadData();
    }
  }, [solicitud.noDocumento]);

  // Cotización ganadora si existe
  const cotizacionGanadora = useMemo(() => {
    return cotizaciones.find(
      (c) => (c.cotEstadoAdjudicacion || '').toUpperCase() === 'GANADORA' ||
             (c.cotEstadoAdjudicacion || '').toUpperCase() === 'ADJUDICADA'
    ) || null;
  }, [cotizaciones]);

  // Menor precio ofertado
  const menorPrecio = useMemo(() => {
    if (cotizaciones.length === 0) return 0;
    return Math.min(...cotizaciones.map((c) => c.cotPrecioTotal));
  }, [cotizaciones]);

  // Mejor tiempo de entrega
  const mejorTiempoEntrega = useMemo(() => {
    const conTiempo = cotizaciones.filter(
      (c) => c.cotTiempoEntregaDias !== null && c.cotTiempoEntregaDias !== undefined && c.cotTiempoEntregaDias > 0
    );
    if (conTiempo.length === 0) return null;
    return Math.min(...conTiempo.map((c) => c.cotTiempoEntregaDias!));
  }, [cotizaciones]);

  // Ahorro respecto al presupuesto estimado
  const ahorroEstimado = useMemo(() => {
    const precioBase = cotizacionGanadora ? cotizacionGanadora.cotPrecioTotal : menorPrecio;
    if (solicitud.montoTotal && precioBase && solicitud.montoTotal > precioBase) {
      const diff = solicitud.montoTotal - precioBase;
      const pct = Math.round((diff / solicitud.montoTotal) * 100);
      return { monto: diff, porcentaje: pct };
    }
    return null;
  }, [solicitud.montoTotal, cotizacionGanadora, menorPrecio]);

  // Confirmar Adjudicación de la oferta seleccionada y avanzar automáticamente a Presupuesto
  const handleConfirmAdjudicacion = async () => {
    if (!adjudicarTarget) return;

    setIsAdjudicating(true);
    setErrorMsg(null);
    try {
      const criterioTexto = 
        criterioSeleccion === 'MENOR_COSTO' ? 'Menor precio ofertado' :
        criterioSeleccion === 'TIEMPO_ENTREGA' ? 'Menor tiempo de entrega' :
        criterioSeleccion === 'CONDICIONES_PAGO' ? 'Mejores plazos de pago y crédito' :
        criterioSeleccion === 'CALIDAD_GARANTIA' ? 'Mejor calidad técnica y garantía' :
        'Proveedor único calificado / Excepción';

      const dictamenCompleto = `Criterio: ${criterioTexto}. ${justificacionAdjudicacion.trim()}`;

      await CotizacionClientService.adjudicarCotizacion(
        adjudicarTarget.cotIdCotizacion,
        solicitud.noDocumento,
        dictamenCompleto
      );

      setSuccessMsg(`¡Oferta de ${adjudicarTarget.cotNombreProveedor || 'Proveedor'} adjudicada exitosamente! Enviando a la bandeja de Presupuesto.`);
      setAdjudicarTarget(null);
      setJustificacionAdjudicacion('');

      // Retornar al listado principal con confirmación
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        await loadData();
      }
    } catch (err: any) {
      console.error('[SeleccionCotizacionView]: Error al adjudicar cotización:', err);
      setErrorMsg(err.message || 'Error al registrar la adjudicación en el sistema.');
    } finally {
      setIsAdjudicating(false);
    }
  };

  // Solicitud enriquecida con el monto de la cotización ganadora o menor oferta
  const solicitudEnriquecida = useMemo(() => {
    const precioGanador = cotizacionGanadora ? cotizacionGanadora.cotPrecioTotal : (menorPrecio > 0 ? menorPrecio : solicitud.montoTotal);
    return {
      ...solicitud,
      montoTotal: Number(precioGanador || 0),
    };
  }, [solicitud, cotizacionGanadora, menorPrecio]);

  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn min-w-0">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Solicitudes</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">Selección y Cuadro Comparativo</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
            Etapa 3 de 6
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            disabled={isLoading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Solicitud Info Card */}
      <SolicitudOriginalCard solicitud={solicitudEnriquecida} />

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:underline text-xs">
            Cerrar
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold hover:underline ml-2">
            Descartar
          </button>
        </div>
      )}

      {/* KPI Comparison Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Ofertas Recibidas
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{cotizaciones.length}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              {cotizaciones.length >= 3 ? 'Matriz 360° completa' : `${cotizaciones.length} proveedor(es) cotizados`}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Menor Precio Ofertado
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {menorPrecio > 0 ? formatCurrency(menorPrecio) : 'N/A'}
            </div>
            <div className="text-xs text-emerald-700 mt-1 font-semibold">
              {ahorroEstimado
                ? `Ahorro de ${formatCurrency(ahorroEstimado.monto)} (-${ahorroEstimado.porcentaje}%)`
                : 'Mejor postura económica'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Mejor Tiempo Entrega
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {mejorTiempoEntrega !== null ? `${mejorTiempoEntrega} días` : 'N/A'}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Entrega más expedita</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Estado Adjudicación
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cotizacionGanadora ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <Award size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {cotizacionGanadora ? 'Adjudicada' : 'Pendiente'}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium truncate" title={cotizacionGanadora ? (cotizacionGanadora.cotNombreProveedor || '') : ''}>
              {cotizacionGanadora
                ? (cotizacionGanadora.cotNombreProveedor || `Proveedor #${cotizacionGanadora.cotIdProveedor}`)
                : 'En evaluación comparativa'}
            </div>
            {cotizacionGanadora && (
              <button
                type="button"
                onClick={() => {
                  const url = CotizacionClientService.getDocumentoUrl(cotizacionGanadora.cotIdCotizacion);
                  window.open(url, '_blank');
                }}
                className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <FileText size={13} />
                Ver Cotización Ganadora (PDF)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cuadro Comparativo / Matriz de Ofertas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale className="text-blue-600" size={20} />
              Cuadro Comparativo 360° de Cotizaciones
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Analice precios, plazos y condiciones comerciales para seleccionar la oferta ganadora oficial
            </p>
          </div>

          {cotizaciones.length > 0 && onNavigateToStage && (
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => onNavigateToStage('matriz')}
            >
              Editar Matriz
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="animate-spin mx-auto text-blue-600" size={32} />
            <p className="text-sm font-medium">Consultando cotizaciones registradas...</p>
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <FileSpreadsheet size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No hay cotizaciones registradas</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Para seleccionar una oferta ganadora, primero debe registrar las cotizaciones en la etapa de Matriz.
            </p>
            {onNavigateToStage && (
              <Button
                variant="primary"
                icon={FileSpreadsheet}
                onClick={() => onNavigateToStage('matriz')}
              >
                Ingresar a Matriz de Cotizaciones
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cotizaciones.map((cot, index) => {
              const isGanadora =
                (cot.cotEstadoAdjudicacion || '').toUpperCase() === 'GANADORA' ||
                (cot.cotEstadoAdjudicacion || '').toUpperCase() === 'ADJUDICADA';
              const isLowestPrice = cot.cotPrecioTotal === menorPrecio && cotizaciones.length > 1;
              const hasPdf = Boolean(cot.cotRutaArchivoPdf || cot.cotArchivoPdf);

              return (
                <div
                  key={cot.cotIdCotizacion || index}
                  className={`relative rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between ${
                    isGanadora
                      ? 'bg-emerald-50/40 border-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Oferta #{index + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isLowestPrice && !isGanadora && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                          <TrendingDown size={12} />
                          Mejor Precio
                        </span>
                      )}
                      {isGanadora ? (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-600 text-white rounded-full flex items-center gap-1.5 shadow-xs">
                          <Award size={13} />
                          GANADORA
                        </span>
                      ) : (
                        <StatusBadge status={cot.cotEstadoAdjudicacion || 'PENDIENTE'} />
                      )}
                    </div>
                  </div>

                  {/* Provider Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${isGanadora ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        <Building2 size={22} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-base leading-tight truncate" title={cot.cotNombreProveedor || 'Proveedor'}>
                          {cot.cotNombreProveedor || `Proveedor #${cot.cotIdProveedor}`}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          NIT: {cot.cotNitProveedor || 'N/D'}
                        </p>
                      </div>
                    </div>

                    {/* Price Block */}
                    <div className={`p-4 rounded-xl border ${isGanadora ? 'bg-emerald-100/60 border-emerald-200' : 'bg-slate-50 border-slate-100'} space-y-1`}>
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                        Precio Total Ofertado
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-slate-900">
                          {formatCurrency(cot.cotPrecioTotal)}
                        </span>
                        {solicitud.montoTotal && cot.cotPrecioTotal < solicitud.montoTotal ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            -{Math.round(((solicitud.montoTotal - cot.cotPrecioTotal) / solicitud.montoTotal) * 100)}%
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Conditions Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock size={12} />
                          Entrega
                        </span>
                        <span className="font-bold text-slate-800">
                          {cot.cotTiempoEntregaDias ? `${cot.cotTiempoEntregaDias} días hábiles` : 'Inmediata'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <CreditCard size={12} />
                          Condición
                        </span>
                        <span className="font-bold text-slate-800">
                          {cot.cotCondicionPagoDias ? `${cot.cotCondicionPagoDias} días crédito` : 'Contado'}
                        </span>
                      </div>
                    </div>

                    {/* PDF attachment indicator */}
                    <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <FileText size={14} className="text-red-500 shrink-0" />
                        <span className="truncate text-[11px] font-medium font-mono">
                          {cot.cotRutaArchivoPdf || `cotizacion_${cot.cotIdCotizacion}.pdf`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            const url = CotizacionClientService.getDocumentoUrl(cot.cotIdCotizacion);
                            window.open(url, '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-[11px] flex items-center gap-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={12} /> Ver
                        </button>
                        <a
                          href={CotizacionClientService.getDocumentoUrl(cot.cotIdCotizacion)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`cotizacion_${cot.cotIdCotizacion}.pdf`}
                          className="text-slate-600 hover:text-slate-800 font-semibold text-[11px] flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                          title="Descargar documento PDF original"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {isGanadora ? (
                      <div className="space-y-1.5 w-full">
                        <div className="w-full py-2 px-3 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs">
                          <CheckCircle2 size={16} />
                          Oferta Ganadora Adjudicada
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FileText}
                          onClick={() => {
                            const url = CotizacionClientService.getDocumentoUrl(cot.cotIdCotizacion);
                            window.open(url, '_blank');
                          }}
                          className="w-full justify-center text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 font-semibold"
                        >
                          Ver Cotización PDF
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        icon={Award}
                        className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                        onClick={() => {
                          setAdjudicarTarget(cot);
                          setCriterioSeleccion(isLowestPrice ? 'MENOR_COSTO' : 'CALIDAD_GARANTIA');
                        }}
                      >
                        Elegir como Ganadora
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Solicitud Items Breakdown Card */}
      {detallesSolicitud.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-slate-600" />
              Artículos Requeridos en la Solicitud ({detallesSolicitud.length})
            </h3>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Artículo</th>
                  <th className="py-2.5 px-4 text-center">Cantidad Pedida</th>
                  <th className="py-2.5 px-4 text-center">Cantidad Aprobada</th>
                  <th className="py-2.5 px-4 text-center">Unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detallesSolicitud.map((item, idx) => (
                  <tr key={item.dsoIdDetalleSolicitud || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      <div>{item.artDescripcion || `Artículo #${item.dsoCodigoArticulo}`}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Cód: {item.dsoCodigoArticulo}</div>
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-700">
                      {item.dsoCantidadPedida}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-blue-600">
                      {item.dsoCantidadAprobada ?? item.dsoCantidadPedida}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-500 font-mono">
                      {item.umeAbreviatura || item.umeNombreUnidad || 'UN'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Adjudicación Oficial */}
      {adjudicarTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Adjudicar Oferta Ganadora</h3>
                  <p className="text-xs text-slate-300">Solicitud {solicitud.noDocumento}</p>
                </div>
              </div>
              <button
                onClick={() => setAdjudicarTarget(null)}
                className="text-slate-400 hover:text-white transition-colors"
                disabled={isAdjudicating}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Selected Provider Card */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    Proveedor Seleccionado
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {formatCurrency(adjudicarTarget.cotPrecioTotal)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {adjudicarTarget.cotNombreProveedor || `Proveedor #${adjudicarTarget.cotIdProveedor}`}
                </h4>
                <div className="flex items-center gap-4 text-slate-600 text-[11px]">
                  <span>NIT: <strong>{adjudicarTarget.cotNitProveedor || 'N/D'}</strong></span>
                  <span>Entrega: <strong>{adjudicarTarget.cotTiempoEntregaDias || 0} días</strong></span>
                  <span>Pago: <strong>{adjudicarTarget.cotCondicionPagoDias || 0} días</strong></span>
                </div>
              </div>

              {/* Criterio Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Criterio Principal de Selección *
                </label>
                <select
                  value={criterioSeleccion}
                  onChange={(e) => setCriterioSeleccion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                >
                  <option value="MENOR_COSTO">1. Menor Precio Ofertado (Postura Económica Más Favorable)</option>
                  <option value="TIEMPO_ENTREGA">2. Menor Tiempo de Entrega (Urgencia Operativa)</option>
                  <option value="CONDICIONES_PAGO">3. Mejores Condiciones de Crédito y Financiamiento</option>
                  <option value="CALIDAD_GARANTIA">4. Mayor Respaldo Técnico, Calidad y Garantía</option>
                  <option value="EXCEPCION_UNICO">5. Proveedor Único Autorizado / Fabricante Exclusivo</option>
                </select>
              </div>

              {/* Justification Textarea */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Dictamen / Justificación de Adjudicación (Opcional)
                </label>
                <textarea
                  value={justificacionAdjudicacion}
                  onChange={(e) => setJustificacionAdjudicacion(e.target.value)}
                  placeholder="Ingrese detalles técnicos o comerciales que sustenten la elección de esta propuesta..."
                  rows={3}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Al confirmar, las demás cotizaciones de esta solicitud quedarán descartadas y el proceso avanzará para la validación presupuestaria y emisión de la Orden de Compra (PO).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                icon={X}
                onClick={() => setAdjudicarTarget(null)}
                disabled={isAdjudicating}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                icon={Check}
                onClick={handleConfirmAdjudicacion}
                disabled={isAdjudicating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isAdjudicating ? 'Adjudicando...' : 'Confirmar Adjudicación'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cotización Detail Modal */}
      {selectedCotizacionDetail && (
        <CotizacionDetailModal
          isOpen={Boolean(selectedCotizacionDetail)}
          cotizacion={selectedCotizacionDetail}
          onClose={() => setSelectedCotizacionDetail(null)}
        />
      )}
    </div>
  );
};
