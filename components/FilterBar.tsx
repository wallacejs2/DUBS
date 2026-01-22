
import React from 'react';
import { Search, Filter, X, Hash } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  secondarySearchValue?: string;
  onSecondarySearchChange?: (val: string) => void;
  secondarySearchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (val: string) => void;
  }[];
  onClear?: () => void;
  layout?: 'inline' | 'stacked';
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  searchPlaceholder = "Search...", 
  searchValue, 
  onSearchChange, 
  secondarySearchValue,
  onSecondarySearchChange,
  secondarySearchPlaceholder = "Secondary Search...",
  filters = [],
  onClear,
  layout = 'inline'
}) => {
  return (
    <div className={`flex flex-col gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors ${
      layout === 'stacked' ? 'items-start' : 'lg:flex-row lg:items-center'
    }`}>
      <div className={`flex flex-col sm:flex-row gap-4 w-full ${layout === 'stacked' || !onSecondarySearchChange ? 'flex-1' : 'lg:flex-1'}`}>
        
        {onSecondarySearchChange && (
          <div className="relative w-full sm:w-48 xl:w-64">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input 
              type="text" 
              value={secondarySearchValue || ''}
              onChange={(e) => onSecondarySearchChange(e.target.value)}
              placeholder={secondarySearchPlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
            {secondarySearchValue && (
              <button 
                onClick={() => onSecondarySearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          {searchValue && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>

      </div>

      <div className={`flex flex-wrap gap-3 w-full ${layout === 'stacked' ? '' : 'lg:w-auto'}`}>
        {filters.map((filter, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{filter.label}</span>
            <select 
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="bg-transparent text-sm font-normal text-slate-700 dark:text-slate-200 outline-none cursor-pointer py-2 pr-2"
            >
              <option value="" className="bg-white dark:bg-slate-800">All</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800">{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
        {onClear && (
          <button 
            onClick={onClear}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
