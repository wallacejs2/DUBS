
import React from 'react';
import { Filter, Search, Hash, X, ChevronDown } from 'lucide-react';
import { DealershipFilterState, DealershipStatus } from '../types';
import { useEnterpriseGroups } from '../hooks';
import { OEM_MAKES } from '../lib/oem';

interface DealershipSidebarFiltersProps {
  filters: DealershipFilterState;
  setFilters: React.Dispatch<React.SetStateAction<DealershipFilterState>>;
}

const DealershipSidebarFilters: React.FC<DealershipSidebarFiltersProps> = ({ filters, setFilters }) => {
  const { groups } = useEnterpriseGroups();

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', group: '', issue: '', oem: '', managed: '', addl_web: '', cif: '', client_id: '', order_id: '', sms: '', one_time: '', received_month: '', onboarding_month: '', go_live_month: '', term_month: '' });
  };

  const hasActiveFilters = !!(filters.search || filters.cif || filters.client_id || filters.order_id || filters.status || filters.group || filters.issue || filters.oem || filters.managed || filters.addl_web || filters.sms || filters.one_time || filters.received_month || filters.onboarding_month || filters.go_live_month || filters.term_month);

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
      
      {/* Dashboard lifecycle month filter indicator */}
      {(filters.received_month || filters.onboarding_month || filters.go_live_month || filters.term_month) && (
        <div className="mb-3 px-2 py-1.5 bg-cyan-900/40 border border-cyan-700/50 rounded-lg flex items-center justify-between gap-2">
          <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider leading-snug">
            {filters.received_month && `Received: ${filters.received_month}`}
            {filters.onboarding_month && `Onboarding: ${filters.onboarding_month}`}
            {filters.go_live_month && `Go-Live: ${filters.go_live_month}`}
            {filters.term_month && `Termed: ${filters.term_month}`}
          </span>
          <button
            onClick={() => setFilters({ ...filters, received_month: '', onboarding_month: '', go_live_month: '', term_month: '' })}
            className="text-cyan-400 hover:text-cyan-200 flex-shrink-0"
          >
            <X size={10} />
          </button>
        </div>
      )}

      <div className="space-y-3">
          {/* Search Inputs */}
          <div className="space-y-2">
              <div className="relative group">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={12} />
                  <input 
                      value={filters.cif}
                      onChange={(e) => setFilters({...filters, cif: e.target.value})}
                      placeholder="CIF Number"
                      className="w-full pl-8 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                    {filters.cif && (
                      <button onClick={() => setFilters({...filters, cif: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          <X size={10} />
                      </button>
                  )}
              </div>

              <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={12} />
                  <input 
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      placeholder="Search Name..."
                      className="w-full pl-8 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                    {filters.search && (
                      <button onClick={() => setFilters({...filters, search: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          <X size={10} />
                      </button>
                  )}
              </div>

              <div className="relative group">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={12} />
                  <input
                      value={filters.client_id}
                      onChange={(e) => setFilters({...filters, client_id: e.target.value})}
                      placeholder="40NM"
                      className="w-full pl-8 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  {filters.client_id && (
                    <button onClick={() => setFilters({...filters, client_id: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        <X size={10} />
                    </button>
                  )}
              </div>

              <div className="relative group">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={12} />
                  <input
                      value={filters.order_id}
                      onChange={(e) => setFilters({...filters, order_id: e.target.value})}
                      placeholder="DMT Order ID"
                      className="w-full pl-8 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  {filters.order_id && (
                    <button onClick={() => setFilters({...filters, order_id: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
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
                      className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                      <option value="">All Statuses</option>
                      {Object.values(DealershipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
              </div>

              <div className="relative">
                  <select 
                      value={filters.group} 
                      onChange={(e) => setFilters({...filters, group: e.target.value})}
                      className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                      <option value="">All Groups</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
              </div>

              <div className="relative">
                  <select 
                      value={filters.issue} 
                      onChange={(e) => setFilters({...filters, issue: e.target.value})}
                      className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                      <option value="">No Issues</option>
                      <option value="no_id">Missing 40NM</option>
                      <option value="zero_price">$0 Product Price</option>
                      <option value="no_csm">Missing CSM</option>
                      <option value="no_enrollment">Missing Enrollment</option>
                      <option value="no_poc">Missing POC Email</option>
                      <option value="no_web_provider">Missing Web Provider</option>
                      <option value="no_inv_provider">Missing Inv. Provider</option>
                      <option value="no_oem">Missing OEM</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
              </div>

              <div className="relative">
                  <select 
                      value={filters.oem} 
                      onChange={(e) => setFilters({...filters, oem: e.target.value})}
                      title="Filter by Make"
                      className="w-full pl-2 pr-6 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-slate-300 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                      <option value="">All OEMs</option>
                      {OEM_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
              </div>
          </div>

          {/* Toggles */}
            <div className="space-y-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg transition-colors group">
                  <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${filters.managed === 'yes' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-transparent'}`}>
                      {filters.managed === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <input 
                      type="checkbox" 
                      checked={filters.managed === 'yes'}
                      onChange={(e) => setFilters({...filters, managed: e.target.checked ? 'yes' : ''})}
                      className="hidden"
                  />
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Managed Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg transition-colors group">
                  <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${filters.addl_web === 'yes' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-transparent'}`}>
                      {filters.addl_web === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <input 
                      type="checkbox" 
                      checked={filters.addl_web === 'yes'}
                      onChange={(e) => setFilters({...filters, addl_web: e.target.checked ? 'yes' : ''})}
                      className="hidden"
                  />
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Addl. Web Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg transition-colors group">
                  <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${filters.sms === 'yes' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-transparent'}`}>
                      {filters.sms === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <input 
                      type="checkbox" 
                      checked={filters.sms === 'yes'}
                      onChange={(e) => setFilters({...filters, sms: e.target.checked ? 'yes' : ''})}
                      className="hidden"
                  />
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">SMS Activated</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg transition-colors group">
                  <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${filters.one_time === 'yes' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-transparent'}`}>
                      {filters.one_time === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <input 
                      type="checkbox" 
                      checked={filters.one_time === 'yes'}
                      onChange={(e) => setFilters({...filters, one_time: e.target.checked ? 'yes' : ''})}
                      className="hidden"
                  />
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">One-Time Fees</span>
                </label>
            </div>
      </div>
    </div>
  );
};

export default DealershipSidebarFilters;
