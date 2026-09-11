import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';
import { Button, StatCard, DataTable } from '../../../components/ui';
import { IUnidadMedida, ICreateUnidadMedidaDTO, IUpdateUnidadMedidaDTO } from '@erp/contracts';
import { UnidadMedidaClientService } from '../services/unidadMedidaClientService';
import { UnidadMedidaModal } from './UnidadMedidaModal';

export const UnidadesMedidaCatalogView: React.FC = () => {
  const [unidades, setUnidades] = useState<IUnidadMedida[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterActivo, setFilterActivo] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUnidad, setEditingUnidad] = useState<IUnidadMedida | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await UnidadMedidaClientService.getUnidadesMedida();
      setUnidades(data);
    } catch (err: any) {
      console.error('[UnidadesMedidaCatalogView]: Error al cargar unidades de medida:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUnidad(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unidad: IUnidadMedida) => {
    setEditingUnidad(unidad);
    setIsModalOpen(true);
  };

  const handleSaveUnidad = async (
    data: ICreateUnidadMedidaDTO | IUpdateUnidadMedidaDTO,
    id?: number
  ) => {
    if (id) {
      await UnidadMedidaClientService.updateUnidadMedida(id, data);
      setSuccessMsg('Unidad de medida actualizada exitosamente.');
    } else {
      await UnidadMedidaClientService.createUnidadMedida(data as ICreateUnidadMedidaDTO);
      setSuccessMsg('Unidad de medida creada exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleActivo = async (unidad: IUnidadMedida) => {
    const nuevoEstado = unidad.umeActivo === 1 ? 0 : 1;
    try {
      await UnidadMedidaClientService.updateUnidadMedida(unidad.umeIdUnidad, {
        umeActivo: nuevoEstado,
      });
      setSuccessMsg(
        `Unidad de medida "${unidad.umeNombreUnidad}" ${nuevoEstado === 1 ? 'activada' : 'desactivada'} exitosamente.`
      );
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado de la unidad de medida.');
    }
  };

  const handleDeleteUnidad = async (unidad: IUnidadMedida) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar la unidad de medida "${unidad.umeNombreUnidad}"? Si tiene artículos asociados pasará a estar inactiva.`
    );
    if (!confirmDelete) return;

    try {
      const res = await UnidadMedidaClientService.deleteUnidadMedida(unidad.umeIdUnidad);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar la unidad de medida.');
    }
  };

  // Filtered dataset
  const filteredUnidades = useMemo(() => {
    return unidades.filter((u) => {
      const matchSearch =
        !searchQuery ||
        u.umeNombreUnidad.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.umeAbreviatura.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(u.umeIdUnidad).includes(searchQuery);

      const matchEstado =
        filterActivo === 'TODOS' ||
        (filterActivo === 'ACTIVOS' && u.umeActivo === 1) ||
        (filterActivo === 'INACTIVOS' && u.umeActivo === 0);

      return matchSearch && matchEstado;
    });
  }, [unidades, searchQuery, filterActivo]);

  // Metrics
  const totalCount = unidades.length;
  const activosCount = unidades.filter((u) => u.umeActivo === 1).length;
  const inactivosCount = totalCount - activosCount;

  const columns = [
    {
      header: 'ID',
      accessorKey: 'umeIdUnidad',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #UME-{String(value).padStart(3, '0')}
        </span>
      ),
    },
    {
      header: 'NOMBRE DE LA UNIDAD',
      accessorKey: 'umeNombreUnidad',
      cell: ({ value, row }: { value: string; row: IUnidadMedida }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm block">{value}</span>
            <span className="text-[11px] text-slate-400">
              Código interno: UME-{String(row.umeIdUnidad).padStart(4, '0')}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'ABREVIATURA / SÍMBOLO',
      accessorKey: 'umeAbreviatura',
      cell: ({ value }: { value: string }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
          {value}
        </span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'umeActivo',
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
      cell: ({ row }: { row: IUnidadMedida }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar unidad"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActivo(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.umeActivo === 1
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.umeActivo === 1 ? 'Desactivar unidad' : 'Activar unidad'}
          >
            <Power size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteUnidad(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar unidad"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full pb-12 min-w-0">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Scale size={18} />
            </div>
            Catálogo de Unidades de Medida
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y estandarización de unidades de medida para compras e inventario en Oracle DB
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nueva Unidad
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="TOTAL UNIDADES"
          value={totalCount}
          icon={Layers}
          changeLabel="registradas en Oracle"
        />
        <StatCard
          title="UNIDADES ACTIVAS"
          value={activosCount}
          icon={CheckCircle2}
          isPositive={true}
          changeLabel="disponibles para artículos"
        />
        <StatCard
          title="UNIDADES INACTIVAS"
          value={inactivosCount}
          icon={XCircle}
          isPositive={false}
          changeLabel="desactivadas en el sistema"
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
            placeholder="Buscar por nombre, abreviatura o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
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

      {/* Units DataTable */}
      <DataTable
        columns={columns}
        data={filteredUnidades}
        isLoading={isLoading}
        emptyText="No se encontraron unidades de medida registradas con los filtros seleccionados."
      />

      {/* Creation / Edition Modal */}
      <UnidadMedidaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUnidad}
        unidadMedida={editingUnidad}
      />
    </div>
  );
};
