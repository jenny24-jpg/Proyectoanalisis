import React, { useState } from 'react';
import { AppLayout, TabItem } from '../components/ui/AppLayout';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { ComprasView } from '../modules/compras/ComprasView';
import { ProductosView } from '../modules/productos/ProductosView';
import { InventarioView } from '../modules/inventario/InventarioView';
import { CxpView } from '../modules/cxp/CxpView';
import { CxcView } from '../modules/cxc/CxcView';
import { BancosView } from '../modules/bancos/BancosView';

export default function App() {
  const [activeModule, setActiveModule] = useState<string>('compras');
  const [activeComprasTab, setActiveComprasTab] = useState<string>('registros');
  const [activeProductosTab, setActiveProductosTab] = useState<string>('articulos');
  const [activeInventarioTab, setActiveInventarioTab] = useState<string>('bodegas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const comprasTabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'registros', label: 'Registros' },
    { id: 'proveedores', label: 'Proveedores' },
    { id: 'estados', label: 'Estados' },
  ];

  const productosTabs: TabItem[] = [
    { id: 'articulos', label: 'Artículos' },
    { id: 'categorias', label: 'Categorías' },
    { id: 'marcas', label: 'Marcas' },
    { id: 'unidades-medida', label: 'Unidades de Medida' },
  ];

  const inventarioTabs: TabItem[] = [
    { id: 'bodegas', label: 'Bodegas' },
    { id: 'ubicaciones', label: 'Ubicaciones' },
    { id: 'lotes', label: 'Lotes' },
    { id: 'movimientos', label: 'Movimientos / Kardex' },
    { id: 'tipos-movimiento', label: 'Tipos de Movimiento' },
    { id: 'auditoria', label: 'Auditoría' },
  ];

  const renderModuleView = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />;
      case 'compras':
        return (
          <ComprasView
            activeTab={activeComprasTab}
            onTabChange={(tabId: string) => setActiveComprasTab(tabId)}
          />
        );
      case 'productos':
        return (
          <ProductosView
            activeTab={activeProductosTab}
            onTabChange={(tabId: string) => setActiveProductosTab(tabId)}
          />
        );
      case 'inventario':
        return (
          <InventarioView
            activeTab={activeInventarioTab}
            onTabChange={(tabId: string) => setActiveInventarioTab(tabId)}
          />
        );
      case 'cuentas_pagar':
      case 'cxp':
        return <CxpView />;
      case 'cuentas_cobrar':
      case 'cxc':
        return <CxcView />;
      case 'bancos':
        return <BancosView />;
      default:
        return (
          <ComprasView
            activeTab={activeComprasTab}
            onTabChange={(tabId: string) => setActiveComprasTab(tabId)}
          />
        );
    }
  };

  const currentTabs = activeModule === 'compras'
    ? comprasTabs
    : activeModule === 'productos'
      ? productosTabs
      : activeModule === 'inventario'
        ? inventarioTabs
        : [];

  const currentActiveTab = activeModule === 'compras'
    ? activeComprasTab
    : activeModule === 'productos'
      ? activeProductosTab
      : activeModule === 'inventario'
        ? activeInventarioTab
        : undefined;

  return (
    <AppLayout
      activeModule={activeModule}
      onSelectModule={(moduleId: string) => setActiveModule(moduleId)}
      activeTab={currentActiveTab}
      onTabChange={(tabId: string) => {
        if (activeModule === 'compras') {
          setActiveComprasTab(tabId);
        } else if (activeModule === 'productos') {
          setActiveProductosTab(tabId);
        } else if (activeModule === 'inventario') {
          setActiveInventarioTab(tabId);
        }
      }}
      tabs={currentTabs}
      searchQuery={searchQuery}
      onSearchChange={(query: string) => setSearchQuery(query)}
    >
      {renderModuleView()}
    </AppLayout>
  );
}
