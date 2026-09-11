import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Button, StatCard, DataTable } from '../../../components/ui';
import { ILote, ICreateLoteDTO, IUpdateLoteDTO, EstadoLoteType } from '@erp/contracts';
import { LoteClientService } from '../services/loteClientService';
import { LoteModal } from './LoteModal';

export const LotesCatalogView: React.FC = () => {
  const [lotes, setLotes] = useState<ILote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLote, setEditingLote] = useState<ILote | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await LoteClientService.getLotes();
      setLotes(data);
    } catch (err: any) {
      console.error('[LotesCatalogView]: Error al cargar lotes:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingLote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lote: ILote) => {
    setEditingLote(lote);
    setIsModalOpen(true);
  };

  const handleSaveLote = async (
    data: ICreateLoteDTO | IUpdateLoteDTO,
    id?: number
  ) => {
    if (id) {
      await LoteClientService.updateLote(id, data);
      setSuccessMsg('Lote actualizado exitosamente.');
    } else {
      await LoteClientService.createLote(data as ICreateLoteDTO);
      setSuccessMsg('Lote registrado exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteLote = async (lote: ILote) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar el lote "${lote.lotNumeroLote}"? Si posee movimientos asociados pasará a estado BLOQUEADO.`
    );
    if (!confirmDelete) return;

    try {
      const res = await LoteClientService.deleteLote(lote.lotIdLote);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el lote.');
    }
  };

  const filteredLotes = useMemo(() => {
    return lotes.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        l.lotNumeroLote.toLowerCase().includes(q) ||
        l.lotCodigoArticulo.toLowerCase().includes(q) ||
        (l.artDescripcion && l.artDescripcion.toLowerCase().includes(q));

      const matchEstado =
        filterEstado === 'TODOS' || l.lotEstado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [lotes, searchQuery, filterEstado]);

  const totalCount = lotes.length;
  const activosCount = lotes.filter((l) => l.lotEstado === 'ACTIVO').length;
  const vencidosCount = lotes.filter((l) => l.lotEstado === 'VENCIDO' || l.lotEstado === 'BLOQUEADO').length;

  const getStatusBadge = (estado: EstadoLoteType) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VENCIDO':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'BLOQUEADO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AGOTADO':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const columns = [
    {
      header: 'ID',
      accessorKey: 'lotIdLote',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #LOT-{String(value).padStart(3, '0')}
        </span>
      ),
    },
    {
      header: 'NÚMERO DE LOTE',
      accessorKey: 'lotNumeroLote',
      cell: ({ value }: { value: string }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          {value}
        </span>
      ),
    },
    {
      header: 'ARTÍCULO ASOCIADO',
      accessorKey: 'lotCodigoArticulo',
      cell: ({ value, row }: { value: string; row: ILote }) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{value}</span>
          <span className="text-[11px] text-slate-500 truncate block max-w-xs">
            {row.artDescripcion || 'Artículo de Inventario'}
          </span>
        </div>
      ),
    },
    {
      header: 'VENCIMIENTO',
      accessorKey: 'lotFechaVencimiento',
      cell: ({ value }: { value: any }) => (
        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
          <Calendar size={12} className="text-slate-400" />
          {value ? String(value).slice(0, 10) : 'Sin vencimiento'}
        </span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'lotEstado',
      cell: ({ value }: { value: EstadoLoteType }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(value)}`}>
          {value}
        </span>
      ),
    },
    {
      header: 'ACCIONES',
      align: 'right' as const,
      cell: ({ row }: { row: ILote }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar lote"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteLote(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar lote"
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
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <Layers size={18} />
            </div>
            Catálogo de Lotes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de lotes de producción, trazabilidad y control de caducidad en Oracle DB
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nuevo Lote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="TOTAL LOTES" value={totalCount} icon={Layers} changeLabel="registrados" />
        <StatCard title="LOTES ACTIVOS" value={activosCount} icon={CheckCircle2} isPositive={true} changeLabel="aptos para consumo" />
        <StatCard title="VENCIDOS / BLOQUEADOS" value={vencidosCount} icon={AlertTriangle} isPositive={false} changeLabel="restringidos" />
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
            placeholder="Buscar por lote o artículo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Estado:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            {['TODOS', 'ACTIVO', 'VENCIDO', 'BLOQUEADO', 'AGOTADO'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterEstado(st)}
                className={`px-2.5 py-1 rounded-md transition-all ${filterEstado === st ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredLotes} isLoading={isLoading} emptyText="No se encontraron lotes registrados." />

      <LoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveLote} lote={editingLote} />
    </div>
  );
};
