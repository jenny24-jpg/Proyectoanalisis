import React, { useState } from 'react';
import {
  Warehouse,
  MapPin,
  Barcode,
  ArrowLeftRight,
  SlidersHorizontal,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Boxes,
  Activity,
  FolderTree,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { BodegasCatalogView } from './components/BodegasCatalogView';
import { UbicacionesCatalogView } from './components/UbicacionesCatalogView';
import { LotesCatalogView } from './components/LotesCatalogView';
import { MovimientoCreacionView } from './components/MovimientoCreacionView';
import { TiposMovimientoCatalogView } from './components/TiposMovimientoCatalogView';
import { AuditoriaView } from './components/AuditoriaView';

export type InventarioSection =
  | 'hub'
  | 'bodegas'
  | 'ubicaciones'
  | 'lotes'
  | 'movimientos'
  | 'tipos-movimiento'
  | 'auditoria';

export interface InventarioViewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const InventarioView: React.FC<InventarioViewProps> = ({
  activeTab: propTab,
  onTabChange,
}) => {
  // Estado de navegación interna: si no se especifica o es 'hub', muestra el Hub
  const [currentSection, setCurrentSection] = useState<InventarioSection>(() => {
    if (propTab && propTab !== 'hub' && propTab !== 'bodegas') {
      return propTab as InventarioSection;
    }
    return 'hub';
  });

  const handleNavigate = (section: InventarioSection) => {
    setCurrentSection(section);
    if (onTabChange) {
      onTabChange(section);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: HUB PRINCIPAL DE INVENTARIOS (CARDS)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentSection === 'hub') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fadeIn select-none">
        {/* Banner de Bienvenida y Header del Módulo (Estilo Tarjeta Limpia / Minimalista) */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Boxes size={14} className="text-blue-600" />
              <span>Control Logístico y Almacén</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Módulo de Inventarios
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Centro de administración para la infraestructura física de almacenamiento, catálogo de ubicaciones, control de lotes con fechas de vencimiento y registro de movimientos kardex en tiempo real.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <Boxes size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE CATEGORÍAS (GRID PRINCIPAL) */}
        <div className="space-y-8">
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* CATEGORÍA 1: MOVIMIENTOS Y OPERACIONES */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Header de Categoría */}
            <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Movimientos y Operaciones
                  </h2>
                  <p className="text-xs text-slate-500">
                    Consulta transacciones, kardex, trazabilidad y auditoría de stock.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                3 Operaciones
              </span>
            </div>

            {/* Grid de Sub-Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Movimientos / Kardex */}
              <button
                type="button"
                onClick={() => handleNavigate('movimientos')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <ArrowLeftRight size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Movimientos / Kardex
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Entradas, salidas y transferencias.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600 group-hover:underline">
                    Gestionar kardex
                  </span>
                  <span className="text-[11px] text-slate-400">Transacciones</span>
                </div>
              </button>

              {/* Card 2: Tipos de Movimiento */}
              <button
                type="button"
                onClick={() => handleNavigate('tipos-movimiento')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-cyan-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <SlidersHorizontal size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-cyan-600 group-hover:bg-cyan-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      Tipos de Movimiento
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Configuración de naturalezas y afectación de costos.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-cyan-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Configuración</span>
                </div>
              </button>

              {/* Card 3: Auditoría */}
              <button
                type="button"
                onClick={() => handleNavigate('auditoria')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <ShieldCheck size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      Auditoría
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Bitácoras y rastreo de operaciones del inventario.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-purple-600 group-hover:underline">
                    Ver bitácora
                  </span>
                  <span className="text-[11px] text-slate-400">Seguridad</span>
                </div>
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* CATEGORÍA 2: CATÁLOGOS DE INVENTARIO */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 pt-2">
            {/* Header de Categoría */}
            <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <FolderTree size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Catálogos de Inventario
                  </h2>
                  <p className="text-xs text-slate-500">
                    Administra la infraestructura física y clasificaciones de almacenamiento.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                3 Catálogos
              </span>
            </div>

            {/* Grid de Sub-Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Bodegas */}
              <button
                type="button"
                onClick={() => handleNavigate('bodegas')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Warehouse size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Bodegas
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Gestión de centros de almacenamiento y sucursales.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-blue-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Infraestructura</span>
                </div>
              </button>

              {/* Card 2: Ubicaciones */}
              <button
                type="button"
                onClick={() => handleNavigate('ubicaciones')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <MapPin size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Ubicaciones
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pasillos, racks y niveles dentro de cada bodega.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Racks & Pasillos</span>
                </div>
              </button>

              {/* Card 3: Lotes */}
              <button
                type="button"
                onClick={() => handleNavigate('lotes')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Barcode size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Lotes
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Control de números de lote, producción y vencimientos.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-amber-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Trazabilidad</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: VISTA ESPECÍFICA CON BARRA DE RETORNO AL HUB
  // ─────────────────────────────────────────────────────────────────────────────
  const sectionMeta: Record<
    Exclude<InventarioSection, 'hub'>,
    { title: string; category: string; icon: React.ReactNode }
  > = {
    bodegas: {
      title: 'Catálogo de Bodegas',
      category: 'Catálogos de Inventario',
      icon: <Warehouse size={18} className="text-blue-600" />,
    },
    ubicaciones: {
      title: 'Catálogo de Ubicaciones',
      category: 'Catálogos de Inventario',
      icon: <MapPin size={18} className="text-indigo-600" />,
    },
    lotes: {
      title: 'Control de Lotes y Vencimientos',
      category: 'Catálogos de Inventario',
      icon: <Barcode size={18} className="text-amber-600" />,
    },
    movimientos: {
      title: 'Movimientos de Inventario y Kardex',
      category: 'Movimientos y Operaciones',
      icon: <ArrowLeftRight size={18} className="text-emerald-600" />,
    },
    'tipos-movimiento': {
      title: 'Tipos de Movimiento',
      category: 'Movimientos y Operaciones',
      icon: <SlidersHorizontal size={18} className="text-cyan-600" />,
    },
    auditoria: {
      title: 'Bitácora y Auditoría de Inventario',
      category: 'Movimientos y Operaciones',
      icon: <ShieldCheck size={18} className="text-purple-600" />,
    },
  };

  const currentMeta = sectionMeta[currentSection as Exclude<InventarioSection, 'hub'>];

  return (
    <div className="h-full w-full space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Barra de Navegación de Regreso al Hub */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => handleNavigate('hub')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300 shadow-2xs"
          >
            Volver al Hub
          </Button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Breadcrumb Visual */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleNavigate('hub')}
              className="text-slate-400 hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              Inventarios
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium">
              {currentMeta?.category || 'Sección'}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold flex items-center gap-1.5">
              {currentMeta?.icon}
              {currentMeta?.title || 'Vista'}
            </span>
          </div>
        </div>

        {/* Acceso Rápido Entre Secciones */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1 shrink-0">
            Ir a:
          </span>
          {(['bodegas', 'ubicaciones', 'lotes', 'movimientos', 'tipos-movimiento', 'auditoria'] as InventarioSection[]).map(
            (sec) => {
              const isCurrent = currentSection === sec;
              const labels: Record<string, string> = {
                bodegas: 'Bodegas',
                ubicaciones: 'Ubicaciones',
                lotes: 'Lotes',
                movimientos: 'Kardex',
                'tipos-movimiento': 'Tipos Mov.',
                auditoria: 'Auditoría',
              };

              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleNavigate(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {labels[sec]}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Renderizado de la Vista Seleccionada */}
      {currentSection === 'bodegas' && <BodegasCatalogView />}
      {currentSection === 'ubicaciones' && <UbicacionesCatalogView />}
      {currentSection === 'lotes' && <LotesCatalogView />}
      {currentSection === 'tipos-movimiento' && <TiposMovimientoCatalogView />}
      {currentSection === 'movimientos' && (
        <MovimientoCreacionView
          onSuccess={() => {
            if (onTabChange) onTabChange('movimientos');
          }}
        />
      )}
      {currentSection === 'auditoria' && <AuditoriaView />}
    </div>
  );
};

export default InventarioView;
