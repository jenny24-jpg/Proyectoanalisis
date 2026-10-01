import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Button, StatCard, DataTable, ConfirmDialog } from '../../../components/ui';
import { IVehiculo, ICreateVehiculoDTO, IUpdateVehiculoDTO } from '@erp/contracts';
import { VehiculoClientService } from '../services/vehiculoClientService';
import { VehiculoModal } from './VehiculoModal';

export const VehiculosCatalogView: React.FC = () => {
  const [vehiculos, setVehiculos] = useState<IVehiculo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehiculo, setEditingVehiculo] = useState<IVehiculo | null>(null);
  const [vehiculoToDelete, setVehiculoToDelete] = useState<IVehiculo | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await VehiculoClientService.getVehiculos();
      setVehiculos(data);
    } catch (err: any) {
      console.error('[VehiculosCatalogView]: Error al cargar vehículos:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehiculo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehiculo: IVehiculo) => {
    setEditingVehiculo(vehiculo);
    setIsModalOpen(true);
  };

  const handleSaveVehiculo = async (
    data: ICreateVehiculoDTO | IUpdateVehiculoDTO,
    id?: number
  ) => {
    if (id) {
      await VehiculoClientService.updateVehiculo(id, data);
      setSuccessMsg('Vehículo actualizado exitosamente.');
    } else {
      await VehiculoClientService.createVehiculo(data as ICreateVehiculoDTO);
      setSuccessMsg('Vehículo registrado exitosamente.');
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCambiarEstado = async (vehiculo: IVehiculo, nuevoEstado: 'ACTIVO' | 'MANTENIMIENTO' | 'BAJA') => {
    try {
      await VehiculoClientService.updateVehiculo(vehiculo.vehIdVehiculo, {
        vehEstado: nuevoEstado,
      });
      setSuccessMsg(`Estado del vehículo ${vehiculo.vehPlaca} cambiado a "${nuevoEstado}".`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar estado del vehículo.');
    }
  };

  const handleDeleteVehiculo = (vehiculo: IVehiculo) => {
    setVehiculoToDelete(vehiculo);
  };

  const handleConfirmDelete = async () => {
    if (!vehiculoToDelete) return;
    setIsDeleting(true);
    try {
      const res = await VehiculoClientService.deleteVehiculo(vehiculoToDelete.vehIdVehiculo);
      setSuccessMsg(res.message);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
      setVehiculoToDelete(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el vehículo.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered dataset
  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        v.vehPlaca.toLowerCase().includes(q) ||
        v.vehMarca.toLowerCase().includes(q) ||
        v.vehModelo.toLowerCase().includes(q) ||
        String(v.vehAnio || '').includes(q) ||
        String(v.vehIdVehiculo).includes(q);

      const matchEstado =
        filterEstado === 'TODOS' ||
        v.vehEstado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [vehiculos, searchQuery, filterEstado]);

  // Metrics
  const totalCount = vehiculos.length;
  const activosCount = vehiculos.filter((v) => v.vehEstado === 'ACTIVO').length;
  const mantenimientoCount = vehiculos.filter((v) => v.vehEstado === 'MANTENIMIENTO').length;
  const bajaCount = vehiculos.filter((v) => v.vehEstado === 'BAJA').length;

  const columns = [
    {
      header: 'ID',
      accessorKey: 'vehIdVehiculo',
      cell: ({ value }: { value: number }) => (
        <span className="font-mono text-xs font-semibold text-slate-500">#{value}</span>
      ),
    },
    {
      header: 'PLACA OFICIAL',
      accessorKey: 'vehPlaca',
      cell: ({ value }: { value: string }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Truck size={16} />
          </div>
          <div>
            <span className="font-mono font-bold text-blue-700 bg-blue-50/60 px-2 py-0.5 border border-blue-200 rounded-md text-xs">
              {value}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'MARCA Y MODELO',
      accessorKey: 'vehMarca',
      cell: ({ row }: { row: IVehiculo }) => (
        <div>
          <span className="font-bold text-slate-800 text-sm block">
            {row.vehMarca} {row.vehModelo}
          </span>
          <span className="text-[11px] text-slate-400">
            {row.vehAnio ? `Modelo / Año: ${row.vehAnio}` : 'Año no especificado'}
          </span>
        </div>
      ),
    },
    {
      header: 'ESTADO OPERATIVO',
      accessorKey: 'vehEstado',
      cell: ({ value }: { value: string }) => {
        let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let label = 'Activo / Operativo';

        if (value === 'MANTENIMIENTO') {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
          label = 'En Mantenimiento';
        } else if (value === 'BAJA') {
          badgeStyle = 'bg-red-50 text-red-700 border-red-200';
          label = 'Baja / Retirado';
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
      cell: ({ row }: { row: IVehiculo }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar vehículo"
          >
            <Edit2 size={15} />
          </button>
          {row.vehEstado !== 'ACTIVO' && (
            <button
              type="button"
              onClick={() => handleCambiarEstado(row, 'ACTIVO')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Poner en estado Activo"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          {row.vehEstado !== 'MANTENIMIENTO' && (
            <button
              type="button"
              onClick={() => handleCambiarEstado(row, 'MANTENIMIENTO')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Enviar a Mantenimiento"
            >
              <Wrench size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDeleteVehiculo(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Dar de baja / Eliminar"
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
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Truck size={18} />
            </div>
            Catálogo de Vehículos (Flota Propia)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de unidades vehiculares y transportes de la empresa para recepción de mercadería
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
            className="text-xs font-semibold"
          >
            Nuevo Vehículo
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Vehículos"
          value={totalCount}
          icon={Truck}
          change="Flota registrada"
        />
        <StatCard
          title="Unidades Activas"
          value={activosCount}
          icon={ShieldCheck}
          change="Disponibles"
        />
        <StatCard
          title="En Mantenimiento"
          value={mantenimientoCount}
          icon={Wrench}
          change="En taller / revisión"
        />
        <StatCard
          title="Fuera de Servicio"
          value={bajaCount}
          icon={XCircle}
          change="Baja del sistema"
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
            placeholder="Buscar por placa, marca o modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-medium shrink-0">Filtrar:</span>
          {(['TODOS', 'ACTIVO', 'MANTENIMIENTO', 'BAJA'] as const).map((est) => (
            <button
              key={est}
              onClick={() => setFilterEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                filterEstado === est
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {est === 'TODOS'
                ? 'Todos'
                : est === 'ACTIVO'
                ? 'Activos'
                : est === 'MANTENIMIENTO'
                ? 'Mantenimiento'
                : 'Bajas'}
            </button>
          ))}
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={filteredVehiculos}
        isLoading={isLoading}
        emptyText="No se encontraron vehículos registrados en la base de datos."
      />

      {/* Create / Edit Modal */}
      <VehiculoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVehiculo}
        vehiculo={editingVehiculo}
      />

      {/* Delete / Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(vehiculoToDelete)}
        onClose={() => setVehiculoToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Dar de Baja o Eliminar Vehículo"
        itemName={vehiculoToDelete ? `Vehículo Placa: ${vehiculoToDelete.vehPlaca} (${vehiculoToDelete.vehMarca} ${vehiculoToDelete.vehModelo})` : undefined}
        description="¿Está seguro de que desea retirar o eliminar este vehículo? Si ya ha sido utilizado en recepciones de bodega, cambiará automáticamente su estado a BAJA."
        confirmText="Confirmar Acción"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
