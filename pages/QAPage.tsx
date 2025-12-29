
import React, { useState } from 'react';
import { Plus, User, Mail, Copy, Check, Search, Trash2, Edit3, X } from 'lucide-react';
import { useShoppers } from '../hooks';
import { Shopper, ShopperStatus, ShopperPriority } from '../types';
import FilterBar from '../components/FilterBar';

const QAPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const { shoppers, loading, upsert, remove } = useShoppers(filters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedShopper, setSelectedShopper] = useState<Shopper | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const priorityColors: Record<ShopperPriority, string> = {
    [ShopperPriority.HIGH]: 'bg-rose-50 text-rose-600 border-rose-100',
    [ShopperPriority.MEDIUM]: 'bg-amber-50 text-amber-600 border-amber-100',
    [ShopperPriority.LOW]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  const statusColors: Record<ShopperStatus, string> = {
    [ShopperStatus.ACTIVE]: 'bg-indigo-50 text-indigo-700',
    [ShopperStatus.TESTING]: 'bg-blue-50 text-blue-700',
    [ShopperStatus.COMPLETED]: 'bg-emerald-50 text-emerald-700',
    [ShopperStatus.BLOCKED]: 'bg-slate-100 text-slate-500',
    [ShopperStatus.ISSUES]: 'bg-rose-50 text-rose-700',
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">QA Shoppers</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage testers and audit accounts for system verification.</p>
        </div>
        <button 
          onClick={() => { setSelectedShopper(null); setIsFormOpen(true); }}
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
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse"></div>)}
        </div>
      ) : shoppers.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <User size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Shoppers Registered</h3>
          <p className="text-xs text-slate-500 mt-1">Begin by adding your first quality assurance tester to the system.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tester Info</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Credentials</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shoppers.map(shopper => (
                <tr key={shopper.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
                        {shopper.first_name.charAt(0)}{shopper.last_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{shopper.first_name} {shopper.last_name}</p>
                        <p className="text-[10px] text-slate-400 truncate font-normal">{shopper.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 group/copy cursor-pointer" onClick={() => handleCopy(shopper.username || '', `u-${shopper.id}`)}>
                        <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-normal">{shopper.username || '---'}</span>
                        {copiedId === `u-${shopper.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-slate-300 opacity-0 group-hover/copy:opacity-100" />}
                      </div>
                      <div className="flex items-center gap-1.5 group/copy cursor-pointer" onClick={() => handleCopy(shopper.password || '', `p-${shopper.id}`)}>
                        <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-normal">••••••••</span>
                        {copiedId === `p-${shopper.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-slate-300 opacity-0 group-hover/copy:opacity-100" />}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${statusColors[shopper.status]}`}>
                        {shopper.status}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${priorityColors[shopper.priority]}`}>
                        {shopper.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => { setSelectedShopper(shopper); setIsFormOpen(true); }}
                        className="p-1.5 text-slate-300 hover:text-indigo-600 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => window.confirm('Delete shopper?') && remove(shopper.id)}
                        className="p-1.5 text-slate-300 hover:text-red-600 transition-all"
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
               <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedShopper ? 'Edit Shopper' : 'New QA Shopper'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tester credentials and audit configuration.</p>
               </div>
               <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={18} /></button>
             </div>
             
             <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const data = {
                  ...selectedShopper,
                  first_name: fd.get('first_name') as string,
                  last_name: fd.get('last_name') as string,
                  email: fd.get('email') as string,
                  status: fd.get('status') as ShopperStatus,
                  priority: fd.get('priority') as ShopperPriority,
                  username: fd.get('username') as string,
                  password: fd.get('password') as string,
                };
                upsert(data);
                setIsFormOpen(false);
              }}
              className="space-y-6"
             >
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                   <input required name="first_name" defaultValue={selectedShopper?.first_name} className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                   <input required name="last_name" defaultValue={selectedShopper?.last_name} className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal" />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                 <input required type="email" name="email" defaultValue={selectedShopper?.email} className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Login Username</label>
                   <input name="username" defaultValue={selectedShopper?.username} className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Login Password</label>
                   <input name="password" defaultValue={selectedShopper?.password} className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Status</label>
                   <select name="status" defaultValue={selectedShopper?.status || ShopperStatus.ACTIVE} className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal">
                     {Object.values(ShopperStatus).map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Audit Priority</label>
                   <select name="priority" defaultValue={selectedShopper?.priority || ShopperPriority.MEDIUM} className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal">
                     {Object.values(ShopperPriority).map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                 </div>
               </div>

               <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2 text-slate-400 font-bold text-[11px]">Discard</button>
                 <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md shadow-indigo-100 text-[11px]">Save Tester</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAPage;
