
import React from 'react';
import { Filter, Search, Hash, X, ChevronDown } from 'lucide-react';
import { DealershipFilterState, DealershipStatus } from '../types';
import { useEnterpriseGroups } from '../hooks';

interface DealershipSidebarFiltersProps {
  filters: DealershipFilterState;
  setFilters: React.Dispatch<React.SetStateAction<DealershipFilterState>>;
  isOpen: boolean;
}

const DealershipSidebarFilters: React.FC<DealershipSidebarFiltersProps> = ({ filters, setFilters, isOpen }) => {
  const { groups } = useEnterpriseGroups();

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', group: '', issue: '', managed: '', addl_web: '', cif: '', sms: '' });
  };

  const hasActiveFilters = !!(filters.search || filters.cif || filters.status || filters.group || filters.issue || filters.managed || filters.addl_web || filters.sms);

  if (!isOpen) return null;

  return (
    <div className="px-4 pb-4 animate-in fade-in duration-300">
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
            <Filter size={12} />
            <span>Filters</span>
          </div>
          {hasActiveFilters && (
            <button 
              onClick={handleResetFilters}
              className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider"
            >
              Reset
            </button>
          )}
        </div>
        
        <div className="space-y-3">
            {/* Search Inputs */}
            <div className="space-y-2">
                <div className="relative">
                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={12} />
                    <input 
                        value={filters.cif}
                        onChange={(e) => setFilters({...filters, cif: e.target.value})}
                        placeholder="CIF..."
                        className="w-full pl-8 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                      {filters.cif && (
                        <button onClick={() => setFilters({...filters, cif: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <X size={10} />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={12} />
                    <input 
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        placeholder="Search name..."
                        className="w-full pl-8 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                      {filters.search && (
                        <button onClick={() => setFilters({...filters, search: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdowns */}
            <div className="space-y-2">
                <div className="relative">
                    <select 
                        value={filters.status} 
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full pl-2 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs appearance-none focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        {Object.values(DealershipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={12} />
                </div>

                <div className="relative">
                    <select 
                        value={filters.group} 
                        onChange={(e) => setFilters({...filters, group: e.target.value})}
                        className="w-full pl-2 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs appearance-none focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        <option value="">All Groups</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={12} />
                </div>

                <div className="relative">
                    <select 
                        value={filters.issue} 
                        onChange={(e) => setFilters({...filters, issue: e.target.value})}
                        className="w-full pl-2 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs appearance-none focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        <option value="">No Issues</option>
                        <option value="no_id">Missing Client ID</option>
                        <option value="zero_price">$0 Product Price</option>
                        <option value="no_csm">Missing CSM</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={12} />
                </div>
            </div>

            {/* Toggles */}
              <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                    <input 
                        type="checkbox" 
                        checked={filters.managed === 'yes'}
                        onChange={(e) => setFilters({...filters, managed: e.target.checked ? 'yes' : ''})}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Managed Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                    <input 
                        type="checkbox" 
                        checked={filters.addl_web === 'yes'}
                        onChange={(e) => setFilters({...filters, addl_web: e.target.checked ? 'yes' : ''})}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Addl. Web Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                    <input 
                        type="checkbox" 
                        checked={filters.sms === 'yes'}
                        onChange={(e) => setFilters({...filters, sms: e.target.checked ? 'yes' : ''})}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">SMS Activated</span>
                  </label>
              </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipSidebarFilters;
