
import React, { useState } from 'react';
import { Eye, EyeOff, Check, AlertCircle, ChevronDown } from 'lucide-react';

interface BaseInputProps {
  label: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

interface FloatingInputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel';
}

interface FloatingTextAreaProps extends BaseInputProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  maxLength?: number;
}

interface FloatingSelectProps extends BaseInputProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  options: { label: string; value: string }[];
}

const baseContainerClasses = "relative group";
const baseInputClasses = `
  peer w-full h-14 px-4 pt-4 pb-1
  bg-slate-100/50 dark:bg-[#2C2C2E]
  border rounded-xl outline-none transition-all duration-200 ease-in-out
  font-medium text-sm text-slate-900 dark:text-white placeholder-transparent
  disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-[#1C1C1E]
`;

const baseLabelClasses = `
  absolute left-4 top-1/2 -translate-y-1/2
  text-slate-500 dark:text-slate-400 pointer-events-none
  transition-all duration-200 ease-in-out
  peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm
  peer-focus:top-3 peer-focus:text-xs peer-focus:text-blue-500
  peer-focus:translate-y-0
  peer-not-placeholder-shown:top-3 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:translate-y-0
`;

const getBorderColor = (error?: string, success?: boolean, focused?: boolean) => {
  if (error) return 'border-red-500 dark:border-red-500';
  if (success) return 'border-emerald-500 dark:border-emerald-500';
  return 'border-slate-200/60 dark:border-[#38383A] focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-600';
};

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label, error, success, helperText, className = "", type = "text", required, disabled, ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`${baseContainerClasses} ${className}`}>
      <div className="relative">
        <input
          type={inputType}
          disabled={disabled}
          placeholder=" "
          className={`
            ${baseInputClasses}
            ${getBorderColor(error, success)}
            ${isPassword ? 'pr-12' : ''}
          `}
          {...props}
        />
        <label className={baseLabelClasses}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>

        {/* Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-slate-400">
          {success && !error && <Check size={18} className="text-emerald-500" />}
          {error && <AlertCircle size={18} className="text-red-500" />}
        </div>

        {/* Password Toggle */}
        {isPassword && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer z-10"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Helper / Error Text */}
      {(helperText || error) && (
        <div className={`mt-1 text-xs font-medium ml-1 ${error ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export const FloatingTextArea: React.FC<FloatingTextAreaProps> = ({
  label, error, success, helperText, className = "", maxLength, value, ...props
}) => {
  const [charCount, setCharCount] = useState((value as string)?.length || 0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    if (props.onChange) props.onChange(e);
  };

  return (
    <div className={`${baseContainerClasses} ${className}`}>
      <div className="relative">
        <textarea
          placeholder=" "
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          className={`
            ${baseInputClasses}
            h-auto min-h-[120px] resize-y
            ${getBorderColor(error, success)}
          `}
          {...props}
        />
        <label className={`
          absolute left-4 top-4
          text-slate-500 dark:text-slate-400 pointer-events-none
          transition-all duration-200 ease-in-out
          peer-placeholder-shown:text-sm
          peer-focus:top-3 peer-focus:text-xs peer-focus:text-blue-500
          peer-not-placeholder-shown:top-3 peer-not-placeholder-shown:text-xs
        `}>
          {label} {props.required && <span className="text-red-400">*</span>}
        </label>
      </div>

      <div className="flex justify-between items-start mt-1 px-1">
        <span className={`text-xs font-medium ${error ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
          {error || helperText}
        </span>
        {maxLength && (
          <span className={`text-xs font-mono ${charCount >= maxLength ? 'text-red-500' : 'text-slate-500'}`}>
            {charCount} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label, error, success, helperText, className = "", options, value, ...props
}) => {
  const hasValue = value !== "" && value !== undefined && value !== null;

  return (
    <div className={`${baseContainerClasses} ${className}`}>
      <div className="relative">
        <select
          value={value}
          className={`
            ${baseInputClasses}
            appearance-none cursor-pointer
            ${getBorderColor(error, success)}
            ${!hasValue ? 'text-transparent' : ''}
          `}
          {...props}
        >
          <option value="" disabled hidden></option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-900 dark:text-white bg-white dark:bg-[#2C2C2E]">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Arrow */}
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />

        <label className={`
          absolute left-4 top-1/2 -translate-y-1/2
          text-slate-500 dark:text-slate-400 pointer-events-none
          transition-all duration-200 ease-in-out
          ${hasValue
            ? 'top-3 text-xs translate-y-0'
            : 'peer-focus:top-3 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:translate-y-0'
          }
        `}>
          {label} {props.required && <span className="text-red-400">*</span>}
        </label>
      </div>

      {(helperText || error) && (
        <div className={`mt-1 text-xs font-medium ml-1 ${error ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};
