import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
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
import { IUbicacion, ICreateUbicacionDTO, IUpdateUbicacionDTO } from '@erp/contracts';
import { UbicacionClientService } from '../services/ubicacionClientService';
import { UbicacionModal } from './UbicacionModal';

export const UbicacionesCatalogView: React.FC = () => {
  const [ubicaciones, setUbicaciones] = useState<IUbicacion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterActivo, setFilterActivo] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUbicacion, setEditingUbicacion] = useState<IUbicacion | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await UbicacionClientService.getUbicaciones();
      setUbicaciones(data);
    } catch (err: any) {
      console.error('[UbicacionesCatalogView]: Error al cargar ubicaciones:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUbicacion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ubi: IUbicacion) => {
    setEditingUbicacion(ubi);
    setIsModalOpen(true);
  };

  const handleSaveUbicacion = async (
    data: ICreateUbicacionDTO | IUpdateUbicacionDTO,
    id?: number
  ) => {
    if (id) {
      await UbicacionClientService.updateUbicacion(id, data);
      setSuccessMsg('Ubicación actualizada exitosamente.');
    } else {
      await UbicacionClientService.createUbicacion(data as ICreateUbicacionDTO);
      setSuccessMsg('Ubicación registrada exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleActivo = async (ubi: IUbicacion) => {
    const nuevoEstado = ubi.ubiActivo === 1 ? 0 : 1;
    try {
      await UbicacionClientService.updateUbicacion(ubi.ubiIdUbicacion, {
        ubiActivo: nuevoEstado,
      });
      setSuccessMsg(
        `Ubicación "${ubi.ubiCodigoUbicacion}" ${nuevoEstado === 1 ? 'activada' : 'desactivada'} exitosamente.`
      );
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado de la ubicación.');
    }
  };

  const handleDeleteUbicacion = async (ubi: IUbicacion) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar la ubicación "${ubi.ubiCodigoUbicacion}"? Si tiene existencias asociadas pasará a estar inactiva.`
    );
    if (!confirmDelete) return;

    try {
      const res = await UbicacionClientService.deleteUbicacion(ubi.ubiIdUbicacion);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar la ubicación.');
    }
  };

  const filteredUbicaciones = useMemo(() => {
    return ubicaciones.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        u.ubiCodigoUbicacion.toLowerCase().includes(q) ||
        (u.bodNombre && u.bodNombre.toLowerCase().includes(q)) ||
        (u.ubiPasillo && u.ubiPasillo.toLowerCase().includes(q)) ||
        (u.ubiRack && u.ubiRack.toLowerCase().includes(q));

      const matchEstado =
        filterActivo === 'TODOS' ||
        (filterActivo === 'ACTIVOS' && u.ubiActivo === 1) ||
        (filterActivo === 'INACTIVOS' && u.ubiActivo === 0);

      return matchSearch && matchEstado;
    });
  }, [ubicaciones, searchQuery, filterActivo]);

  const totalCount = ubicaciones.length;
  const activosCount = ubicaciones.filter((u) => u.ubiActivo === 1).length;

  const columns = [
    {
      header: 'ID',
      accessorKey: 'ubiIdUbicacion',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #UBI-{String(value).padStart(3, '0')}
        </span>
      ),
    },
    {
      header: 'CÓDIGO UBICACIÓN',
      accessorKey: 'ubiCodigoUbicacion',
      cell: ({ value }: { value: string }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {value}
        </span>
      ),
    },
    {
      header: 'BODEGA',
      accessorKey: 'bodNombre',
      cell: ({ value, row }: { value?: string; row: IUbicacion }) => (
        <span className="font-semibold text-slate-800 text-xs">
          {value || `Bodega #${row.ubiIdBodega}`}
        </span>
      ),
    },
    {
      header: 'COORDENADAS (PASILLO / RACK / NIVEL)',
      accessorKey: 'ubiIdUbicacion',
      cell: ({ row }: { row: IUbicacion }) => (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">P: {row.ubiPasillo || '-'}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">R: {row.ubiRack || '-'}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">N: {row.ubiNivel || '-'}</span>
        </div>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'ubiActivo',
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
      cell: ({ row }: { row: IUbicacion }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar ubicación"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActivo(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.ubiActivo === 1
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.ubiActivo === 1 ? 'Desactivar ubicación' : 'Activar ubicación'}
          >
            <Power size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteUbicacion(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar ubicación"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full pb-12 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <MapPin size={18} />
            </div>
            Catálogo de Ubicaciones
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Control de pasillos, racks y niveles de almacenamiento por bodega en Oracle DB
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nueva Ubicación
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="TOTAL UBICACIONES" value={totalCount} icon={Layers} changeLabel="en almacén" />
        <StatCard title="UBICACIONES ACTIVAS" value={activosCount} icon={CheckCircle2} isPositive={true} changeLabel="disponibles para stock" />
        <StatCard title="INACTIVAS" value={totalCount - activosCount} icon={XCircle} isPositive={false} changeLabel="bloqueadas" />
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between animate-fadeIn">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold hover:underline ml-2">Descartar</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center justify-between animate-fadeIn">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 font-bold hover:underline ml-2">Descartar</button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, bodega o coordenadas..."
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
              className={`px-3 py-1 rounded-md transition-all ${filterActivo === 'TODOS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilterActivo('ACTIVOS')}
              className={`px-3 py-1 rounded-md transition-all ${filterActivo === 'ACTIVOS' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-emerald-700'}`}
            >
              Activos ({activosCount})
            </button>
            <button
              onClick={() => setFilterActivo('INACTIVOS')}
              className={`px-3 py-1 rounded-md transition-all ${filterActivo === 'INACTIVOS' ? 'bg-white text-slate-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Inactivos ({totalCount - activosCount})
            </button>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredUbicaciones} isLoading={isLoading} emptyText="No se encontraron ubicaciones registradas." />

      <UbicacionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveUbicacion} ubicacion={editingUbicacion} />
    </div>
  );
};
