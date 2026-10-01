import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  XCircle,
} from 'lucide-react';
import { Button, StatCard, DataTable, ConfirmDialog } from '../../../components/ui';
import type { IArticulo, ICrearArticuloDTO, IActualizarArticuloDTO } from '@erp/contracts';
import { articuloService } from '../services/articulo.service';
import { ArticuloModal } from './ArticuloModal';

export const ArticulosCatalogView: React.FC = () => {
  const [articulos, setArticulos] = useState<IArticulo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingArticulo, setEditingArticulo] = useState<IArticulo | null>(null);
  const [articuloToDelete, setArticuloToDelete] = useState<IArticulo | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [articuloToToggle, setArticuloToToggle] = useState<{
    articulo: IArticulo;
    nuevoEstado: number;
    accion: string;
  } | null>(null);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await articuloService.obtenerTodos();
      setArticulos(data || []);
    } catch (err: any) {
      console.error('[ArticulosCatalogView]: Error al cargar artículos:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingArticulo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art: IArticulo) => {
    setEditingArticulo(art);
    setIsModalOpen(true);
  };

  const handleSaveArticulo = async (
    data: ICrearArticuloDTO | IActualizarArticuloDTO,
    codigo?: string
  ) => {
    if (codigo) {
      await articuloService.actualizarDescripcion(codigo, data as IActualizarArticuloDTO);
      setSuccessMsg(`Artículo "${codigo}" actualizado exitosamente.`);
    } else {
      await articuloService.crear(data as ICrearArticuloDTO);
      setSuccessMsg('Artículo creado exitosamente.');
    }
    await loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleToggleActivo = (art: IArticulo) => {
    const isActivo = art.ART_ACTIVO === 1;
    const nuevoEstado = isActivo ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    setArticuloToToggle({ articulo: art, nuevoEstado, accion });
  };

  const handleConfirmToggle = async () => {
    if (!articuloToToggle) return;
    setIsToggling(true);
    try {
      await articuloService.cambiarEstado(articuloToToggle.articulo.ART_CODIGO_ARTICULO, articuloToToggle.nuevoEstado);
      setSuccessMsg(
        `Artículo "${articuloToToggle.articulo.ART_CODIGO_ARTICULO}" ${articuloToToggle.nuevoEstado === 1 ? 'activado' : 'desactivado'} exitosamente.`
      );
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
      setArticuloToToggle(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado del artículo.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteArticulo = (art: IArticulo) => {
    setArticuloToDelete(art);
  };

  const handleConfirmDelete = async () => {
    if (!articuloToDelete) return;
    setIsDeleting(true);
    try {
      await articuloService.eliminar(articuloToDelete.ART_CODIGO_ARTICULO);
      setSuccessMsg(`Artículo "${articuloToDelete.ART_CODIGO_ARTICULO}" eliminado permanentemente de la base de datos.`);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
      setArticuloToDelete(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar permanentemente el artículo.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered dataset
  const filteredArticulos = useMemo(() => {
    return articulos.filter((a) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        a.ART_CODIGO_ARTICULO.toLowerCase().includes(query) ||
        a.ART_DESCRIPCION.toLowerCase().includes(query);

      const stock = a.STOCK_TOTAL || 0;
      const isActivo = a.ART_ACTIVO === 1;

      let matchFilter = true;
      if (filterEstado === 'ACTIVOS') {
        matchFilter = isActivo;
      } else if (filterEstado === 'INACTIVOS') {
        matchFilter = !isActivo;
      } else if (filterEstado === 'CON_STOCK') {
        matchFilter = stock > 0;
      } else if (filterEstado === 'SIN_STOCK') {
        matchFilter = stock <= 0;
      } else if (filterEstado === 'CON_LOTE') {
        matchFilter = a.ART_MANEJA_LOTE === 1;
      }

      return matchSearch && matchFilter;
    });
  }, [articulos, searchQuery, filterEstado]);

  // Metrics
  const totalCount = articulos.length;
  const activosCount = articulos.filter((a) => a.ART_ACTIVO === 1).length;
  const inactivosCount = totalCount - activosCount;
  const conStockCount = articulos.filter((a) => (a.STOCK_TOTAL || 0) > 0).length;
  const conLoteCount = articulos.filter((a) => a.ART_MANEJA_LOTE === 1).length;

  const columns = [
    {
      header: 'CÓDIGO',
      accessorKey: 'ART_CODIGO_ARTICULO',
      cell: ({ value }: { value: string }) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
          {value}
        </span>
      ),
    },
    {
      header: 'DESCRIPCIÓN DEL ARTÍCULO',
      accessorKey: 'ART_DESCRIPCION',
      cell: ({ value, row }: { value: string; row: IArticulo }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Package size={16} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 text-sm block truncate max-w-md" title={value}>
              {value}
            </span>
            <span className="text-[11px] text-slate-400">
              Cat: #{row.ART_ID_CATEGORIA || 1} • Marca: #{row.ART_ID_MARCA || 1}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'EXISTENCIAS / STOCK',
      accessorKey: 'STOCK_TOTAL',
      align: 'center' as const,
      cell: ({ value }: { value?: number }) => {
        const stock = value || 0;
        const hasStock = stock > 0;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
              hasStock
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {hasStock ? `${stock} Unds.` : '0 Unds. (Agotado)'}
          </span>
        );
      },
    },
    {
      header: 'CONTROL LOTE',
      accessorKey: 'ART_MANEJA_LOTE',
      align: 'center' as const,
      cell: ({ value }: { value: number }) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            value === 1
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {value === 1 ? 'Lote Activo' : 'Estándar'}
        </span>
      ),
    },
    {
      header: 'ESTADO',
      accessorKey: 'ART_ACTIVO',
      align: 'center' as const,
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
      cell: ({ row }: { row: IArticulo }) => {
        const isActivo = row.ART_ACTIVO === 1;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Editar descripción"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleActivo(row)}
              className={`p-1.5 rounded-lg transition-colors ${
                isActivo
                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              title={isActivo ? 'Desactivar artículo' : 'Activar artículo'}
            >
              <Power size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteArticulo(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Eliminar permanentemente (Hard Delete)"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Package size={18} />
            </div>
            Catálogo de Artículos y Productos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión centralizada de artículos, existencias globales y trazabilidad
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={isLoading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Nuevo Artículo
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL ARTÍCULOS"
          value={totalCount}
          icon={Package}
          changeLabel="registrados en el sistema"
        />
        <StatCard
          title="ARTÍCULOS ACTIVOS"
          value={activosCount}
          icon={CheckCircle2}
          isPositive={true}
          changeLabel="disponibles para operaciones"
        />
        <StatCard
          title="CON EXISTENCIAS"
          value={conStockCount}
          icon={Boxes}
          isPositive={true}
          changeLabel="con inventario disponible"
        />
        <StatCard
          title="INACTIVOS"
          value={inactivosCount}
          icon={XCircle}
          isPositive={false}
          changeLabel="bloqueados o desactivados"
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
            placeholder="Buscar por código o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filtro:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium shrink-0">
            <button
              onClick={() => setFilterEstado('TODOS')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterEstado === 'TODOS'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilterEstado('ACTIVOS')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterEstado === 'ACTIVOS'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Activos ({activosCount})
            </button>
            <button
              onClick={() => setFilterEstado('INACTIVOS')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterEstado === 'INACTIVOS'
                  ? 'bg-white text-slate-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactivos ({inactivosCount})
            </button>
            <button
              onClick={() => setFilterEstado('CON_STOCK')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterEstado === 'CON_STOCK'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Con Stock ({conStockCount})
            </button>
            <button
              onClick={() => setFilterEstado('CON_LOTE')}
              className={`px-3 py-1 rounded-md transition-all ${
                filterEstado === 'CON_LOTE'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              Con Lote ({conLoteCount})
            </button>
          </div>
        </div>
      </div>

      {/* Articles DataTable */}
      <DataTable
        columns={columns}
        data={filteredArticulos}
        isLoading={isLoading}
        emptyText="No se encontraron artículos con los criterios seleccionados."
      />

      {/* Creation / Edition Modal */}
      <ArticuloModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveArticulo}
        articulo={editingArticulo}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(articuloToDelete)}
        onClose={() => setArticuloToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar permanentemente este artículo?"
        itemName={articuloToDelete ? `${articuloToDelete.ART_CODIGO_ARTICULO} - ${articuloToDelete.ART_DESCRIPCION}` : ''}
        description="Esta acción ejecutará un borrado físico y permanente (Hard Delete) del artículo en la base de datos Oracle. Esta operación no se puede deshacer. Si el artículo posee compras, órdenes, existencias, movimientos o lotes asociados, la eliminación será rechazada por integridad referencial."
        confirmText="Eliminar Permanentemente"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* State Toggle Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(articuloToToggle)}
        onClose={() => setArticuloToToggle(null)}
        onConfirm={handleConfirmToggle}
        title={articuloToToggle?.nuevoEstado === 1 ? '¿Deseas activar este artículo?' : '¿Deseas desactivar este artículo?'}
        itemName={articuloToToggle ? `${articuloToToggle.articulo.ART_CODIGO_ARTICULO} - ${articuloToToggle.articulo.ART_DESCRIPCION}` : ''}
        description={
          articuloToToggle?.nuevoEstado === 0
            ? 'No podrá ser utilizado en nuevas solicitudes de compra ni traslados de inventario.'
            : 'Volverá a estar disponible en el catálogo activo para compras, despachos y movimientos.'
        }
        confirmText={articuloToToggle?.nuevoEstado === 1 ? 'Activar Artículo' : 'Desactivar Artículo'}
        variant={articuloToToggle?.nuevoEstado === 1 ? 'primary' : 'warning'}
        isLoading={isToggling}
      />
    </div>
  );
};
