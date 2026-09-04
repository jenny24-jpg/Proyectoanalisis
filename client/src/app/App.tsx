import React, { useState } from 'react';
import { AppLayout } from '../components/ui/AppLayout';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { ComprasView } from '../modules/compras/ComprasView';
import { InventarioView } from '../modules/inventario/InventarioView';
import { CxpView } from '../modules/cxp/CxpView';
import { CxcView } from '../modules/cxc/CxcView';
import { BancosView } from '../modules/bancos/BancosView';

export default function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const renderModuleView = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />;
      case 'compras':
        return <ComprasView />;
      case 'inventario':
        return <InventarioView />;
      case 'cuentas_pagar':
      case 'cxp':
        return <CxpView />;
      case 'cuentas_cobrar':
      case 'cxc':
        return <CxcView />;
      case 'bancos':
        return <BancosView />;
      default:
        return <ComprasView />;
    }
  };

  return (
    <AppLayout
      activeModule={activeModule}
      onSelectModule={(moduleId: string) => setActiveModule(moduleId)}
      searchQuery={searchQuery}
      onSearchChange={(query: string) => setSearchQuery(query)}
    >
      {renderModuleView()}
    </AppLayout>
  );
}
