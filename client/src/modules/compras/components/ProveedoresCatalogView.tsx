import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button, StatCard, DataTable } from '../../../components/ui';
import { IProveedor, ICreateProveedorDTO, IUpdateProveedorDTO } from '@erp/contracts';
import { ProveedorClientService } from '../services/proveedorClientService';
import { ProveedorModal } from './ProveedorModal';

export const ProveedoresCatalogView: React.FC = () => {
  const [proveedores, setProveedores] = useState<IProveedor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterActivo, setFilterActivo] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProveedor, setEditingProveedor] = useState<IProveedor | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await ProveedorClientService.getProveedores();
      setProveedores(data);
    } catch (err: any) {
      console.error('[ProveedoresCatalogView]: Error al cargar proveedores:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProveedor(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proveedor: IProveedor) => {
    setEditingProveedor(proveedor);
    setIsModalOpen(true);
  };

  const handleSaveProveedor = async (
    data: ICreateProveedorDTO | IUpdateProveedorDTO,
    id?: number
  ) => {
    if (id) {
      await ProveedorClientService.updateProveedor(id, data);
      setSuccessMsg('Proveedor actualizado exitosamente.');
    } else {
      await ProveedorClientService.createProveedor(data as ICreateProveedorDTO);
      setSuccessMsg('Proveedor registrado exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleActivo = async (proveedor: IProveedor) => {
    const nuevoEstado = proveedor.proActivo === 1 ? 0 : 1;
    try {
      await ProveedorClientService.updateProveedor(proveedor.proIdProveedor, {
        proActivo: nuevoEstado,
      });
      setSuccessMsg(
        `Proveedor "${proveedor.proNombreEntidad}" ${nuevoEstado === 1 ? 'activado' : 'desactivado'} exitosamente.`
      );
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado del proveedor.');
    }
  };

  const handleDeleteProveedor = async (proveedor: IProveedor) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar el proveedor "${proveedor.proNombreEntidad}"? Si posee cotizaciones o compras asociadas pasará a estar inactivo.`
    );
    if (!confirmDelete) return;

    try {
      const res = await ProveedorClientService.deleteProveedor(proveedor.proIdProveedor);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el proveedor.');
    }
  };

  // Filtered dataset
  const filteredProveedores = useMemo(() => {
    return proveedores.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.proNombreEntidad.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.proNit && p.proNit.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(p.proIdProveedor).includes(searchQuery);

      const matchEstado =
        filterActivo === 'TODOS' ||
        (filterActivo === 'ACTIVOS' && p.proActivo === 1) ||
        (filterActivo === 'INACTIVOS' && p.proActivo === 0);

      return matchSearch && matchEstado;
    });
  }, [proveedores, searchQuery, filterActivo]);

  // Metrics
  const totalCount = proveedores.length;
  const activosCount = proveedores.filter((p) => p.proActivo === 1).length;
  const inactivosCount = totalCount - activosCount;

  const columns = [
    {
      header: 'ID',
      accessorKey: 'proIdProveedor',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">#{value}</span>
      ),
    },
    {
      header: 'PROVEEDOR / RAZÓN SOCIAL',
      accessorKey: 'proNombreEntidad',
      cell: ({ value, row }: { value: string; row: IProveedor }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            {value ? value.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm block">{value}</span>
            <span className="text-[11px] text-slate-400">
              NIT: {row.proNit || 'Sin registrar'} • Código: PRO-{String(row.proIdProveedor).padStart(4, '0')}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'NIT',
      accessorKey: 'proNit',
      cell: ({ value }: { value: string | null }) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {value || 'C/F'}
        </span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'proActivo',
      cell: ({ value }: { value: number }) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
            value === 1
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {value === 1 ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'ACCIONES',
      align: 'right' as const,
      cell: ({ row }: { row: IProveedor }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar proveedor"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActivo(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.proActivo === 1
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.proActivo === 1 ? 'Desactivar proveedor' : 'Activar proveedor'}
          >
            <Power size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteProveedor(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar proveedor"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn min-w-0">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Building2 size={18} />
            </div>
            Catálogo de Proveedores
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y registro de empresas proveedoras para cotizaciones y compras en Oracle DB
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="TOTAL PROVEEDORES"
          value={totalCount}
          icon={Building2}
          changeLabel="registrados en Oracle"
        />
        <StatCard
          title="PROVEEDORES ACTIVOS"
          value={activosCount}
          icon={CheckCircle2}
          isPositive={true}
          changeLabel="disponibles para compra"
        />
        <StatCard
          title="PROVEEDORES INACTIVOS"
          value={inactivosCount}
          icon={XCircle}
          isPositive={false}
          changeLabel="desactivados temporalmente"
        />
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between animate-fadeIn">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold hover:underline ml-2">
            Descartar
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center justify-between animate-fadeIn">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 font-bold hover:underline ml-2">
            Descartar
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, razón social o NIT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Estado:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterActivo('TODOS')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterActivo === 'TODOS'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilterActivo('ACTIVOS')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterActivo === 'ACTIVOS'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Activos ({activosCount})
            </button>
            <button
              onClick={() => setFilterActivo('INACTIVOS')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterActivo === 'INACTIVOS'
                  ? 'bg-white text-slate-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactivos ({inactivosCount})
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers DataTable */}
      <DataTable
        columns={columns}
        data={filteredProveedores}
        isLoading={isLoading}
        emptyText="No se encontraron proveedores registrados con los filtros seleccionados."
      />

      {/* Modal */}
      <ProveedorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProveedor}
        proveedor={editingProveedor}
      />
    </div>
  );
};
