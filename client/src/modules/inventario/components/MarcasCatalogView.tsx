import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Award,
} from 'lucide-react';
import { Button, StatCard, DataTable } from '../../../components/ui';
import { IMarca, ICreateMarcaDTO, IUpdateMarcaDTO } from '@erp/contracts';
import { MarcaClientService } from '../services/marcaClientService';
import { MarcaModal } from './MarcaModal';

export const MarcasCatalogView: React.FC = () => {
  const [marcas, setMarcas] = useState<IMarca[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterActivo, setFilterActivo] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMarca, setEditingMarca] = useState<IMarca | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await MarcaClientService.getMarcas();
      setMarcas(data);
    } catch (err: any) {
      console.error('[MarcasCatalogView]: Error al cargar marcas:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingMarca(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (marca: IMarca) => {
    setEditingMarca(marca);
    setIsModalOpen(true);
  };

  const handleSaveMarca = async (
    data: ICreateMarcaDTO | IUpdateMarcaDTO,
    id?: number
  ) => {
    if (id) {
      await MarcaClientService.updateMarca(id, data);
      setSuccessMsg('Marca actualizada exitosamente.');
    } else {
      await MarcaClientService.createMarca(data as ICreateMarcaDTO);
      setSuccessMsg('Marca creada exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleActivo = async (marca: IMarca) => {
    const nuevoEstado = marca.marActivo === 1 ? 0 : 1;
    try {
      await MarcaClientService.updateMarca(marca.marIdMarca, {
        marActivo: nuevoEstado,
      });
      setSuccessMsg(
        `Marca "${marca.marNombreMarca}" ${nuevoEstado === 1 ? 'activada' : 'desactivada'} exitosamente.`
      );
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado de la marca.');
    }
  };

  const handleDeleteMarca = async (marca: IMarca) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar la marca "${marca.marNombreMarca}"? Si tiene artículos asociados pasará a estar inactiva.`
    );
    if (!confirmDelete) return;

    try {
      const res = await MarcaClientService.deleteMarca(marca.marIdMarca);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar la marca.');
    }
  };

  // Filtered dataset
  const filteredMarcas = useMemo(() => {
    return marcas.filter((m) => {
      const matchSearch =
        !searchQuery ||
        m.marNombreMarca.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(m.marIdMarca).includes(searchQuery);

      const matchEstado =
        filterActivo === 'TODOS' ||
        (filterActivo === 'ACTIVOS' && m.marActivo === 1) ||
        (filterActivo === 'INACTIVOS' && m.marActivo === 0);

      return matchSearch && matchEstado;
    });
  }, [marcas, searchQuery, filterActivo]);

  // Metrics
  const totalCount = marcas.length;
  const activosCount = marcas.filter((m) => m.marActivo === 1).length;
  const inactivosCount = totalCount - activosCount;

  const columns = [
    {
      header: 'ID',
      accessorKey: 'marIdMarca',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">#{value}</span>
      ),
    },
    {
      header: 'NOMBRE DE LA MARCA',
      accessorKey: 'marNombreMarca',
      cell: ({ value, row }: { value: string; row: IMarca }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm block">{value}</span>
            <span className="text-[11px] text-slate-400">Código interno: MAR-{String(row.marIdMarca).padStart(4, '0')}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'marActivo',
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
      cell: ({ row }: { row: IMarca }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar marca"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActivo(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.marActivo === 1
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.marActivo === 1 ? 'Desactivar marca' : 'Activar marca'}
          >
            <Power size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteMarca(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar marca"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Tag size={18} />
            </div>
            Catálogo de Marcas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y registro de marcas comerciales para artículos de inventario en Oracle DB
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nueva Marca
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="TOTAL MARCAS"
          value={totalCount}
          icon={Award}
          changeLabel="registradas en Oracle"
        />
        <StatCard
          title="MARCAS ACTIVAS"
          value={activosCount}
          icon={CheckCircle2}
          isPositive={true}
          changeLabel="disponibles para artículos"
        />
        <StatCard
          title="MARCAS INACTIVAS"
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
            placeholder="Buscar por nombre o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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

      {/* Brands DataTable */}
      <DataTable
        columns={columns}
        data={filteredMarcas}
        isLoading={isLoading}
        emptyText="No se encontraron marcas registradas con los filtros seleccionados."
      />

      {/* Creation / Edition Modal */}
      <MarcaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMarca}
        marca={editingMarca}
      />
    </div>
  );
};
