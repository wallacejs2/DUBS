
import React, { useState, useMemo } from 'react';
import { Plus, User, Mail, Phone, Search, Trash2, Edit3 } from 'lucide-react';
import { useShoppers } from '../hooks';
import { Shopper, ShopperStatus, ShopperPriority } from '../types';
import FilterBar from '../components/FilterBar';
import ShopperDetailPanel from '../components/ShopperDetailPanel';

const QAPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const { shoppers, loading, upsert, remove } = useShoppers(filters);
  
  const [selectedShopperId, setSelectedShopperId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  const activeShopper = useMemo(() => {
    if (isCreating) {
      return {
        first_name: '',
        last_name: '',
        email: '',
        status: ShopperStatus.ACTIVE,
        priority: ShopperPriority.MEDIUM,
        username: '',
        password: '',
        phone: '',
        device_type: '',
        browser: '',
      } as Partial<Shopper>;
    }
    if (selectedShopperId) {
      return shoppers.find(s => s.id === selectedShopperId);
    }
    return null;
  }, [isCreating, selectedShopperId, shoppers]);

  const priorityColors: Record<ShopperPriority, string> = {
    [ShopperPriority.HIGH]: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    [ShopperPriority.MEDIUM]: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    [ShopperPriority.LOW]: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  };

  const statusColors: Record<ShopperStatus, string> = {
    [ShopperStatus.ACTIVE]: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    [ShopperStatus.TESTING]: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    [ShopperStatus.REVIEW]: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    [ShopperStatus.RESOLVED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };

  const handleRowClick = (id: string) => {
    setSelectedShopperId(id);
    setIsCreating(false);
  };

  const handleCopyEmail = (e: React.MouseEvent, id: string, email: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 1500);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">QA Shoppers</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage testers and audit accounts for system verification.</p>
        </div>
        <button 
          onClick={() => { setSelectedShopperId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={16} /> New Shopper
        </button>
      </div>

      <FilterBar 
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({...filters, search: v})}
        filters={[
          {
            label: 'Status',
            value: filters.status,
            onChange: (v) => setFilters({...filters, status: v}),
            options: Object.values(ShopperStatus).map(s => ({ label: s, value: s }))
          },
          {
            label: 'Priority',
            value: filters.priority,
            onChange: (v) => setFilters({...filters, priority: v}),
            options: Object.values(ShopperPriority).map(p => ({ label: p, value: p }))
          }
        ]}
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      ) : shoppers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <User size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Shoppers Registered</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Begin by adding your first quality assurance tester to the system.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tester</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact Details</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shoppers.map(shopper => (
                <tr 
                  key={shopper.id} 
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                  onClick={() => handleRowClick(shopper.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
                        {shopper.first_name.charAt(0)}{shopper.last_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex flex-col items-start gap-1">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">{shopper.first_name} {shopper.last_name}</p>
                        {shopper.issue && (
                            <div className="text-[10px] text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 px-1.5 py-0.5 rounded-md font-medium whitespace-normal break-words max-w-sm" title={shopper.issue}>
                                {shopper.issue}
                            </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-6">
                      <div 
                        className="flex items-center gap-1.5 min-w-0 cursor-pointer group/email"
                        onClick={(e) => handleCopyEmail(e, shopper.id, shopper.email)}
                        title="Click to copy email"
                      >
                        <Mail size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0 group-hover/email:text-indigo-500 transition-colors" />
                        <span className={`text-[11px] truncate transition-colors ${copiedEmailId === shopper.id ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400 group-hover/email:text-indigo-600 dark:group-hover/email:text-indigo-400'}`}>
                          {copiedEmailId === shopper.id ? 'Copied!' : shopper.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">{shopper.phone || '---'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${statusColors[shopper.status]}`}>
                        {shopper.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRowClick(shopper.id); }}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete shopper?')) remove(shopper.id); }}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeShopper && (
        <ShopperDetailPanel 
          shopper={activeShopper}
          onClose={() => { setSelectedShopperId(null); setIsCreating(false); }}
          onUpdate={(data) => upsert(data)}
          onDelete={() => {
            if (activeShopper.id && window.confirm('Are you sure you want to delete this shopper?')) {
              remove(activeShopper.id);
              setSelectedShopperId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default QAPage;
