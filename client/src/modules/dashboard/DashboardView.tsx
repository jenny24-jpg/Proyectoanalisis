import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" size={28} />
            Dashboard General
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resumen ejecutivo del ERP Universitario
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
        <LayoutDashboard className="mx-auto text-slate-300 mb-3" size={48} />
        <h3 className="text-base font-semibold text-slate-700">Módulo de Dashboard</h3>
        <p className="text-sm text-slate-400 mt-1">Vista en blanco lista para agregar indicadores y gráficas principales.</p>
      </div>
    </div>
  );
};
