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
  Plus,
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
} from './components/PipelineProgress';
import { AprobacionView } from './components/AprobacionView';
import { SeleccionCotizacionView } from './components/SeleccionCotizacionView';
import { PresupuestoView } from './components/PresupuestoView';
import { BodegaView } from './components/BodegaView';
import { ThreeWayMatchView } from './components/ThreeWayMatchView';
import { ISolicitudCompra } from '@erp/contracts';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface ComprasViewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const ComprasView: React.FC<ComprasViewProps> = ({
  activeTab = 'dashboard',
  onTabChange,
}) => {
  // Solicitudes list from Oracle Database
  const [solicitudes, setSolicitudes] = useState<ISolicitudCompra[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Stage Sub-view (Matriz or any of the 6 pipeline stages)
  const [activeStageView, setActiveStageView] = useState<{
    stage: PipelineStageId;
    solicitud: ISolicitudCompra;
  } | null>(null);

  // Modal para creación de nueva solicitud dentro de Registros
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, [activeTab]);

  // Filtered dataset
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter((item) => {
      const queryLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.solNoDocumento.toLowerCase().includes(queryLower) ||
        (item.solNotas && item.solNotas.toLowerCase().includes(queryLower));

      const estadoName = (item.solNombreEstado || '').toUpperCase();
      const filterUpper = filterEstado.toUpperCase();
      const matchEstado =
        filterEstado === 'TODOS' ||
        estadoName === filterUpper ||
        (filterUpper.startsWith('APROBAD') && estadoName.startsWith('APROBAD')) ||
        (filterUpper.startsWith('PENDIENT') && estadoName.startsWith('PENDIENT')) ||
        (filterUpper.startsWith('RECHAZAD') && estadoName.startsWith('RECHAZAD'));

      return matchSearch && matchEstado;
    });
  }, [solicitudes, searchQuery, filterEstado]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage) || 1;
  const paginatedSolicitudes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSolicitudes.slice(start, start + itemsPerPage);
  }, [filteredSolicitudes, currentPage, itemsPerPage]);

  // Stat metrics
  const totalCount = solicitudes.length;
  const aprobadasCount = solicitudes.filter(
    (s) => (s.solNombreEstado || '').toUpperCase().startsWith('APROBAD')
  ).length;
  const pendientesCount = solicitudes.filter(
    (s) => (s.solNombreEstado || '').toUpperCase().startsWith('PENDIENT')
  ).length;
  const totalMontoEstimado = solicitudes.reduce((acc, curr) => acc + (curr.solMontoTotalEstimado || 0), 0);

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
      className: 'whitespace-nowrap',
      cell: ({ value }: { value: string }) => {
        const shortDoc = value ? value.replace(/^([A-Za-z]+)-\d{4}-/, '$1-') : value;
        return (
          <span
            className="font-bold text-blue-600 hover:underline whitespace-nowrap"
            title={value}
          >
            {shortDoc}
          </span>
        );
      },
    },
    {
      header: 'FECHA',
      accessorKey: 'solFecha',
      className: 'whitespace-nowrap',
      cell: ({ value }: { value: string | Date }) => (
        <span className="text-slate-600 font-medium whitespace-nowrap">{formatDate(value, '2026-03-01')}</span>
      ),
    },
    {
      header: 'DEPARTAMENTO',
      accessorKey: 'solNombreDepartamento',
      cell: ({ value, row }: { value: string; row: ISolicitudCompra }) => {
        const depto = value || `Departamento #${row.solIdDepartamento}`;
        return (
          <span className="text-slate-700 font-medium max-w-[140px] truncate block" title={depto}>
            {depto}
          </span>
        );
      },
    },
    {
      header: 'RESPONSABLE',
      accessorKey: 'solNombreResponsable',
      cell: ({ value, row }: { value: string; row: ISolicitudCompra }) => {
        const resp = value || `Empleado #${row.solIdUsuarioResponsable}`;
        return (
          <span className="text-slate-700 font-medium max-w-[130px] truncate block" title={resp}>
            {resp}
          </span>
        );
      },
    },
    {
      header: 'DESCRIPCIÓN / NOTAS',
      accessorKey: 'solNotas',
      cell: ({ value }: { value: string | null }) => (
        <span
          className="text-slate-700 max-w-[160px] md:max-w-[200px] lg:max-w-[260px] truncate block"
          title={value || 'Sin notas adicionales'}
        >
          {value || 'Sin notas adicionales'}
        </span>
      ),
    },
    {
      header: 'MONTO ESTIMADO',
      accessorKey: 'solMontoTotalEstimado',
      align: 'right' as const,
      className: 'whitespace-nowrap',
      cell: ({ value }: { value: number }) => (
        <span className="font-bold text-slate-900 whitespace-nowrap">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'CICLO DE VIDA (PIPELINE)',
      accessorKey: 'pipeline',
      align: 'left' as const,
      className: 'whitespace-nowrap',
      cell: ({ row }: { row: ISolicitudCompra }) => (
        <div className="w-fit" onClick={(e) => e.stopPropagation()}>
          <PipelineProgress
            solicitud={row}
            status={row.solNombreEstado || undefined}
            onSelectStage={(stageId, solicitud) => {
              setActiveStageView({ stage: stageId, solicitud });
            }}
          />
        </div>
      ),
    },
  ];

  // Si una etapa del pipeline fue seleccionada, mostrar la vista correspondiente a esa etapa
  if (activeStageView) {
    const { stage, solicitud } = activeStageView;
    const solInfo = getSolicitudInfoForMatriz(solicitud);
    const handleCloseStageView = () => {
      setActiveStageView(null);
      loadData();
    };

    switch (stage) {
      case 'aprobacion':
        return (
          <AprobacionView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onSuccess={handleCloseStageView}
          />
        );
      case 'matriz':
        return (
          <MatrizCotizacionesView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onSuccess={handleCloseStageView}
          />
        );
      case 'seleccion':
        return <SeleccionCotizacionView solicitud={solInfo} onBack={handleCloseStageView} />;
      case 'presupuesto':
        return <PresupuestoView solicitud={solInfo} onBack={handleCloseStageView} />;
      case 'bodega':
        return <BodegaView solicitud={solInfo} onBack={handleCloseStageView} />;
      case '3way':
        return <ThreeWayMatchView solicitud={solInfo} onBack={handleCloseStageView} />;
      default:
        return (
          <MatrizCotizacionesView
            solicitud={solInfo}
            onBack={handleCloseStageView}
            onSuccess={handleCloseStageView}
          />
        );
    }
  }

  // Renderizar la vista de creación de solicitudes si el tab activo es 'solicitudes' (compatibilidad)
  if (activeTab === 'solicitudes') {
    return (
      <SolicitudCreacionView 
        onReload={loadData}
        onSuccess={() => {
          loadData();
          if (onTabChange) {
            onTabChange('registros');
          }
        }}
      />
    );
  }

  // Renderizar la vista del catálogo de proveedores si el tab activo es 'proveedores'
  if (activeTab === 'proveedores') {
    return <ProveedoresCatalogView />;
  }

  // Renderizar la vista del catálogo de estados si el tab activo es 'estados'
  if (activeTab === 'estados') {
    return <EstadosCatalogView />;
  }

  return (
    <div className="space-y-6 w-full pb-12 min-w-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="text-blue-600" size={28} />
            Solicitudes de Compra
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión integral del ciclo de compras, trazabilidad de etapas y cotizaciones
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

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="secondary" size="sm" onClick={loadData}>Reintentar</Button>
        </div>
      )}

      {/* Dashboard View Banner if activeTab === 'dashboard' */}
      {activeTab === 'dashboard' && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider inline-block">
              Módulo de Compras ERP
            </span>
            <h2 className="text-xl font-bold">Panel de Solicitudes Aprobadas para Cotización</h2>
            <p className="text-sm text-slate-300">
              Seleccione cualquier solicitud de compra para ingresar las 3 cotizaciones de proveedores requeridas o registrar una excepción de proveedor único.
            </p>
          </div>
          {solicitudes.length > 0 && (
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => setActiveStageView({ stage: 'matriz', solicitud: solicitudes[0] })}
              className="bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap shadow-lg"
            >
              Ingresar Matriz Reciente
            </Button>
          )}
        </div>
      )}

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
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter size={15} className="text-slate-400" />
            <span>Filtrar por Estado:</span>
          </div>

          <select
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="APROBADA">APROBADA</option>
            <option value="RECHAZADA">RECHAZADA</option>
          </select>
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
        emptyText="No se encontraron solicitudes de compra en la base de datos."
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
          )}-${Math.min(currentPage * itemsPerPage, filteredSolicitudes.length)} de ${
            filteredSolicitudes.length
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
  );
};
