import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  IdCard,
  Calendar,
  AlertOctagon,
} from 'lucide-react';
import { Button, StatCard, DataTable, ConfirmDialog } from '../../../components/ui';
import { IConductor, ICreateConductorDTO, IUpdateConductorDTO } from '@erp/contracts';
import { ConductorClientService } from '../services/conductorClientService';
import { ConductorModal } from './ConductorModal';
import { formatDate } from '../../../utils/formatters';

export const ConductoresCatalogView: React.FC = () => {
  const [conductores, setConductores] = useState<IConductor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterLicencia, setFilterLicencia] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingConductor, setEditingConductor] = useState<IConductor | null>(null);
  const [conductorToDelete, setConductorToDelete] = useState<IConductor | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await ConductorClientService.getConductores();
      setConductores(data);
    } catch (err: any) {
      console.error('[ConductoresCatalogView]: Error al cargar conductores:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingConductor(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (conductor: IConductor) => {
    setEditingConductor(conductor);
    setIsModalOpen(true);
  };

  const handleSaveConductor = async (
    data: ICreateConductorDTO | IUpdateConductorDTO,
    id?: number
  ) => {
    if (id) {
      await ConductorClientService.updateConductor(id, data);
      setSuccessMsg('Conductor actualizado exitosamente.');
    } else {
      await ConductorClientService.createConductor(data as ICreateConductorDTO);
      setSuccessMsg('Conductor registrado exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCambiarEstado = async (conductor: IConductor, nuevoEstado: 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO') => {
    try {
      await ConductorClientService.updateConductor(conductor.conIdConductor, {
        conEstado: nuevoEstado,
      });
      setSuccessMsg(`Estado del conductor ${conductor.conNombreEmpleado || conductor.conDpi} cambiado a "${nuevoEstado}".`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado del conductor.');
    }
  };

  const handleDeleteConductor = (conductor: IConductor) => {
    setConductorToDelete(conductor);
  };

  const handleConfirmDelete = async () => {
    if (!conductorToDelete) return;
    setIsDeleting(true);
    try {
      const res = await ConductorClientService.deleteConductor(conductorToDelete.conIdConductor);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
      setConductorToDelete(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar conductor.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered dataset
  const filteredConductores = useMemo(() => {
    return conductores.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        c.conDpi.toLowerCase().includes(q) ||
        c.conNoLicencia.toLowerCase().includes(q) ||
        (c.conNombreEmpleado && c.conNombreEmpleado.toLowerCase().includes(q)) ||
        String(c.conIdConductor).includes(q);

      const matchEstado =
        filterEstado === 'TODOS' ||
        c.conEstado === filterEstado;

      const matchLicencia =
        filterLicencia === 'TODOS' ||
        c.conTipoLicencia === filterLicencia;

      return matchSearch && matchEstado && matchLicencia;
    });
  }, [conductores, searchQuery, filterEstado, filterLicencia]);

  // Metrics
  const totalCount = conductores.length;
  const activosCount = conductores.filter((c) => c.conEstado === 'ACTIVO').length;
  const suspendidosCount = conductores.filter((c) => c.conEstado === 'SUSPENDIDO').length;
  const inactivosCount = conductores.filter((c) => c.conEstado === 'INACTIVO').length;

  const today = new Date().toISOString().slice(0, 10);

  const columns = [
    {
      header: 'ID',
      accessorKey: 'conIdConductor',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">#{value}</span>
      ),
    },
    {
      header: 'CONDUCTOR / EMPLEADO',
      accessorKey: 'conNombreEmpleado',
      cell: ({ value, row }: { value?: string; row: IConductor }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
            {(value || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm block">
              {value || `Empleado #${row.conIdEmpleado}`}
            </span>
            <span className="text-[11px] text-slate-400">
              ID Empleado: #{row.conIdEmpleado}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'DPI (GUATEMALA)',
      accessorKey: 'conDpi',
      cell: ({ value }: { value: string }) => (
        <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded-md inline-block border border-slate-200">
          {value.length === 13
            ? `${value.slice(0, 4)} ${value.slice(4, 9)} ${value.slice(9)}`
            : value}
        </div>
      ),
    },
    {
      header: 'LICENCIA Y VENCIMIENTO',
      accessorKey: 'conNoLicencia',
      cell: ({ row }: { row: IConductor }) => {
        const isVencida = row.conFechaVencimientoLic < today;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
                TIPO {row.conTipoLicencia}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-700">
                {row.conNoLicencia}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Vence:</span>
              <span className={`font-semibold ${isVencida ? 'text-red-600 font-bold flex items-center gap-1' : 'text-slate-700'}`}>
                {formatDate(row.conFechaVencimientoLic)}
                {isVencida && (
                  <span title="Licencia Vencida">
                    <AlertOctagon size={12} className="text-red-600" />
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'ESTADO',
      accessorKey: 'conEstado',
      cell: ({ value }: { value: string }) => {
        let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let label = 'Activo';

        if (value === 'SUSPENDIDO') {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
          label = 'Suspendido';
        } else if (value === 'INACTIVO') {
          badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
          label = 'Inactivo';
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
            {label}
          </span>
        );
      },
    },
    {
      header: 'ACCIONES',
      align: 'right' as const,
      cell: ({ row }: { row: IConductor }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar conductor"
          >
            <Edit2 size={15} />
          </button>
          {row.conEstado !== 'ACTIVO' && (
            <button
              type="button"
              onClick={() => handleCambiarEstado(row, 'ACTIVO')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Habilitar / Activar conductor"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          {row.conEstado !== 'SUSPENDIDO' && (
            <button
              type="button"
              onClick={() => handleCambiarEstado(row, 'SUSPENDIDO')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Suspender temporalmente"
            >
              <ShieldAlert size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDeleteConductor(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Desactivar / Eliminar conductor"
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
              <UserCheck size={18} />
            </div>
            Catálogo de Conductores Autorizados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro y control legal de choferes internos de la empresa con validación estricta de DPI y Licencia
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            disabled={isLoading}
            className="text-xs"
          >
            Refrescar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreate}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Nuevo Conductor
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Conductores"
          value={totalCount}
          icon={UserCheck}
          change="Padrón registrado"
        />
        <StatCard
          title="Conductores Habilitados"
          value={activosCount}
          icon={ShieldCheck}
          change="En servicio"
        />
        <StatCard
          title="Suspendidos"
          value={suspendidosCount}
          icon={ShieldAlert}
          change="Temporalmente inhabilitados"
        />
        <StatCard
          title="Inactivos / Bajas"
          value={inactivosCount}
          icon={XCircle}
          change="Desvinculados"
        />
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
            &times;
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por DPI, empleado o licencia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-medium shrink-0">Tipo:</span>
          {(['TODOS', 'A', 'B', 'C', 'M'] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFilterLicencia(tipo)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                filterLicencia === tipo
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tipo === 'TODOS' ? 'Todos Tipos' : `Tipo ${tipo}`}
            </button>
          ))}

          <span className="text-xs text-slate-500 font-medium shrink-0 ml-2">Estado:</span>
          {(['TODOS', 'ACTIVO', 'SUSPENDIDO', 'INACTIVO'] as const).map((est) => (
            <button
              key={est}
              onClick={() => setFilterEstado(est)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                filterEstado === est
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {est === 'TODOS' ? 'Todos' : est === 'ACTIVO' ? 'Activos' : est === 'SUSPENDIDO' ? 'Suspendidos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={filteredConductores}
        isLoading={isLoading}
        emptyText="No se encontraron conductores registrados en la base de datos."
      />

      {/* Create / Edit Modal */}
      <ConductorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConductor}
        conductor={editingConductor}
      />

      {/* Delete / Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(conductorToDelete)}
        onClose={() => setConductorToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Desactivar o Eliminar Conductor"
        itemName={conductorToDelete ? `Conductor: ${conductorToDelete.conNombreEmpleado || conductorToDelete.conDpi} (DPI: ${conductorToDelete.conDpi})` : undefined}
        description="¿Está seguro de que desea retirar a este conductor? Si ya ha participado en recepciones de bodega, cambiará automáticamente su estado a INACTIVO."
        confirmText="Confirmar Acción"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
