import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { EnterpriseGroup, Dealership, DealershipStatus } from '../types';

interface EnterpriseGroupDetailPanelProps {
  group: EnterpriseGroup;
  dealerships: Dealership[];
  onClose: () => void;
  onViewDealer: (id: string) => void;
}

const statusColors: Record<DealershipStatus, string> = {
  [DealershipStatus.DMT_PENDING]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [DealershipStatus.DMT_APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [DealershipStatus.HOLD]: 'bg-orange-50 text-orange-700 border-orange-200',
  [DealershipStatus.ONBOARDING]: 'bg-blue-50 text-blue-700 border-blue-200',
  [DealershipStatus.LIVE]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [DealershipStatus.CANCELLED]: 'bg-slate-100 text-slate-600 border-slate-200',
};

const EnterpriseGroupDetailPanel: React.FC<EnterpriseGroupDetailPanelProps> = ({ 
  group, 
  dealerships, 
  onClose,
  onViewDealer
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-none">
                GROUP HIERARCHY
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tighter">GRP_{group.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{group.name}</h2>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-none transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <section className="mb-12">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-6">
                CORPORATE PROFILE
             </h3>
             <div className="mb-10">
                <p className="text-[12px] text-slate-700 font-medium leading-relaxed italic">
                  {group.description || 'No descriptive information available for this corporate hierarchy.'}
                </p>
             </div>
             
             <div className="grid grid-cols-2 gap-16">
               <div>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Asset Inventory</p>
                 <p className="text-2xl font-bold text-slate-900 tracking-tighter">{dealerships.length} Units</p>
               </div>
               <div>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Portfolio Health</p>
                 <p className="text-2xl font-bold text-indigo-600 tracking-tighter">
                    {dealerships.length > 0 
                      ? `${Math.round((dealerships.filter(d => d.status === DealershipStatus.LIVE).length / dealerships.length) * 100)}% ACTIVE` 
                      : '0% ACTIVE'}
                 </p>
               </div>
             </div>
          </section>

          <section className="pb-16">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-6">
                ASSOCIATED LEDGER ENTITIES
            </h3>

            {dealerships.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 border border-slate-100 border-dashed">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">Zero Entities Assigned</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {dealerships.map((dealer) => (
                  <div 
                    key={dealer.id} 
                    className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => onViewDealer(dealer.id)}
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-900 truncate tracking-tight">{dealer.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{dealer.city}, {dealer.state}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none bg-slate-100 text-slate-600`}>
                        {dealer.status}
                      </span>
                      <ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">System Timestamp: {new Date(group.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseGroupDetailPanel;