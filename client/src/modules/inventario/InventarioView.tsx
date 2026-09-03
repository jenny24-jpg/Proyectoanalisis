import React from 'react';
import { Package } from 'lucide-react';

export const InventarioView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="text-blue-600" size={28} />
            Módulo de Inventario / Bodega
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Recepción de artículos, control de existencias y bodega
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
        <Package className="mx-auto text-slate-300 mb-3" size={48} />
        <h3 className="text-base font-semibold text-slate-700">Módulo de Inventario</h3>
        <p className="text-sm text-slate-400 mt-1">Vista en blanco lista para la gestión de recepción en bodega e inventario.</p>
      </div>
    </div>
  );
};
