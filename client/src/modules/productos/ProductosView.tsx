import React, { useState } from 'react';
import {
  Package,
  FolderTree,
  Tag,
  Award,
  Scale,
  Truck,
  UserCheck,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { ArticulosCatalogView } from '../inventario/components/ArticulosCatalogView';
import { CategoriasCatalogView } from '../inventario/components/CategoriasCatalogView';
import { MarcasCatalogView } from '../inventario/components/MarcasCatalogView';
import { UnidadesMedidaCatalogView } from '../inventario/components/UnidadesMedidaCatalogView';
import { VehiculosCatalogView } from '../inventario/components/VehiculosCatalogView';
import { ConductoresCatalogView } from '../inventario/components/ConductoresCatalogView';

export type ProductosSection =
  | 'hub'
  | 'articulos'
  | 'categorias'
  | 'marcas'
  | 'unidades-medida'
  | 'vehiculos'
  | 'conductores';

export interface ProductosViewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const ProductosView: React.FC<ProductosViewProps> = ({
  activeTab: propTab,
  onTabChange,
}) => {
  const [currentSection, setCurrentSection] = useState<ProductosSection>(() => {
    if (propTab && propTab !== 'hub' && propTab !== 'articulos') {
      return propTab as ProductosSection;
    }
    return 'hub';
  });

  const handleNavigate = (section: ProductosSection) => {
    setCurrentSection(section);
    if (onTabChange) {
      onTabChange(section);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: HUB PRINCIPAL DE CATÁLOGOS (CARDS)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentSection === 'hub') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fadeIn select-none">
        {/* Banner de Bienvenida y Header del Módulo */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <BookOpen size={14} className="text-blue-600" />
              <span>Maestros y Clasificaciones</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Catálogos Maestros del Sistema
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Administración unificada de productos, jerarquías de categorías, fabricantes de marcas, unidades de medida y flota logística vehicular con sus conductores asignados.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <Layers size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE CATEGORÍAS (GRID PRINCIPAL) */}
        <div className="space-y-8">
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 1: CATÁLOGOS DE PRODUCTOS E INVENTARIO */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Header de Sección */}
            <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Catálogos de Productos e Inventario
                  </h2>
                  <p className="text-xs text-slate-500">
                    Gestión de artículos, clasificaciones, marcas y unidades de medida base.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                4 Catálogos
              </span>
            </div>

            {/* Grid de Sub-Tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Artículos */}
              <button
                type="button"
                onClick={() => handleNavigate('articulos')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Package size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Artículos
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Catálogo general de productos y bienes.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-blue-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Productos</span>
                </div>
              </button>

              {/* Card 2: Categorías */}
              <button
                type="button"
                onClick={() => handleNavigate('categorias')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <FolderTree size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Categorías
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Agrupaciones y jerarquías de productos.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Familias</span>
                </div>
              </button>

              {/* Card 3: Marcas */}
              <button
                type="button"
                onClick={() => handleNavigate('marcas')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Award size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Marcas
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Fabricantes y marcas comerciales.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-amber-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Fabricantes</span>
                </div>
              </button>

              {/* Card 4: Unidades de Medida */}
              <button
                type="button"
                onClick={() => handleNavigate('unidades-medida')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Scale size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Unidades de Medida
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Sistemas de conteo y medición (UND, KG, RSM).
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Conversiones</span>
                </div>
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 2: CATÁLOGOS DE LOGÍSTICA Y FLOTA */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 pt-2">
            {/* Header de Sección */}
            <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 shadow-2xs">
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Catálogos de Logística y Flota
                  </h2>
                  <p className="text-xs text-slate-500">
                    Administración de la flota de vehículos corporativos y personal de conducción.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-[11px] font-bold border border-violet-100">
                2 Catálogos
              </span>
            </div>

            {/* Grid de Sub-Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Vehículos */}
              <button
                type="button"
                onClick={() => handleNavigate('vehiculos')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-violet-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Truck size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                      Vehículos
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Flota asignada a despachos, transferencias y transportes.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-violet-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Transporte</span>
                </div>
              </button>

              {/* Card 2: Conductores */}
              <button
                type="button"
                onClick={() => handleNavigate('conductores')}
                className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <UserCheck size={24} />
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 transition-colors">
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      Conductores
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Personal operativo vinculado a la flota de transporte.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-teal-600 group-hover:underline">
                    Abrir catálogo
                  </span>
                  <span className="text-[11px] text-slate-400">Personal</span>
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
    Exclude<ProductosSection, 'hub'>,
    { title: string; category: string; icon: React.ReactNode }
  > = {
    articulos: {
      title: 'Catálogo de Artículos',
      category: 'Catálogos de Productos e Inventario',
      icon: <Package size={18} className="text-blue-600" />,
    },
    categorias: {
      title: 'Categorías de Productos',
      category: 'Catálogos de Productos e Inventario',
      icon: <FolderTree size={18} className="text-indigo-600" />,
    },
    marcas: {
      title: 'Marcas Comerciales',
      category: 'Catálogos de Productos e Inventario',
      icon: <Award size={18} className="text-amber-600" />,
    },
    'unidades-medida': {
      title: 'Unidades de Medida',
      category: 'Catálogos de Productos e Inventario',
      icon: <Scale size={18} className="text-emerald-600" />,
    },
    vehiculos: {
      title: 'Flota de Vehículos',
      category: 'Catálogos de Logística y Flota',
      icon: <Truck size={18} className="text-violet-600" />,
    },
    conductores: {
      title: 'Personal de Conducción',
      category: 'Catálogos de Logística y Flota',
      icon: <UserCheck size={18} className="text-teal-600" />,
    },
  };

  const currentMeta = sectionMeta[currentSection as Exclude<ProductosSection, 'hub'>];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Barra superior de navegación interna */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => handleNavigate('hub')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300 shadow-2xs"
          >
            Volver a Catálogos
          </Button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Breadcrumb path */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => handleNavigate('hub')}
              className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              Catálogos
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-400 hidden md:inline">
              {currentMeta?.category}
            </span>
            <ChevronRight size={14} className="text-slate-400 hidden md:inline" />
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              {currentMeta?.icon}
              {currentMeta?.title}
            </span>
          </div>
        </div>

        {/* Acceso rápido a otras secciones relacionadas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'articulos', label: 'Artículos' },
              { id: 'categorias', label: 'Categorías' },
              { id: 'marcas', label: 'Marcas' },
              { id: 'unidades-medida', label: 'U. Medida' },
              { id: 'vehiculos', label: 'Vehículos' },
              { id: 'conductores', label: 'Conductores' },
            ] as const
          ).map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Renderizado del Catálogo Seleccionado */}
      <div className="bg-transparent">
        {currentSection === 'articulos' && <ArticulosCatalogView />}
        {currentSection === 'categorias' && <CategoriasCatalogView />}
        {currentSection === 'marcas' && <MarcasCatalogView />}
        {currentSection === 'unidades-medida' && <UnidadesMedidaCatalogView />}
        {currentSection === 'vehiculos' && <VehiculosCatalogView />}
        {currentSection === 'conductores' && <ConductoresCatalogView />}
      </div>
    </div>
  );
};
