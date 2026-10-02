import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Layers,
  RefreshCw,
  Clock,
  ArrowRight,
  ArrowLeft,
  Plus,
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Building2,
  GitBranch,
  BookOpen,
  ChevronRight,
  Activity,
  ShieldCheck,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react';
import { Button, StatCard, DataTable, Pagination } from '../../components/ui';
import { SolicitudCompraClientService } from './services/solicitudCompraClientService';
import { MatrizCotizacionesView } from './components/MatrizCotizacionesView';
import { SolicitudOriginalInfo } from './components/SolicitudOriginalCard';
import { SolicitudCreacionView } from './components/SolicitudCreacionView';
import { SolicitudCreacionModal } from './components/SolicitudCreacionModal';
import { ProveedoresCatalogView } from './components/ProveedoresCatalogView';
import { EstadosCatalogView } from './components/EstadosCatalogView';
import {
  PipelineProgress,
  PipelineStageId,
  getStageForSolicitud,
  isStatusRejected,
  isStatusFullyComplete,
  PIPELINE_STAGE_OPTIONS,
} from './components/PipelineProgress';
import { PipelineOverview } from './components/PipelineOverview';
import { AprobacionView } from './components/AprobacionView';
import { SeleccionCotizacionView } from './components/SeleccionCotizacionView';
import { PresupuestoView } from './components/PresupuestoView';
import { BodegaView } from './components/BodegaView';
import { ThreeWayMatchView } from './components/ThreeWayMatchView';
import { GuiasSistemaView } from './components/GuiasSistemaView';
import { ISolicitudCompra } from '@erp/contracts';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { scrollToTop } from '../../utils/scroll';

export type ComprasSection =
  | 'hub'
  | 'dashboard'
  | 'registros'
  | 'presupuesto'
  | 'proveedores'
  | 'estados'
  | 'guias';

export interface ComprasViewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const ComprasView: React.FC<ComprasViewProps> = ({
  activeTab: propTab,
  onTabChange,
}) => {
  // Navigation internal section
  const [currentSection, setCurrentSection] = useState<ComprasSection>(() => {
    if (propTab && propTab !== 'hub' && propTab !== 'registros') {
      return propTab as ComprasSection;
    }
    return 'hub';
  });

  const handleNavigate = (section: ComprasSection) => {
    setCurrentSection(section);
    scrollToTop(true);
    if (onTabChange) {
      onTabChange(section);
    }
  };

  // Solicitudes list from Oracle Database
  const [solicitudes, setSolicitudes] = useState<ISolicitudCompra[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Stage Sub-view (Matriz or any of the 6 pipeline stages)
  const [activeStageView, setActiveStageView] = useState<{
    stage: PipelineStageId;
    solicitud: ISolicitudCompra;
  } | null>(null);

  // Auto-scroll al inicio cada vez que se abre o cambia la etapa del pipeline
  useEffect(() => {
    if (activeStageView) {
      scrollToTop(true);
    }
  }, [activeStageView?.stage, activeStageView?.solicitud?.solNoDocumento]);

  // Modal para creación de nueva solicitud dentro de Registros
  // Modal para creación de nueva solicitud dentro de Registros
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Ámbito de visualización de registros: 'activas' (por defecto) vs 'finalizadas' (historial)
  const [viewScope, setViewScope] = useState<'activas' | 'finalizadas'>('activas');

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterEtapa, setFilterEtapa] = useState<string>('TODAS');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await SolicitudCompraClientService.getSolicitudes();
      setSolicitudes(data);
    } catch (error: any) {
      console.error('[ComprasView]: Error al cargar solicitudes de compra desde Oracle DB:', error);
      setErrorMsg(error.message || 'Error al conectar con la base de datos para obtener las solicitudes.');
      setSolicitudes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentSection]);

  // Conteos por ámbito estricto
  const activasCount = useMemo(() => {
    return solicitudes.filter((s) => {
      const isComplete = isStatusFullyComplete(s.solNombreEstado, s.solNotas);
      const isRej = isStatusRejected(s.solNombreEstado, s.solNotas);
      return !isComplete && !isRej;
    }).length;
  }, [solicitudes]);

  const historialCount = useMemo(() => {
    return solicitudes.filter((s) => {
      const isComplete = isStatusFullyComplete(s.solNombreEstado, s.solNotas);
      const isRej = isStatusRejected(s.solNombreEstado, s.solNotas);
      return isComplete || isRej;
    }).length;
  }, [solicitudes]);

  // Solicitudes activas en curso para el PipelineOverview
  const activasSolicitudes = useMemo(() => {
    return solicitudes.filter((s) => {
      const isComplete = isStatusFullyComplete(s.solNombreEstado, s.solNotas);
      const isRej = isStatusRejected(s.solNombreEstado, s.solNotas);
      return !isComplete && !isRej;
    });
  }, [solicitudes]);

  // Filtered dataset
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter((item) => {
      const isComplete = isStatusFullyComplete(item.solNombreEstado, item.solNotas);
      const isRej = isStatusRejected(item.solNombreEstado, item.solNotas);

      // 1. Exclusión de Solicitudes Activas:
      // La pestaña de Activas solo debe mostrar solicitudes en curso (NO finalizadas y NO rechazadas)
      if (viewScope === 'activas' && (isComplete || isRej)) {
        return false;
      }

      // 2. Inclusión en el Historial:
      // La pestaña de Historial debe incluir tanto las solicitudes Finalizadas como las Rechazadas
      if (viewScope === 'finalizadas' && !isComplete && !isRej) {
        return false;
      }

      const queryLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.solNoDocumento.toLowerCase().includes(queryLower) ||
        (item.solNotas && item.solNotas.toLowerCase().includes(queryLower)) ||
        (item.solNombreResponsable && item.solNombreResponsable.toLowerCase().includes(queryLower)) ||
        (item.solNombreDepartamento && item.solNombreDepartamento.toLowerCase().includes(queryLower));

      const estadoName = (item.solNombreEstado || '').toUpperCase();
      const filterUpper = filterEstado.toUpperCase();
      const matchEstado =
        filterEstado === 'TODOS' ||
        (filterUpper.startsWith('RECHAZAD') && isRej) ||
        (!isRej && (
          estadoName === filterUpper ||
          (filterUpper.startsWith('APROBAD') && estadoName.startsWith('APROBAD')) ||
          (filterUpper.startsWith('PENDIENT') && estadoName.startsWith('PENDIENT'))
        ));

      const itemStage = getStageForSolicitud(item);
      const matchEtapa = filterEtapa === 'TODAS' || itemStage === filterEtapa;

      return matchSearch && matchEstado && matchEtapa;
    });
  }, [solicitudes, viewScope, searchQuery, filterEstado, filterEtapa]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage) || 1;
  const paginatedSolicitudes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSolicitudes.slice(start, start + itemsPerPage);
  }, [filteredSolicitudes, currentPage, itemsPerPage]);

  // Stat metrics
  const totalCount = viewScope === 'activas' ? activasCount : historialCount;
  const aprobadasCount = solicitudes.filter(
    (s) => !isStatusRejected(s.solNombreEstado, s.solNotas) && (s.solNombreEstado || '').toUpperCase().startsWith('APROBAD')
  ).length;
  const pendientesCount = solicitudes.filter(
    (s) => !isStatusRejected(s.solNombreEstado, s.solNotas) && (s.solNombreEstado || '').toUpperCase().startsWith('PENDIENT')
  ).length;
  const totalMontoEstimado = filteredSolicitudes.reduce((acc, curr) => acc + (curr.solMontoTotalEstimado || 0), 0);

  // Convert ISolicitudCompra to SolicitudOriginalInfo for stage sub-views
  const getSolicitudInfoForMatriz = (sol: ISolicitudCompra): SolicitudOriginalInfo => {
    return {
      noDocumento: sol.solNoDocumento,
      fecha: formatDate(sol.solFecha, '2026-03-01'),
      entidad: sol.solNombreEntidad || 'Empresa Principal',
      departamento: sol.solNombreDepartamento || `Departamento #${sol.solIdDepartamento}`,
      responsable: sol.solNombreResponsable || `Usuario #${sol.solIdUsuarioResponsable}`,
      montoTotal: sol.solMontoTotalEstimado || 0,
      estado: sol.solNombreEstado || 'Aprobado',
    };
  };

  // Table Column Definitions for Solicitudes de Compra
  const tableColumns = [
    {
      header: 'NO. DOCUMENTO',
      accessorKey: 'solNoDocumento',
      align: 'left' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => (
        <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          {row.solNoDocumento}
        </span>
      ),
    },
    {
      header: 'FECHA',
      accessorKey: 'solFecha',
      align: 'left' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => (
        <span className="text-slate-600 text-xs">
          {formatDate(row.solFecha, '2026-03-01')}
        </span>
      ),
    },
    {
      header: 'SOLICITANTE / DEPARTAMENTO',
      accessorKey: 'solNombreDepartamento',
      align: 'left' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800 text-xs">
            {row.solNombreResponsable || `Usuario #${row.solIdUsuarioResponsable}`}
          </span>
          <span className="text-[11px] text-slate-400">
            {row.solNombreDepartamento || `Depto. #${row.solIdDepartamento}`}
          </span>
        </div>
      ),
    },
    {
      header: 'MONTO ESTIMADO',
      accessorKey: 'solMontoTotalEstimado',
      align: 'right' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => (
        <span className="font-bold text-slate-800 text-xs">
          {formatCurrency(row.solMontoTotalEstimado || 0)}
        </span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'solNombreEstado',
      align: 'center' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => {
        const est = (row.solNombreEstado || 'Pendiente').toUpperCase();
        let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        let displayLabel = row.solNombreEstado || 'Pendiente';

        if (est.startsWith('FINALIZAD') || est === 'CERRADA' || est === 'LIQUIDADA') {
          colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
          displayLabel = 'FINALIZADA';
        } else if (est.includes('3WAY') || est.includes('MATCH')) {
          colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
          displayLabel = '3-WAY MATCH';
        } else if (est.startsWith('RECIBID') || est.includes('BODEGA')) {
          colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold';
        } else if (est.includes('PRESUP') || est.includes('ADJUDICAD')) {
          colorClasses = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
        } else if (est.startsWith('APROBAD')) {
          colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
        } else if (est.startsWith('PENDIENT') || est.startsWith('SOLICITAD')) {
          colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
        } else if (est.startsWith('RECHAZAD') || est.startsWith('DENEGAD') || est.startsWith('CANCELAD')) {
          colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${colorClasses}`}
          >
            {displayLabel}
          </span>
        );
      },
    },
    {
      header: 'ETAPA DEL PROCESO',
      accessorKey: 'etapa',
      align: 'center' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => {
        const stage = getStageForSolicitud(row);
        return (
          <PipelineProgress
            solicitud={row}
            status={row.solNombreEstado || undefined}
            onSelectStage={(stageId, solicitud) => {
              const targetStage = stageId === 'rechazada' ? 'aprobacion' : stageId;
              setActiveStageView({ stage: targetStage, solicitud });
            }}
          />
        );
      },
    },
    {
      header: 'ACCIONES',
      align: 'center' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => {
        const currentStage = getStageForSolicitud(row);
        const isComplete = isStatusFullyComplete(row.solNombreEstado, row.solNotas);
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActiveStageView({ stage: currentStage, solicitud: row });
            }}
            className={`text-xs font-semibold ${
              isComplete
                ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
            }`}
          >
            {isComplete ? 'Ver Detalle' : 'Gestionar'} <ArrowRight size={13} className="ml-1" />
          </Button>
        );
      },
    },
  ];

  // Stage Navigation within the Stage Sub-view
  const handleNavigateToStage = (newStage: PipelineStageId) => {
    if (activeStageView) {
      setActiveStageView({
        stage: newStage,
        solicitud: activeStageView.solicitud,
      });
    }
  };

  const handleCloseStageView = () => {
    setActiveStageView(null);
    scrollToTop(true);
    loadData();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: SUB-VISTA DE ETAPA DEL PIPELINE (SI HAY UNA SELECCIONADA)
  // ─────────────────────────────────────────────────────────────────────────────
  if (activeStageView) {
    const solInfo = getSolicitudInfoForMatriz(activeStageView.solicitud);
    switch (activeStageView.stage) {
      case 'aprobacion':
        return (
          <AprobacionView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onNavigateToStage={handleNavigateToStage}
            onSuccess={() => {
              handleCloseStageView();
              setSuccessNotification('¡Solicitud aprobada exitosamente! Enviada a la bandeja de Cotizaciones.');
            }}
          />
        );
      case 'matriz':
        return (
          <MatrizCotizacionesView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onNavigateToStage={handleNavigateToStage}
            onSuccess={() => {
              handleCloseStageView();
              setSuccessNotification('¡Cotizaciones guardadas exitosamente! La solicitud ha avanzado a la etapa de Selección de Cotización.');
            }}
          />
        );
      case 'seleccion':
        return (
          <SeleccionCotizacionView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onNavigateToStage={handleNavigateToStage}
            onSuccess={() => {
              handleCloseStageView();
              setSuccessNotification('¡Cotización adjudicada exitosamente! Enviada a la bandeja de Presupuesto.');
            }}
          />
        );
      case 'presupuesto':
        return (
          <PresupuestoView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onNavigateToStage={handleNavigateToStage}
            onSuccess={() => {
              handleCloseStageView();
              setSuccessNotification('¡Presupuesto validado y Orden de Compra emitida exitosamente! Enviada a la bandeja de Bodega.');
            }}
          />
        );
      case 'bodega':
        return (
          <BodegaView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onNavigateToStage={handleNavigateToStage}
            onSuccess={() => {
              handleCloseStageView();
              setSuccessNotification('¡Recepción en Bodega registrada exitosamente! Mercancía ingresada a inventario y enviada a la bandeja de 3-Way Match.');
            }}
          />
        );
      case '3way':
        return (
          <ThreeWayMatchView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onNavigateToStage={handleNavigateToStage}
            onSuccess={() => {
              handleCloseStageView();
              setSuccessNotification('¡3-Way Match conciliado y liquidado con éxito! Ciclo de compras finalizado y factura enviada a Cuentas por Pagar (CXP).');
            }}
          />
        );
      default:
        return (
          <MatrizCotizacionesView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onNavigateToStage={handleNavigateToStage}
            onSuccess={() => {
              handleCloseStageView();
              setSuccessNotification('¡Proceso completado exitosamente y enviado a la bandeja correspondiente!');
            }}
          />
        );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: HUB PRINCIPAL DE COMPRAS (CARDS)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentSection === 'hub') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fadeIn select-none">
        {/* Banner de Bienvenida y Header del Módulo */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <ShoppingCart size={14} className="text-blue-600" />
              <span>Ciclo de Aprovisionamiento y Compras</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Módulo de Compras
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Administración integral del flujo de adquisiciones corporativas: seguimiento de solicitudes, comparativa de cotizaciones, control presupuestario, recepción en almacén y conciliación 3-Way Match.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <ShoppingCart size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE CATEGORÍAS (GRID PRINCIPAL) */}
        <div className="space-y-8">
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 1: OPERACIONES Y FUNCIONALIDADES (PARTE SUPERIOR) */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Header de Sección */}
            <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Operaciones y Funcionalidades
                  </h2>
                  <p className="text-xs text-slate-500">
                    Monitoreo general, gestión de solicitudes y control presupuestario.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                3 Operaciones
              </span>
            </div>

            {/* Grid de Sub-Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Dashboard */}
              <button
                type="button"
                onClick={() => handleNavigate('dashboard')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <BarChart3 size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Dashboard
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Indicadores clave, métricas y resumen general del módulo.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-blue-600 group-hover:underline">
                    Ver indicadores
                  </span>
                  <span className="text-[11px] text-slate-400">Métricas & KPIs</span>
                </div>
              </button>

              {/* Card 2: Registros */}
              <button
                type="button"
                onClick={() => handleNavigate('registros')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <FileText size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Registros
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Bandeja principal de solicitudes, pipeline y transacciones.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600 group-hover:underline">
                    Ver transacciones
                  </span>
                  <span className="text-[11px] text-slate-400">Pipeline & Solicitudes</span>
                </div>
              </button>

              {/* Card 3: Presupuesto */}
              <button
                type="button"
                onClick={() => handleNavigate('presupuesto')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Wallet size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Presupuesto
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Control de techos presupuestarios y vistos buenos.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600 group-hover:underline">
                    Gestionar partidas
                  </span>
                  <span className="text-[11px] text-slate-400">Finanzas</span>
                </div>
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 2: CATÁLOGOS Y REFERENCIAS DEL SISTEMA (PARTE INFERIOR) */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 pt-2">
            {/* Header de Sección */}
            <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Catálogos y Referencias del Sistema
                  </h2>
                  <p className="text-xs text-slate-500">
                    Directorios de proveedores, parametrización de estados y documentación de apoyo.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100">
                3 Catálogos
              </span>
            </div>

            {/* Grid de Sub-Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Proveedores */}
              <button
                type="button"
                onClick={() => handleNavigate('proveedores')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Building2 size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Proveedores
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Directorio y gestión de aliados comerciales y empresas.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-amber-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Directorio</span>
                </div>
              </button>

              {/* Card 2: Estados */}
              <button
                type="button"
                onClick={() => handleNavigate('estados')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-cyan-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <GitBranch size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-cyan-600 group-hover:bg-cyan-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      Estados
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Configuración de la máquina de estados y fases del pipeline.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-cyan-600 group-hover:underline">
                    Configurar estados
                  </span>
                  <span className="text-[11px] text-slate-400">Parametrización</span>
                </div>
              </button>

              {/* Card 3: Guías del Sistema */}
              <button
                type="button"
                onClick={() => handleNavigate('guias')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <BookOpen size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      Guías del Sistema
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Manuales y documentación multimedia de apoyo.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-purple-600 group-hover:underline">
                    Ver documentación
                  </span>
                  <span className="text-[11px] text-slate-400">Ayuda & Manuales</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: VISTAS ESPECÍFICAS CON BARRA DE RETORNO AL HUB
  // ─────────────────────────────────────────────────────────────────────────────
  const sectionMeta: Record<
    Exclude<ComprasSection, 'hub'>,
    { title: string; category: string; icon: React.ReactNode }
  > = {
    dashboard: {
      title: 'Dashboard de Compras',
      category: 'Operaciones y Funcionalidades',
      icon: <BarChart3 size={18} className="text-blue-600" />,
    },
    registros: {
      title: 'Bandeja de Registros y Solicitudes',
      category: 'Operaciones y Funcionalidades',
      icon: <FileText size={18} className="text-indigo-600" />,
    },
    presupuesto: {
      title: 'Control Presupuestario',
      category: 'Operaciones y Funcionalidades',
      icon: <Wallet size={18} className="text-emerald-600" />,
    },
    proveedores: {
      title: 'Directorio de Proveedores',
      category: 'Catálogos y Referencias del Sistema',
      icon: <Building2 size={18} className="text-amber-600" />,
    },
    estados: {
      title: 'Catálogo de Estados',
      category: 'Catálogos y Referencias del Sistema',
      icon: <GitBranch size={18} className="text-cyan-600" />,
    },
    guias: {
      title: 'Guías y Manuales del Sistema',
      category: 'Catálogos y Referencias del Sistema',
      icon: <BookOpen size={18} className="text-purple-600" />,
    },
  };

  const currentMeta = sectionMeta[currentSection as Exclude<ComprasSection, 'hub'>];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Barra superior de navegación interna */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => handleNavigate('hub')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300 shadow-2xs"
          >
            Volver a Compras
          </Button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Breadcrumb path */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => handleNavigate('hub')}
              className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              Compras
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-400 hidden md:inline">
              {currentMeta?.category}
            </span>
            <ChevronRight size={14} className="text-slate-400 hidden md:inline" />
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              {currentMeta?.icon}
              {currentMeta?.title}
            </span>
          </div>
        </div>

        {/* Acceso rápido a otras secciones relacionadas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'registros', label: 'Registros' },
              { id: 'presupuesto', label: 'Presupuesto' },
              { id: 'proveedores', label: 'Proveedores' },
              { id: 'estados', label: 'Estados' },
              { id: 'guias', label: 'Guías' },
            ] as const
          ).map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDERIZADO SEGÚN LA SECCIÓN SELECCIONADA */}
      {currentSection === 'presupuesto' && <PresupuestoView />}
      {currentSection === 'proveedores' && <ProveedoresCatalogView />}
      {currentSection === 'estados' && <EstadosCatalogView />}
      {currentSection === 'guias' && <GuiasSistemaView />}

      {(currentSection === 'dashboard' || currentSection === 'registros') && (
        <div className="space-y-6">
          {/* Header Bar de Registros / Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <FileText className="text-blue-600" size={28} />
                {currentSection === 'dashboard'
                  ? 'Panel de Control de Compras'
                  : 'Solicitudes y Pipeline de Compras'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {currentSection === 'dashboard'
                  ? 'Resumen ejecutivo de métricas clave, presupuesto y avance del pipeline'
                  : 'Gestión integral del ciclo de compras, trazabilidad de etapas y cotizaciones'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" icon={RefreshCw} onClick={loadData}>
                Actualizar
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setIsCreateModalOpen(true)}
                className="shadow-sm"
              >
                Crear Solicitud
              </Button>
            </div>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Solicitudes"
              value={totalCount}
              icon={Layers}
              changeLabel="En Base de Datos"
            />
            <StatCard
              title="Solicitudes Aprobadas"
              value={aprobadasCount}
              icon={CheckCircle2}
              isPositive={true}
              changeLabel="Listas para Cotizar"
            />
            <StatCard
              title="Monto Estimado Total"
              value={formatCurrency(totalMontoEstimado)}
              icon={DollarSign}
              changeLabel="Presupuesto Estimado"
            />
            <StatCard
              title="Pendientes Aprobación"
              value={pendientesCount}
              icon={Clock}
              changeLabel="Por Autorizar"
            />
          </div>

          {/* Notificación de Éxito / Proceso Completado */}
          {successNotification && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center justify-between animate-fadeIn shadow-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span>{successNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessNotification(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
              <span>{errorMsg}</span>
              <Button variant="secondary" size="sm" onClick={loadData}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Selector de Ámbito / Pestañas de Registros: Activas / En Proceso vs. Historial (Finalizadas y Rechazadas) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl gap-1 border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setViewScope('activas');
                  setFilterEtapa('TODAS');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewScope === 'activas'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Activity size={15} className={viewScope === 'activas' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Activas / En Proceso</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    viewScope === 'activas'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {activasCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewScope('finalizadas');
                  setFilterEtapa('TODAS');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewScope === 'finalizadas'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <CheckCircle2 size={15} className={viewScope === 'finalizadas' ? 'text-emerald-600' : 'text-slate-400'} />
                <span>Historial / Finalizadas y Rechazadas</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    viewScope === 'finalizadas'
                      ? 'bg-slate-200 text-slate-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {historialCount}
                </span>
              </button>
            </div>

            {/* Texto de estado contextual */}
            <div className="text-xs text-slate-500 px-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${viewScope === 'activas' ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`} />
              {viewScope === 'activas' ? (
                <span>Bandeja operativa: solicitudes vigentes en curso (excluye finalizadas y rechazadas)</span>
              ) : (
                <span>Repositorio histórico: solicitudes formalmente liquidadas o rechazadas para consulta y auditoría</span>
              )}
            </div>
          </div>

          {/* Pipeline de las 6 etapas interactivo (enfocado en el flujo activo) */}
          <PipelineOverview
            registros={viewScope === 'activas' ? activasSolicitudes : solicitudes}
            activeStage={filterEtapa}
            onStageClick={(stg) => {
              setFilterEtapa(stg);
              setCurrentPage(1);
            }}
          />

          {/* Toolbar Search & Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex items-center w-full md:w-80">
              <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por No. Documento o Notas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Filtrar por Etapa (6 Fases del Ciclo de Compras) */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Layers size={15} className="text-slate-400" />
                <span>Filtrar por Etapa:</span>
              </div>

              <select
                value={filterEtapa}
                onChange={(e) => {
                  setFilterEtapa(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              >
                {PIPELINE_STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Filtrar por Estado */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Filter size={15} className="text-slate-400" />
                <span>Filtrar por Estado:</span>
              </div>

              <select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="APROBADA">APROBADA</option>
                <option value="3WAY_MATCH">3-WAY MATCH</option>
                <option value="FINALIZADA">FINALIZADA</option>
                <option value="RECHAZADA">RECHAZADA</option>
              </select>

              {/* Botón de limpiar filtros cuando alguno está activo */}
              {(filterEtapa !== 'TODAS' || filterEstado !== 'TODOS' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterEtapa('TODAS');
                    setFilterEstado('TODOS');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Main DataTable list from Oracle Database */}
          <DataTable
            columns={tableColumns}
            data={paginatedSolicitudes}
            isLoading={isLoading}
            onRowClick={(sol) => {
              const defaultStage = getStageForSolicitud(sol);
              setActiveStageView({ stage: defaultStage, solicitud: sol });
            }}
            emptyText={
              viewScope === 'activas'
                ? 'No se encontraron solicitudes de compra activas en curso actualmente.'
                : 'No se encontraron solicitudes finalizadas en el historial.'
            }
          />

          {/* Pagination Footer */}
          {!isLoading && filteredSolicitudes.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              showingText={`Mostrando ${Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredSolicitudes.length
              )}-${Math.min(currentPage * itemsPerPage, filteredSolicitudes.length)} de ${filteredSolicitudes.length
                } solicitudes`}
            />
          )}

          {/* Modal para Creación de Solicitud de Compra */}
          <SolicitudCreacionModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onReload={loadData}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              loadData();
            }}
          />
        </div>
      )}
    </div>
  );
};
