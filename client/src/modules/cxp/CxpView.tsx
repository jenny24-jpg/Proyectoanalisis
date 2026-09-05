import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

export const CxpView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={28} />
            Módulo de Cuentas por Pagar (CXP)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de facturas de proveedores y cuentas por pagar
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
        <FileSpreadsheet className="mx-auto text-slate-300 mb-3" size={48} />
        <h3 className="text-base font-semibold text-slate-700">Módulo de Cuentas por Pagar</h3>
        <p className="text-sm text-slate-400 mt-1">Vista en blanco lista para la administración de facturas y pasivos con proveedores.</p>
      </div>
    </div>
  );
};
