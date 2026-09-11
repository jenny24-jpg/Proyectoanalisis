import React from 'react';
import { CatalogoArticulos } from '../inventario/views/CatalogoArticulos';
import { CategoriasCatalogView } from '../inventario/components/CategoriasCatalogView';
import { MarcasCatalogView } from '../inventario/components/MarcasCatalogView';
import { UnidadesMedidaCatalogView } from '../inventario/components/UnidadesMedidaCatalogView';

export interface ProductosViewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const ProductosView: React.FC<ProductosViewProps> = ({
  activeTab = 'articulos',
  onTabChange,
}) => {
  return (
    <div className="h-full w-full">
      {activeTab === 'articulos' && <CatalogoArticulos />}
      {activeTab === 'categorias' && (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
          <CategoriasCatalogView />
        </div>
      )}
      {activeTab === 'marcas' && (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
          <MarcasCatalogView />
        </div>
      )}
      {activeTab === 'unidades-medida' && (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
          <UnidadesMedidaCatalogView />
        </div>
      )}
    </div>
  );
};
