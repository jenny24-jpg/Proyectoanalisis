import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
} from 'lucide-react';
import { Button, StatCard, DataTable } from '../../../components/ui';
import { ITipoMovimiento, ICreateTipoMovimientoDTO, IUpdateTipoMovimientoDTO } from '@erp/contracts';
import { TipoMovimientoClientService } from '../services/tipoMovimientoClientService';
import { TipoMovimientoModal } from './TipoMovimientoModal';

export const TiposMovimientoCatalogView: React.FC = () => {
  const [tipos, setTipos] = useState<ITipoMovimiento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterNaturaleza, setFilterNaturaleza] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTipo, setEditingTipo] = useState<ITipoMovimiento | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await TipoMovimientoClientService.getTiposMovimiento();
      setTipos(data);
    } catch (err: any) {
      console.error('[TiposMovimientoCatalogView]: Error al cargar tipos de movimiento:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTipo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tipo: ITipoMovimiento) => {
    setEditingTipo(tipo);
    setIsModalOpen(true);
  };

  const handleSaveTipo = async (
    data: ICreateTipoMovimientoDTO | IUpdateTipoMovimientoDTO,
    id?: number
  ) => {
    if (id) {
      await TipoMovimientoClientService.updateTipoMovimiento(id, data);
      setSuccessMsg('Tipo de movimiento actualizado exitosamente.');
    } else {
      await TipoMovimientoClientService.createTipoMovimiento(data as ICreateTipoMovimientoDTO);
      setSuccessMsg('Tipo de movimiento registrado exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleActivo = async (tipo: ITipoMovimiento) => {
    const nuevoEstado = tipo.tmiActivo === 1 ? 0 : 1;
    try {
      await TipoMovimientoClientService.updateTipoMovimiento(tipo.tmiIdTipoMovimiento, {
        tmiActivo: nuevoEstado,
      });
      setSuccessMsg(
        `Tipo "${tipo.tmiCodigo}" ${nuevoEstado === 1 ? 'activado' : 'desactivado'} exitosamente.`
      );
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado del tipo de movimiento.');
    }
  };

  const handleDeleteTipo = async (tipo: ITipoMovimiento) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de eliminar el tipo "${tipo.tmiCodigo}"? Si posee transacciones pasará a estar inactivo.`
    );
    if (!confirmDelete) return;

    try {
      const res = await TipoMovimientoClientService.deleteTipoMovimiento(tipo.tmiIdTipoMovimiento);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el tipo de movimiento.');
    }
  };

  const filteredTipos = useMemo(() => {
    return tipos.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.tmiCodigo.toLowerCase().includes(q) ||
        t.tmiDescripcion.toLowerCase().includes(q);

      const matchNat =
        filterNaturaleza === 'TODOS' ||
        (filterNaturaleza === 'ENTRADA' && t.tmiNaturaleza === '+') ||
        (filterNaturaleza === 'SALIDA' && t.tmiNaturaleza === '-');

      return matchSearch && matchNat;
    });
  }, [tipos, searchQuery, filterNaturaleza]);

  const totalCount = tipos.length;
  const entradasCount = tipos.filter((t) => t.tmiNaturaleza === '+').length;
  const salidasCount = tipos.filter((t) => t.tmiNaturaleza === '-').length;

  const columns = [
    {
      header: 'ID',
      accessorKey: 'tmiIdTipoMovimiento',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #TMI-{String(value).padStart(2, '0')}
        </span>
      ),
    },
    {
      header: 'CÓDIGO',
      accessorKey: 'tmiCodigo',
      cell: ({ value }: { value: string }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {value}
        </span>
      ),
    },
    {
      header: 'DESCRIPCIÓN OPERATIVA',
      accessorKey: 'tmiDescripcion',
      cell: ({ value }: { value: string }) => (
        <span className="font-medium text-slate-800 text-xs">{value}</span>
      ),
    },
    {
      header: 'NATURALEZA',
      accessorKey: 'tmiNaturaleza',
      cell: ({ value }: { value: string }) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
            value === '+'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {value === '+' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
          {value === '+' ? 'Entrada (+)' : 'Salida (-)'}
        </span>
      ),
    },
    {
      header: 'AFECTA COSTO',
      accessorKey: 'tmiAfectaCosto',
      cell: ({ value }: { value: number }) => (
        <span className="text-xs text-slate-600 font-medium">
          {value === 1 ? 'Sí (Recalcula)' : 'No'}
        </span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'tmiActivo',
      cell: ({ value }: { value: number }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
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
      cell: ({ row }: { row: ITipoMovimiento }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar tipo"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleActivo(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.tmiActivo === 1
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.tmiActivo === 1 ? 'Desactivar tipo' : 'Activar tipo'}
          >
            <Power size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteTipo(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar tipo"
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
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <ArrowLeftRight size={18} />
            </div>
            Tipos de Movimiento de Inventario
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configuración de reglas de entrada y salida, naturaleza y afectación de costos en Oracle DB
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nuevo Tipo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="TOTAL TIPOS" value={totalCount} icon={Layers} changeLabel="configurados" />
        <StatCard title="ENTRADAS (+)" value={entradasCount} icon={ArrowDownLeft} isPositive={true} changeLabel="suman existencia" />
        <StatCard title="SALIDAS (-)" value={salidasCount} icon={ArrowUpRight} isPositive={false} changeLabel="restan existencia" />
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
            placeholder="Buscar por código o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Naturaleza:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterNaturaleza('TODOS')}
              className={`px-3 py-1 rounded-md transition-all ${filterNaturaleza === 'TODOS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilterNaturaleza('ENTRADA')}
              className={`px-3 py-1 rounded-md transition-all ${filterNaturaleza === 'ENTRADA' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-emerald-700'}`}
            >
              Entradas ({entradasCount})
            </button>
            <button
              onClick={() => setFilterNaturaleza('SALIDA')}
              className={`px-3 py-1 rounded-md transition-all ${filterNaturaleza === 'SALIDA' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Salidas ({salidasCount})
            </button>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredTipos} isLoading={isLoading} emptyText="No se encontraron tipos de movimiento registrados." />

      <TipoMovimientoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTipo} tipoMovimiento={editingTipo} />
    </div>
  );
};
