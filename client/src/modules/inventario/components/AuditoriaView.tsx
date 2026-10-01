import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Warehouse,
  Plus,
  Scale,
  FileCheck,
} from 'lucide-react';
import { Button, StatCard, StatusBadge, ConfirmDialog } from '../../../components/ui';
import { TomaFisicaClientService } from '../services/tomaFisicaClientService';
import { BodegaClientService } from '../services/bodegaClientService';
import type { ITomaFisicaResponseDTO, IDetalleConteoDTO } from '@erp/contracts';
import { AuditoriaModal } from './AuditoriaModal';

const DEFAULT_BODEGAS = [
  { id: 1, nombre: 'Bodega Principal Central' },
  { id: 2, nombre: 'Bodega Secundaria Norte' },
];

export const AuditoriaView: React.FC = () => {
  const [bodegas, setBodegas] = useState<{ id: number; nombre: string }[]>(DEFAULT_BODEGAS);
  const [bodegaActiva, setBodegaActiva] = useState<number>(1);
  const [tomaActiva, setTomaActiva] = useState<ITomaFisicaResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmCierreModal, setConfirmCierreModal] = useState<{
    isOpen: boolean;
    detallesConteo: IDetalleConteoDTO[];
    sinContarCount: number;
  }>({ isOpen: false, detallesConteo: [], sinContarCount: 0 });
  const [conteos, setConteos] = useState<Record<string, number | ''>>({});

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDiff, setFilterDiff] = useState<string>('TODOS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBodegas = async () => {
    try {
      const data = await BodegaClientService.getBodegas({ activo: 1 });
      if (data && data.length > 0) {
        setBodegas(data.map(b => ({ id: b.bodIdBodega, nombre: b.bodNombre })));
      }
    } catch (e) {
      console.warn('Usando bodegas por defecto:', e);
    }
  };

  useEffect(() => {
    loadBodegas();
  }, []);

  const cargarTomaActiva = async () => {
    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const toma = await TomaFisicaClientService.getActiva(bodegaActiva);
      setTomaActiva(toma);
      if (toma) {
        const initConteos: Record<string, number | ''> = {};
        toma.detalles.forEach(d => {
          if (d.stockFisico === 0 && d.diferencia === 0) {
            initConteos[d.codigoArticulo] = '';
          } else {
            initConteos[d.codigoArticulo] = d.stockFisico !== null ? d.stockFisico : '';
          }
        });
        setConteos(initConteos);
      } else {
        setConteos({});
      }
    } catch (error: any) {
      console.error('[AuditoriaView] Error al cargar toma activa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarTomaActiva();
  }, [bodegaActiva]);

  const handleAperturarDesdeModal = async (idBodega: number, idUsuario: number, motivo?: string) => {
    setBodegaActiva(idBodega);
    await TomaFisicaClientService.aperturar({ idBodega, idUsuario });
    await cargarTomaActiva();
    setFeedbackMsg({ type: 'success', text: `Auditoría iniciada correctamente para la bodega seleccionada.` });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleGuardar = async () => {
    if (!tomaActiva) return;

    const detallesConteo: IDetalleConteoDTO[] = [];
    tomaActiva.detalles.forEach(d => {
      const fisico = conteos[d.codigoArticulo];
      if (fisico !== '') {
        detallesConteo.push({
          codigoArticulo: d.codigoArticulo,
          stockFisico: Number(fisico),
        });
      }
    });

    if (detallesConteo.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Debe registrar al menos un conteo físico antes de guardar.' });
      return;
    }

    if (detallesConteo.length < tomaActiva.detalles.length) {
      setConfirmCierreModal({
        isOpen: true,
        detallesConteo,
        sinContarCount: tomaActiva.detalles.length - detallesConteo.length,
      });
      return;
    }

    await ejecutarGuardarConteo(detallesConteo);
  };

  const ejecutarGuardarConteo = async (detalles: IDetalleConteoDTO[]) => {
    if (!tomaActiva) return;
    setIsLoading(true);
    try {
      await TomaFisicaClientService.guardarConteo(tomaActiva.idToma, {
        idToma: tomaActiva.idToma,
        idUsuario: 3,
        detalles,
      });
      setFeedbackMsg({ type: 'success', text: 'Auditoría guardada, ajustada y cerrada exitosamente.' });
      setConfirmCierreModal({ isOpen: false, detallesConteo: [], sinContarCount: 0 });
      await cargarTomaActiva();
    } catch (error: any) {
      setFeedbackMsg({ type: 'error', text: error.message || 'Error al guardar el conteo.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Metrics
  const totalArticulosToma = tomaActiva ? tomaActiva.detalles.length : 0;
  const contadosCount = useMemo(() => {
    if (!tomaActiva) return 0;
    return tomaActiva.detalles.filter(d => conteos[d.codigoArticulo] !== '').length;
  }, [tomaActiva, conteos]);

  const diferenciasCount = useMemo(() => {
    if (!tomaActiva) return 0;
    return tomaActiva.detalles.filter(d => {
      const f = conteos[d.codigoArticulo];
      return f !== '' && Number(f) !== d.stockTeorico;
    }).length;
  }, [tomaActiva, conteos]);

  const porcentajeProgreso = totalArticulosToma > 0 
    ? Math.round((contadosCount / totalArticulosToma) * 100) 
    : 100;

  // Filtered details
  const filteredDetalles = useMemo(() => {
    if (!tomaActiva) return [];
    return tomaActiva.detalles.filter(d => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        d.codigoArticulo.toLowerCase().includes(query) ||
        d.nombreArticulo.toLowerCase().includes(query);

      const fisico = conteos[d.codigoArticulo];
      let matchDiff = true;
      if (filterDiff === 'CON_DIFERENCIA') {
        matchDiff = fisico !== '' && Number(fisico) !== d.stockTeorico;
      } else if (filterDiff === 'CUADRADOS') {
        matchDiff = fisico !== '' && Number(fisico) === d.stockTeorico;
      } else if (filterDiff === 'PENDIENTES') {
        matchDiff = fisico === '';
      }

      return matchSearch && matchDiff;
    });
  }, [tomaActiva, conteos, searchQuery, filterDiff]);

  const nombreBodegaActual = bodegas.find(b => b.id === bodegaActiva)?.nombre || `Bodega #${bodegaActiva}`;

  return (
    <div className="space-y-6">
      {/* Header with Title and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <ClipboardList size={18} />
            </div>
            Auditoría de Inventario (Toma Física)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Realice conteos físicos de existencias, detecte diferencias contra el sistema y aplique ajustes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={cargarTomaActiva} disabled={isLoading}>
            Actualizar
          </Button>
          {!tomaActiva && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Aperturar Auditoría
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ESTADO AUDITORÍA"
          value={tomaActiva ? 'En Progreso' : 'Sin Pendientes'}
          icon={ClipboardList}
          changeLabel={tomaActiva ? `${tomaActiva.numeroToma}` : 'Bodega al día'}
        />
        <StatCard
          title="ARTÍCULOS A CONTAR"
          value={totalArticulosToma}
          icon={Scale}
          changeLabel="en la toma física"
        />
        <StatCard
          title="CONTEOS REGISTRADOS"
          value={`${contadosCount} / ${totalArticulosToma}`}
          icon={FileCheck}
          isPositive={true}
          changeLabel={`${porcentajeProgreso}% avance`}
        />
        <StatCard
          title="DIFERENCIAS DETECTADAS"
          value={diferenciasCount}
          icon={AlertTriangle}
          isPositive={diferenciasCount === 0}
          changeLabel="discrepancias encontradas"
        />
      </div>

      {/* Feedback Alerts */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold underline ml-2">
            Descartar
          </button>
        </div>
      )}

      {/* Selector de Bodega y Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Warehouse size={16} className="text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 shrink-0">Bodega:</span>
          <select
            value={bodegaActiva}
            onChange={(e) => setBodegaActiva(Number(e.target.value))}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer min-w-[200px]"
          >
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        {tomaActiva && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar artículo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <select
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value)}
              className="h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="TODOS">Todos</option>
              <option value="CON_DIFERENCIA">Con Diferencias</option>
              <option value="CUADRADOS">Cuadrados</option>
              <option value="PENDIENTES">Pendientes</option>
            </select>
          </div>
        )}
      </div>

      {/* Cuerpo Principal */}
      {!tomaActiva ? (
        /* Empty State Corporativo */
        <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-xs">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No hay auditoría activa para {nombreBodegaActual}
          </h3>
          <p className="text-slate-500 max-w-md text-xs sm:text-sm mb-6 leading-relaxed">
            Al aperturar una nueva auditoría física, el sistema congelará el saldo teórico de los artículos para que el equipo de almacén proceda con el levantamiento físico de existencias.
          </p>
          <Button
            variant="primary"
            icon={Play}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-sm"
          >
            Aperturar Toma Física
          </Button>
        </div>
      ) : (
        /* Tabla de Conteo Físico en Progreso */
        <div className="space-y-4">
          {/* Banner de Auditoría en Progreso */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <ClipboardList size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 tracking-tight">
                    {tomaActiva.numeroToma}
                  </span>
                  <StatusBadge status="revisión" label="En Progreso" size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bodega: <span className="font-semibold text-slate-700">{nombreBodegaActual}</span> • {contadosCount} de {totalArticulosToma} artículos ingresados
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              icon={Save}
              onClick={handleGuardar}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              {isLoading ? 'Guardando...' : 'Guardar y Cerrar Auditoría'}
            </Button>
          </div>

          {/* Tabla de Conteo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-4.5 sm:py-3.5">Código</th>
                    <th className="px-4 py-3 sm:px-4.5 sm:py-3.5">Artículo / Producto</th>
                    <th className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-center">Stock Teórico (Sistema)</th>
                    <th className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-center bg-indigo-50/50 text-indigo-900">
                      Conteo Físico Real
                    </th>
                    <th className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-center">Diferencia</th>
                    <th className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm text-slate-800">
                  {filteredDetalles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-medium">
                        No hay artículos que coincidan con la búsqueda o filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredDetalles.map((d) => {
                      const fisico = conteos[d.codigoArticulo];
                      const hasCount = fisico !== '';
                      const numFisico = Number(fisico);
                      const diff = hasCount ? numFisico - d.stockTeorico : 0;

                      return (
                        <tr
                          key={d.codigoArticulo}
                          className={`transition-colors ${
                            !hasCount
                              ? 'hover:bg-slate-50/50'
                              : diff < 0
                              ? 'bg-rose-50/30 hover:bg-rose-50/50'
                              : diff > 0
                              ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                              : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="px-4 py-3 sm:px-4.5 sm:py-3.5">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                              {d.codigoArticulo}
                            </span>
                          </td>
                          <td className="px-4 py-3 sm:px-4.5 sm:py-3.5 font-medium text-slate-800">
                            {d.nombreArticulo}
                          </td>
                          <td className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-center">
                            <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-700 text-xs">
                              {d.stockTeorico} Unds.
                            </span>
                          </td>
                          <td className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-center bg-indigo-50/20">
                            <input
                              type="number"
                              min="0"
                              value={fisico}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                setConteos({ ...conteos, [d.codigoArticulo]: val });
                              }}
                              className="w-24 h-9 px-2.5 text-center font-bold text-sm text-indigo-950 bg-white border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                          </td>
                          <td className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-center">
                            {!hasCount ? (
                              <span className="text-slate-300 font-bold">-</span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={13} /> {diff} (Faltante)
                              </span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={13} /> +{diff} (Sobrante)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={13} className="text-slate-400" /> 0 (Cuadrado)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 sm:px-4.5 sm:py-3.5 text-right">
                            {hasCount ? (
                              <StatusBadge status="aprobado" label="Contado" size="sm" />
                            ) : (
                              <StatusBadge status="pendiente" label="Pendiente" size="sm" />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con resumen de conteo */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
              <span>
                Mostrando <strong className="text-slate-900">{filteredDetalles.length}</strong> de <strong className="text-slate-900">{totalArticulosToma}</strong> artículos
              </span>
              <div className="flex items-center gap-4 font-medium">
                <span className="text-emerald-700">Contados: {contadosCount}</span>
                <span className="text-amber-700">Pendientes: {totalArticulosToma - contadosCount}</span>
                <span className="text-rose-700">Diferencias: {diferenciasCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Aperturar Auditoría */}
      <AuditoriaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAperturarDesdeModal}
        bodegas={bodegas}
        currentBodegaId={bodegaActiva}
      />

      {/* Modal de Confirmación de Cierre Incompleto */}
      <ConfirmDialog
        isOpen={confirmCierreModal.isOpen}
        onClose={() => setConfirmCierreModal({ isOpen: false, detallesConteo: [], sinContarCount: 0 })}
        onConfirm={() => ejecutarGuardarConteo(confirmCierreModal.detallesConteo)}
        title="¿Deseas cerrar la auditoría con artículos pendientes?"
        itemName={`${confirmCierreModal.sinContarCount} artículo(s) sin registrar`}
        description="Si procede a guardar ahora, la toma física se cerrará y los artículos pendientes se mantendrán sin modificaciones en sus existencias."
        confirmText="Cerrar y Ajustar"
        variant="warning"
        isLoading={isLoading}
      />
    </div>
  );
};
