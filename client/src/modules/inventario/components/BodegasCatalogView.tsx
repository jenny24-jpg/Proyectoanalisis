import React, { useState, useEffect, useMemo } from 'react';
import {
  Warehouse,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Boxes,
  MapPin,
} from 'lucide-react';
import { Button, StatCard, DataTable } from '../../../components/ui';
import { IBodega, ICreateBodegaDTO, IUpdateBodegaDTO } from '@erp/contracts';
import { BodegaClientService } from '../services/bodegaClientService';
import { BodegaModal } from './BodegaModal';

export const BodegasCatalogView: React.FC = () => {
  const [bodegas, setBodegas] = useState<IBodega[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterActivo, setFilterActivo] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBodega, setEditingBodega] = useState<IBodega | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await BodegaClientService.getBodegas();
      setBodegas(data);
    } catch (err: any) {
      console.error('[BodegasCatalogView]: Error al cargar bodegas:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingBodega(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bodega: IBodega) => {
    setEditingBodega(bodega);
    setIsModalOpen(true);
  };

  const handleSaveBodega = async (
    data: ICreateBodegaDTO | IUpdateBodegaDTO,
    id?: number
  ) => {
    if (id) {
      await BodegaClientService.updateBodega(id, data);
      setSuccessMsg('Bodega actualizada exitosamente.');
    } else {
      await BodegaClientService.createBodega(data as ICreateBodegaDTO);
      setSuccessMsg('Bodega registrada exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleActivo = async (bodega: IBodega) => {
    const nuevoEstado = bodega.bodActivo === 1 ? 0 : 1;
    try {
      await BodegaClientService.updateBodega(bodega.bodIdBodega, {
        bodActivo: nuevoEstado,
      });
      setSuccessMsg(
        `Bodega "${bodega.bodNombre}" ${nuevoEstado === 1 ? 'activada' : 'desactivada'} exitosamente.`
      );
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado de la bodega.');
    }
  };

  const handleDeleteBodega = async (bodega: IBodega) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar la bodega "${bodega.bodNombre}" (${bodega.bodCodigo})? Si posee inventario, ubicaciones o recepciones vinculadas, pasará a estar inactiva.`
    );
    if (!confirmDelete) return;

    try {
      const res = await BodegaClientService.deleteBodega(bodega.bodIdBodega);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar la bodega.');
    }
  };

  // Filtered dataset
  const filteredBodegas = useMemo(() => {
    return bodegas.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        b.bodNombre.toLowerCase().includes(q) ||
        b.bodCodigo.toLowerCase().includes(q) ||
        (b.bodDireccion && b.bodDireccion.toLowerCase().includes(q)) ||
        String(b.bodIdBodega).includes(q);

      const matchEstado =
        filterActivo === 'TODOS' ||
        (filterActivo === 'ACTIVOS' && b.bodActivo === 1) ||
        (filterActivo === 'INACTIVOS' && b.bodActivo === 0);

      return matchSearch && matchEstado;
    });
  }, [bodegas, searchQuery, filterActivo]);

  // Metrics
  const totalCount = bodegas.length;
  const activosCount = bodegas.filter((b) => b.bodActivo === 1).length;
  const ventasCount = bodegas.filter((b) => b.bodPermiteVentas === 1).length;

  const columns = [
    {
      header: 'ID',
      accessorKey: 'bodIdBodega',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #BOD-{String(value).padStart(3, '0')}
        </span>
      ),
    },
    {
      header: 'CÓDIGO',
      accessorKey: 'bodCodigo',
      cell: ({ value }: { value: string }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {value}
        </span>
      ),
    },
    {
      header: 'NOMBRE Y UBICACIÓN',
      accessorKey: 'bodNombre',
      cell: ({ value, row }: { value: string; row: IBodega }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm block">{value}</span>
            {row.bodDireccion ? (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin size={11} className="text-slate-400 shrink-0" />
                {row.bodDireccion}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Sin dirección especificada</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'TIPO DE OPERACIÓN',
      accessorKey: 'bodPermiteVentas',
      cell: ({ value }: { value: number }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
            value === 1
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {value === 1 ? 'Ventas y Despachos' : 'Solo Almacenamiento'}
        </span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'bodActivo',
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
      cell: ({ row }: { row: IBodega }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar bodega"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActivo(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.bodActivo === 1
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.bodActivo === 1 ? 'Desactivar bodega' : 'Activar bodega'}
          >
            <Power size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteBodega(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar bodega"
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
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Warehouse size={18} />
            </div>
            Catálogo de Bodegas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y control de almacenes, centros de distribución y puntos de despacho en Oracle DB
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nueva Bodega
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="TOTAL BODEGAS"
          value={totalCount}
          icon={Warehouse}
          changeLabel="registradas en Oracle"
        />
        <StatCard
          title="BODEGAS ACTIVAS"
          value={activosCount}
          icon={CheckCircle2}
          isPositive={true}
          changeLabel="disponibles para inventario"
        />
        <StatCard
          title="CON VENTAS HABILITADAS"
          value={ventasCount}
          icon={Boxes}
          isPositive={true}
          changeLabel="autorizadas para despacho"
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
            placeholder="Buscar por código, nombre o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
              Inactivos ({totalCount - activosCount})
            </button>
          </div>
        </div>
      </div>

      {/* Bodegas DataTable */}
      <DataTable
        columns={columns}
        data={filteredBodegas}
        isLoading={isLoading}
        emptyText="No se encontraron bodegas registradas con los filtros seleccionados."
      />

      {/* Creation / Edition Modal */}
      <BodegaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBodega}
        bodega={editingBodega}
      />
    </div>
  );
};
