import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Package,
  Layers,
  FileCheck2,
  ShieldCheck,
  Ban,
  Loader2,
  X,
} from 'lucide-react';
import { Button, StatusBadge, TextArea } from '../../../components/ui';
import { SolicitudOriginalCard, SolicitudOriginalInfo } from './SolicitudOriginalCard';
import { SolicitudCompraClientService } from '../services/solicitudCompraClientService';
import { ISolicitudCompraCompleta } from '@erp/contracts';

export interface AprobacionViewProps {
  solicitud: SolicitudOriginalInfo;
  onBack: () => void;
  onSuccess?: () => void;
}

interface EditableDetalleItem {
  idDetalle: number;
  codigoArticulo: string;
  descripcion: string;
  unidad: string;
  cantidadPedida: number;
  cantidadAprobada: number;
}

export const AprobacionView: React.FC<AprobacionViewProps> = ({
  solicitud,
  onBack,
  onSuccess,
}) => {
  const [solicitudData, setSolicitudData] = useState<ISolicitudCompraCompleta | null>(null);
  const [items, setItems] = useState<EditableDetalleItem[]>([]);
  const [notasAprobacion, setNotasAprobacion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal de Rechazo
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Carga inicial de datos de la solicitud y sus artículos desde Oracle DB
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const completa = await SolicitudCompraClientService.getSolicitudCompleta(solicitud.noDocumento);
        if (!isMounted) return;

        if (completa) {
          setSolicitudData(completa);
          setNotasAprobacion(completa.solNotas || '');

          const mappedItems: EditableDetalleItem[] = (completa.detalles || []).map((d) => ({
            idDetalle: d.dsoIdDetalleSolicitud,
            codigoArticulo: d.dsoCodigoArticulo,
            descripcion: d.artDescripcion || d.dsoCodigoArticulo,
            unidad: d.umeAbreviatura || d.umeNombreUnidad || 'UND',
            cantidadPedida: Number(d.dsoCantidadPedida || 0),
            cantidadAprobada: Number(d.dsoCantidadAprobada ?? d.dsoCantidadPedida ?? 0),
          }));

          setItems(mappedItems);
        } else {
          // Fallback a detalles directos si la ruta completa no devuelve datos
          const detalles = await SolicitudCompraClientService.getDetalles(solicitud.noDocumento);
          if (!isMounted) return;

          const mapped: EditableDetalleItem[] = detalles.map((d) => ({
            idDetalle: d.dsoIdDetalleSolicitud,
            codigoArticulo: d.dsoCodigoArticulo,
            descripcion: d.artDescripcion || d.dsoCodigoArticulo,
            unidad: d.umeAbreviatura || d.umeNombreUnidad || 'UND',
            cantidadPedida: Number(d.dsoCantidadPedida || 0),
            cantidadAprobada: Number(d.dsoCantidadAprobada ?? d.dsoCantidadPedida ?? 0),
          }));

          setItems(mapped);
        }
      } catch (err: any) {
        console.error('[AprobacionView.fetchData Error]:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Error al obtener los detalles de la solicitud de compra.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [solicitud.noDocumento]);

  const estadoActual = (solicitudData?.solNombreEstado || solicitud.estado || 'PENDIENTE').toUpperCase();
  const isPendiente = estadoActual.includes('PENDIENTE') || estadoActual.includes('REVISION') || estadoActual.includes('SOLICITADO');
  const isAprobada = estadoActual.includes('APROBADA') || estadoActual.includes('APROBADO');
  const isRechazada = estadoActual.includes('RECHAZAD') || estadoActual.includes('CERRAD');

  // Métricas
  const totalItems = items.length;
  const totalCantidadPedida = items.reduce((acc, curr) => acc + curr.cantidadPedida, 0);
  const totalCantidadAprobada = items.reduce((acc, curr) => acc + curr.cantidadAprobada, 0);

  // Manejo de cambio en la cantidad aprobada
  const handleCantidadAprobadaChange = (idDetalle: number, valStr: string) => {
    const val = valStr === '' ? 0 : Math.max(0, Number(valStr));
    setItems((prev) =>
      prev.map((item) => (item.idDetalle === idDetalle ? { ...item, cantidadAprobada: val } : item))
    );
  };

  // Botón rápido: Aprobar todo al 100% de lo pedido
  const handleAprobarTodo = () => {
    setItems((prev) => prev.map((i) => ({ ...i, cantidadAprobada: i.cantidadPedida })));
  };

  // Botón rápido: Limpiar a 0
  const handlePonerEnCero = () => {
    setItems((prev) => prev.map((i) => ({ ...i, cantidadAprobada: 0 })));
  };

  // Guardar Cambios sin alterar el estado
  const handleGuardarCambios = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        notas: notasAprobacion,
        detalles: items.map((i) => ({
          idDetalle: i.idDetalle,
          cantidadAprobada: i.cantidadAprobada,
        })),
      };

      const updated = await SolicitudCompraClientService.actualizarSolicitud(solicitud.noDocumento, payload);
      setSolicitudData(updated);
      setSuccessMsg('Ajustes y cantidades guardados correctamente.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los ajustes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aprobar Solicitud
  const handleAprobarSolicitud = async () => {
    if (totalCantidadAprobada <= 0) {
      setErrorMsg('Debe autorizar al menos 1 unidad de algún artículo para aprobar la solicitud.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        notasAprobacion: notasAprobacion.trim() || undefined,
        detalles: items.map((i) => ({
          idDetalle: i.idDetalle,
          cantidadAprobada: i.cantidadAprobada,
        })),
      };

      const aprobada = await SolicitudCompraClientService.aprobarSolicitud(solicitud.noDocumento, payload);
      setSolicitudData(aprobada);
      setSuccessMsg('¡Solicitud aprobada con éxito! Ha avanzado a la etapa de Matriz de Cotizaciones.');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        else onBack();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al aprobar la solicitud.');
      setIsSubmitting(false);
    }
  };

  // Rechazar Solicitud
  const handleConfirmRechazo = async () => {
    if (!motivoRechazo || motivoRechazo.trim() === '') {
      setRejectError('Debe ingresar un motivo para el rechazo o denegación.');
      return;
    }

    setIsSubmitting(true);
    setRejectError(null);

    try {
      const rechazada = await SolicitudCompraClientService.rechazarSolicitud(solicitud.noDocumento, {
        motivoRechazo: motivoRechazo.trim(),
      });

      setSolicitudData(rechazada);
      setIsRejectModalOpen(false);
      setSuccessMsg('La solicitud ha sido rechazada y su ciclo ha sido cerrado.');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        else onBack();
      }, 1500);
    } catch (err: any) {
      setRejectError(err.message || 'Error al procesar el rechazo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-16 animate-fadeIn min-w-0">
      {/* Barra de Navegación Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} disabled={isSubmitting}>
            Volver a Registros
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Etapa 1 de 6
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Aprobación de Solicitud de Compra
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Estado actual:</span>
          <StatusBadge status={estadoActual} size="md" />
        </div>
      </div>

      {/* Tarjeta con Información de la Solicitud Original */}
      <SolicitudOriginalCard
        solicitud={{
          ...solicitud,
          estado: estadoActual,
        }}
      />

      {/* Alertas de Notificación */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm animate-fadeIn">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error al procesar la solicitud</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Operación exitosa</p>
            <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Aviso si la solicitud ya no está pendiente */}
      {isAprobada && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4 text-blue-900 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Esta solicitud ya ha sido Aprobada</p>
              <p className="text-xs text-blue-700">
                La solicitud completó su autorización y se encuentra lista para cotizaciones en la Etapa 2 (Matriz).
              </p>
            </div>
          </div>
        </div>
      )}

      {isRechazada && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-900 text-sm">
          <Ban size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Esta solicitud se encuentra Rechazada / Cerrada</p>
            <p className="text-xs text-amber-700">
              No puede avanzar a cotizaciones debido a su denegación formal.
            </p>
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Artículos Solicitados</p>
            <p className="text-xl font-bold text-slate-800">{totalItems} líneas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Unidades Solicitadas</p>
            <p className="text-xl font-bold text-slate-800">{totalCantidadPedida} u.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totalCantidadAprobada === totalCantidadPedida
                ? 'bg-emerald-50 text-emerald-600'
                : totalCantidadAprobada > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            <FileCheck2 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Unidades a Aprobar</p>
            <p className="text-xl font-bold text-slate-800">
              {totalCantidadAprobada} u.{' '}
              <span className="text-xs font-medium text-slate-400">
                ({totalCantidadPedida > 0 ? Math.round((totalCantidadAprobada / totalCantidadPedida) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Artículos de la Requisición */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded-full inline-block" />
              Detalle de Artículos y Cantidades
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPendiente
                ? 'Revisa y ajusta las cantidades autorizadas para cada artículo antes de emitir el dictamen.'
                : 'Detalle de los artículos y cantidades registradas en la solicitud.'}
            </p>
          </div>

          {isPendiente && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAprobarTodo}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Aprobar Todo (100%)
              </button>
              <button
                type="button"
                onClick={handlePonerEnCero}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Restablecer a 0
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-32">Código</th>
                <th className="py-3 px-4">Descripción del Artículo</th>
                <th className="py-3 px-4 w-28 text-center">Unidad</th>
                <th className="py-3 px-4 w-32 text-right">Cant. Pedida</th>
                <th className="py-3 px-4 w-40 text-right">Cant. Aprobada</th>
                <th className="py-3 px-4 w-32 text-center">Estado Línea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Cargando artículos de la solicitud...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron detalles de artículos asociados a esta solicitud.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isTotal = item.cantidadAprobada === item.cantidadPedida && item.cantidadPedida > 0;
                  const isParcial = item.cantidadAprobada > 0 && item.cantidadAprobada < item.cantidadPedida;
                  const isCero = item.cantidadAprobada === 0;

                  return (
                    <tr key={item.idDetalle} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{item.codigoArticulo}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 block">{item.descripcion}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono font-medium">
                          {item.unidad}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {item.cantidadPedida}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPendiente ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={item.cantidadAprobada}
                              onChange={(e) => handleCantidadAprobadaChange(item.idDetalle, e.target.value)}
                              className="w-24 h-8 px-2.5 text-right text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900">{item.cantidadAprobada}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isTotal && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Total
                          </span>
                        )}
                        {isParcial && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle size={12} /> Parcial
                          </span>
                        )}
                        {isCero && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={12} /> No aprobada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs text-slate-500">
                    Totales Acumulados:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm">{totalCantidadPedida}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-blue-600">{totalCantidadAprobada}</td>
                  <td className="py-3 px-4 text-center text-xs text-slate-400 font-normal">
                    {totalItems} artículos
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Dictamen y Observaciones */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-indigo-600 rounded-full inline-block" />
          Dictamen y Notas del Aprobador
        </h3>
        <p className="text-xs text-slate-500">
          Registra las instrucciones, justificaciones de reducción o comentarios para el equipo de compras.
        </p>

        {isPendiente ? (
          <TextArea
            value={notasAprobacion}
            onChange={(e) => setNotasAprobacion(e.target.value)}
            placeholder="Ejemplo: Se autoriza la compra de los insumos según la cuota asignada para el presente trimestre..."
            rows={3}
          />
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
            {notasAprobacion || 'Sin notas registradas para este dictamen.'}
          </div>
        )}
      </div>

      {/* Barra de Acciones */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} disabled={isSubmitting}>
            Regresar a Solicitudes
          </Button>
        </div>

        {isPendiente && (
          <div className="flex items-center gap-3">
            {/* Rechazar */}
            <Button
              variant="danger"
              size="sm"
              icon={Ban}
              onClick={() => {
                setRejectError(null);
                setMotivoRechazo('');
                setIsRejectModalOpen(true);
              }}
              disabled={isSubmitting}
            >
              Rechazar Solicitud
            </Button>

            {/* Guardar Ajustes */}
            <Button
              variant="secondary"
              size="sm"
              icon={Save}
              onClick={handleGuardarCambios}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Ajustes'}
            </Button>

            {/* Aprobar */}
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={handleAprobarSolicitud}
              disabled={isSubmitting || totalCantidadAprobada <= 0}
            >
              {isSubmitting ? 'Aprobando...' : 'Aprobar Solicitud'}
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Rechazo */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <XCircle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Rechazar Solicitud de Compra
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documento: {solicitud.noDocumento}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p>
                  Esta acción denegará formalmente la solicitud{' '}
                  <span className="font-bold">{solicitud.noDocumento}</span> y cerrará el ciclo de compras para este requerimiento.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Motivo o Justificación del Rechazo <span className="text-red-500">*</span>
                </label>
                <TextArea
                  value={motivoRechazo}
                  onChange={(e) => {
                    setMotivoRechazo(e.target.value);
                    setRejectError(null);
                  }}
                  placeholder="Indica el motivo del rechazo (ej. presupuesto insuficiente, solicitud duplicada, especificaciones no conformes)..."
                  rows={3}
                />
                {rejectError && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={13} /> {rejectError}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  onClick={handleConfirmRechazo}
                  disabled={isSubmitting || !motivoRechazo.trim()}
                >
                  {isSubmitting ? 'Rechazando...' : 'Confirmar Rechazo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
