import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Layers,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button, StatCard, DataTable, Pagination, StatusBadge } from '../../components/ui';
import { SolicitudCompraClientService } from './services/solicitudCompraClientService';
import { MatrizCotizacionesView } from './components/MatrizCotizacionesView';
import { SolicitudOriginalInfo } from './components/SolicitudOriginalCard';
import { ISolicitudCompra } from '@erp/contracts';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface ComprasViewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const ComprasView: React.FC<ComprasViewProps> = ({
  activeTab = 'dashboard',
}) => {
  // Solicitudes list from Oracle Database
  const [solicitudes, setSolicitudes] = useState<ISolicitudCompra[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Solicitud for full-screen Matriz view
  const [selectedSolicitudForMatriz, setSelectedSolicitudForMatriz] = useState<ISolicitudCompra | null>(null);

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
  }, []);


  // Filtered dataset
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter((item) => {
      const queryLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.solNoDocumento.toLowerCase().includes(queryLower) ||
        (item.solNotas && item.solNotas.toLowerCase().includes(queryLower));

      const estadoName = (item.solNombreEstado || 'APROBADO').toUpperCase();
      const matchEstado =
        filterEstado === 'TODOS' || estadoName === filterEstado.toUpperCase();

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
    (s) => (s.solNombreEstado || 'APROBADO').toUpperCase() === 'APROBADO'
  ).length;
  const totalMontoEstimado = solicitudes.reduce((acc, curr) => acc + (curr.solMontoTotalEstimado || 0), 0);

  const handleOpenMatriz = (solicitud: ISolicitudCompra) => {
    setSelectedSolicitudForMatriz(solicitud);
  };

  const handleCloseMatriz = () => {
    setSelectedSolicitudForMatriz(null);
    loadData();
  };

  // Convert ISolicitudCompra to SolicitudOriginalInfo for MatrizCotizacionesView header
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
      cell: ({ value }: { value: string }) => (
        <span className="font-bold text-blue-600 hover:underline">{value}</span>
      ),
    },
    {
      header: 'FECHA',
      accessorKey: 'solFecha',
      cell: ({ value }: { value: string | Date }) => (
        <span className="text-slate-600 font-medium">{formatDate(value, '2026-03-01')}</span>
      ),
    },

    {
      header: 'DEPARTAMENTO',
      accessorKey: 'solNombreDepartamento',
      cell: ({ value, row }: { value: string; row: ISolicitudCompra }) => (
        <span className="text-slate-700 font-medium">
          {value || `Departamento #${row.solIdDepartamento}`}
        </span>
      ),
    },
    {
      header: 'RESPONSABLE',
      accessorKey: 'solNombreResponsable',
      cell: ({ value, row }: { value: string; row: ISolicitudCompra }) => (
        <span className="text-slate-700 font-medium">
          {value || `Empleado #${row.solIdUsuarioResponsable}`}
        </span>
      ),
    },

    {
      header: 'DESCRIPCIÓN / NOTAS',
      accessorKey: 'solNotas',
      cell: ({ value }: { value: string | null }) => (
        <span className="text-slate-700 max-w-xs block truncate" title={value || ''}>
          {value || 'Sin notas adicionales'}
        </span>
      ),
    },
    {
      header: 'MONTO ESTIMADO',
      accessorKey: 'solMontoTotalEstimado',
      align: 'right' as const,
      cell: ({ value }: { value: number }) => (
        <span className="font-bold text-slate-900">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'solNombreEstado',
      cell: ({ value }: { value: string }) => <StatusBadge status={value || 'APROBADO'} />,
    },
    {
      header: 'ACCIONES',
      align: 'right' as const,
      cell: ({ row }: { row: ISolicitudCompra }) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => handleOpenMatriz(row)}
            className="text-xs px-3 py-1.5 shadow-sm"
          >
            Matriz
          </Button>
        </div>
      ),
    },
  ];

  // If a solicitud is selected for Matriz, display full-screen Matriz view (no modal)
  if (selectedSolicitudForMatriz) {
    return (
      <MatrizCotizacionesView
        solicitud={getSolicitudInfoForMatriz(selectedSolicitudForMatriz)}
        onBack={handleCloseMatriz}
        onSuccess={handleCloseMatriz}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="text-blue-600" size={28} />
            Solicitudes de Compra
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión dinámica de solicitudes aprobadas y generación de matriz de cotizaciones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData}>
            Actualizar
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
          title="Pendientes Matriz"
          value={totalCount}
          icon={Clock}
          changeLabel="En Solicitud"
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
              onClick={() => handleOpenMatriz(solicitudes[0])}
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
            <option value="APROBADO">APROBADO</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN REVISIÓN">EN REVISIÓN</option>
          </select>
        </div>
      </div>

      {/* Main DataTable list from Oracle Database */}
      <DataTable
        columns={tableColumns}
        data={paginatedSolicitudes}
        isLoading={isLoading}
        onRowClick={handleOpenMatriz}
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
    </div>
  );
};
