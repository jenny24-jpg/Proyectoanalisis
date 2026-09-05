import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileCheck,
  Layers,
  FileText,
  Boxes,
  LucideIcon
} from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  changeLabel?: string;
  isPositive?: boolean;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = 'vs. mes anterior',
  isPositive = true,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
        {change && (
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {change}
            </span>
            <span className="text-slate-400 font-normal">{changeLabel}</span>
          </div>
        )}

        {actionText && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-medium text-slate-400 hover:text-blue-600 flex items-center gap-0.5 transition-colors ml-auto"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export interface ProcessStep {
  id: string;
  title: string;
  count: number;
  status: 'completed' | 'active' | 'inactive';
  icon?: LucideIcon;
}

export interface ProcessStepperProps {
  title?: string;
  subtitle?: string;
  steps?: ProcessStep[];
  currentStepId?: string;
  onStepClick?: (stepId: string) => void;
  completedRecordsCount?: number;
  totalRecordsCount?: number;
  completedLabel?: string;
  className?: string;
}

export const ProcessStepper: React.FC<ProcessStepperProps> = ({
  title = 'Flujo de adquisiciones',
  subtitle = 'Distribución de registros a lo largo del ciclo de compra',
  steps = [
    { id: 'matriz', title: 'Matriz', count: 9, status: 'completed', icon: Layers },
    { id: 'seleccion', title: 'Selección', count: 5, status: 'completed', icon: CheckCircle2 },
    { id: 'presupuesto', title: 'Presupuesto', count: 0, status: 'active', icon: FileText },
    { id: 'bodega', title: 'Bodega', count: 0, status: 'inactive', icon: Boxes },
    { id: '3way', title: '3-Way Match', count: 10, status: 'completed', icon: FileCheck },
  ],
  currentStepId = '3way',
  onStepClick,
  completedRecordsCount = 10,
  totalRecordsCount = 24,
  completedLabel = 'registros completaron el 3-Way Match',
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {totalRecordsCount} registros
        </span>
      </div>

      <div className="relative flex items-center justify-between px-4 sm:px-12 my-6">
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 z-0" />

        {steps.map((step, index) => {
          const StepIcon = step.icon || Layers;
          const isCurrent = step.id === currentStepId;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active' || isCurrent;

          return (
            <div
              key={step.id || index}
              onClick={() => onStepClick && onStepClick(step.id)}
              className="relative z-10 flex flex-col items-center cursor-pointer group"
            >
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm relative
                  ${
                    isCompleted
                      ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                  }
                `}
              >
                <StepIcon size={18} />
                {step.count > 0 && (
                  <span
                    className={`
                      absolute -top-1.5 -right-1.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full text-white ring-2 ring-white
                      ${isCompleted ? 'bg-blue-600' : isActive ? 'bg-blue-700' : 'bg-slate-500'}
                    `}
                  >
                    {step.count}
                  </span>
                )}
              </div>

              <div className="mt-2.5 text-center">
                <p
                  className={`text-xs font-semibold ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {step.count || 0} reg.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 size={12} />
        </div>
        <span>
          <strong className="font-semibold text-slate-900">{completedRecordsCount}</strong> de{' '}
          <strong className="font-semibold text-slate-900">{totalRecordsCount}</strong> {completedLabel}
        </span>
      </div>
    </div>
  );
};

export interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showingText?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage = 1,
  totalPages = 4,
  onPageChange,
  showingText = 'Mostrando 1-6 registros',
  className = '',
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white text-xs ${className}`}>
      <div className="text-slate-500 font-medium">
        {showingText}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange && onPageChange(p)}
              className={`
                w-8 h-8 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200/60'}
              `}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export interface TableColumn<T = any> {
  header: string;
  accessorKey?: keyof T | string;
  align?: 'left' | 'center' | 'right';
  cell?: (props: { value: any; row: T }) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  columns?: TableColumn<T>[];
  data?: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyText?: string;
  paginationProps?: PaginationProps;
  className?: string;
}

export const DataTable = <T extends Record<string, any>>({
  columns = [],
  data = [],
  onRowClick,
  isLoading = false,
  emptyText = 'No hay registros disponibles',
  paginationProps,
  className = '',
}: DataTableProps<T>) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm text-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Cargando información...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-500 font-medium">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.cotIdCotizacion || row.id || rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    transition-colors duration-150
                    ${onRowClick ? 'hover:bg-slate-50/90 cursor-pointer' : 'hover:bg-slate-50/40'}
                  `}
                >
                  {columns.map((col, colIndex) => {
                    const value = col.accessorKey ? row[col.accessorKey] : undefined;
                    return (
                      <td
                        key={colIndex}
                        className={`px-5 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                      >
                        {col.cell ? col.cell({ value, row }) : value !== undefined && value !== null ? String(value) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {paginationProps && <Pagination {...paginationProps} />}
    </div>
  );
};
