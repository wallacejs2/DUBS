
import React from 'react';
import { Filter, Search, X, ChevronDown } from 'lucide-react';
import { NewFeatureFilterState } from '../types';

interface NewFeaturesSidebarFiltersProps {
  filters: NewFeatureFilterState;
  setFilters: React.Dispatch<React.SetStateAction<NewFeatureFilterState>>;
}

const NewFeaturesSidebarFilters: React.FC<NewFeaturesSidebarFiltersProps> = ({ filters, setFilters }) => {

  const handleResetFilters = () => {
    setFilters({ search: '', source: '', type: '', quarter: '', year: '', status: '', platform: '' });
  };

  const hasActiveFilters = !!(filters.search || filters.source || filters.type || filters.quarter || filters.year || filters.status || filters.platform);

  return (
    <div className="px-3 py-4 mt-2 border-t border-white/10 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
          <Filter size={10} />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Search Input */}
        <div className="space-y-2">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={12} />
            <input
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Search features..."
              className="w-full pl-8 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            {filters.search && (
              <button onClick={() => setFilters({...filters, search: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="space-y-2">
          <div className="relative">
            <select
              value={filters.source}
              onChange={(e) => setFilters({...filters, source: e.target.value})}
              className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="Fullpath">Fullpath</option>
              <option value="Reynolds">Reynolds</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="New">New</option>
              <option value="Updated">Updated</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={filters.quarter}
              onChange={(e) => setFilters({...filters, quarter: e.target.value})}
              className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Quarters</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
              className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Launched">Launched</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
          </div>

          <div className="relative">
            <select
              value={filters.platform}
              onChange={(e) => setFilters({...filters, platform: e.target.value})}
              className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Platforms</option>
              <option value="UCP">UCP</option>
              <option value="Curator">Curator</option>
              <option value="FOCUS">FOCUS</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewFeaturesSidebarFilters;
