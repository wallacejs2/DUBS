import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (val: string) => void;
  }[];
  onClear?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  searchPlaceholder = "Search...", 
  searchValue, 
  onSearchChange, 
  filters = [],
  onClear 
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-normal"
        />
        {searchValue && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 w-full lg:w-auto">
        {filters.map((filter, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{filter.label}</span>
            <select 
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="bg-transparent text-sm font-normal text-slate-700 outline-none cursor-pointer py-2 pr-2"
            >
              <option value="">All</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
        {onClear && (
          <button 
            onClick={onClear}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 font-medium"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;