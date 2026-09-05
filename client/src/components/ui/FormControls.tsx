import React from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  icon?: LucideIcon;
  isReadOnly?: boolean;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  required = false,
  error,
  icon: Icon,
  isReadOnly = false,
  placeholder = '',
  value,
  onChange,
  type = 'text',
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-0.5" title="Campo requerido">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center justify-center">
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          placeholder={placeholder}
          className={`
            w-full h-10 px-3 text-sm rounded-lg border transition-all duration-150 outline-none
            ${Icon ? 'pl-9' : 'pl-3'}
            ${isReadOnly 
              ? 'bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed font-medium select-all' 
              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100 text-red-900' : ''}
          `}
          {...props}
        />
      </div>

      {error && (
        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </div>
  );
};

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  error?: string;
  icon?: LucideIcon;
  options?: SelectOption[];
  isReadOnly?: boolean;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  required = false,
  error,
  icon: Icon,
  options = [],
  isReadOnly = false,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-0.5" title="Campo requerido">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center justify-center">
            <Icon size={16} />
          </div>
        )}

        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          className={`
            w-full h-10 px-3 text-sm rounded-lg border appearance-none transition-all duration-150 outline-none pr-9
            ${Icon ? 'pl-9' : 'pl-3'}
            ${isReadOnly 
              ? 'bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed font-medium' 
              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100 text-red-900' : ''}
          `}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 pointer-events-none text-slate-400 flex items-center justify-center">
          <ChevronDown size={16} />
        </div>
      </div>

      {error && (
        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </div>
  );
};

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
  isReadOnly?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  helperText?: string;
  className?: string;
  id?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  required = false,
  error,
  isReadOnly = false,
  placeholder = '',
  value,
  onChange,
  helperText,
  className = '',
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || (label ? `txt-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-slate-700 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-0.5" title="Campo requerido">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        readOnly={isReadOnly}
        disabled={isReadOnly}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-3 py-2 text-sm rounded-lg border transition-all duration-150 outline-none resize-y
          ${isReadOnly 
            ? 'bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed font-medium' 
            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'}
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100 text-red-900' : ''}
        `}
        {...props}
      />

      {error && (
        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </div>
  );
};

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  helperText,
  checked = false,
  onChange,
  disabled = false,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || (label ? `chk-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex items-start gap-2.5 select-none ${className}`}>
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-2 disabled:opacity-50 cursor-pointer"
        {...props}
      />
      {label && (
        <div className="flex flex-col">
          <label htmlFor={checkboxId} className="text-xs font-semibold text-slate-800 cursor-pointer">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {helperText && <span className="text-[11px] text-slate-400 mt-0.5">{helperText}</span>}
        </div>
      )}
    </div>
  );
};
