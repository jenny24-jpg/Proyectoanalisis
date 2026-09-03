import React from 'react';
import { ShoppingCart, Plus, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ComprasView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" size={28} />
            Módulo de Compras
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de solicitudes de compra, cotizaciones y órdenes de compra
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={FileText}>
            Nueva Solicitud
          </Button>
          <Button variant="primary" icon={Plus}>
            Nueva Cotización
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
        <ShoppingCart className="mx-auto text-slate-300 mb-3" size={48} />
        <h3 className="text-base font-semibold text-slate-700">Módulo de Compras</h3>
        <p className="text-sm text-slate-400 mt-1">Vista en blanco lista para integrar la gestión de Cotizaciones y Solicitudes.</p>
      </div>
    </div>
  );
};
