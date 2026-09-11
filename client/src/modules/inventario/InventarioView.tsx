import React from 'react';
import { BodegasCatalogView } from './components/BodegasCatalogView';
import { UbicacionesCatalogView } from './components/UbicacionesCatalogView';
import { LotesCatalogView } from './components/LotesCatalogView';
import { MovimientoCreacionView } from './components/MovimientoCreacionView';
import { TiposMovimientoCatalogView } from './components/TiposMovimientoCatalogView';
import { AuditoriaView } from './components/AuditoriaView';

export interface InventarioViewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const InventarioView: React.FC<InventarioViewProps> = ({
  activeTab = 'bodegas',
  onTabChange,
}) => {
  return (
    <div className="h-full w-full">
      {activeTab === 'bodegas' && (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
          <BodegasCatalogView />
        </div>
      )}
      {activeTab === 'ubicaciones' && (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
          <UbicacionesCatalogView />
        </div>
      )}
      {activeTab === 'lotes' && (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
          <LotesCatalogView />
        </div>
      )}
      {activeTab === 'movimientos' && (
        <MovimientoCreacionView 
          onSuccess={() => {
            if (onTabChange) onTabChange('movimientos');
          }}
        />
      )}
      {activeTab === 'tipos-movimiento' && (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
          <TiposMovimientoCatalogView />
        </div>
      )}
      {activeTab === 'auditoria' && <AuditoriaView />}
    </div>
  );
};
