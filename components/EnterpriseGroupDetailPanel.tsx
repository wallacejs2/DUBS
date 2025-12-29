
import React from 'react';
import { X, Building2, MapPin, Users, Calendar } from 'lucide-react';
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br from-white to-slate-50 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <Users size={14} />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Group</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{group.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <Calendar size={12} />
              <span className="text-[10px]">Created {new Date(group.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/20">
          {/* Description & Stats */}
          <section className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {group.description || 'No description available for this group.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Associated Dealerships</p>
                <p className="text-sm font-bold text-indigo-700">{dealerships.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Active Percentage</p>
                <p className="text-sm font-bold text-emerald-700">
                  {dealerships.length > 0 
                    ? `${Math.round((dealerships.filter(d => d.status === DealershipStatus.LIVE).length / dealerships.length) * 100)}%` 
                    : '0%'}
                </p>
              </div>
            </div>
          </section>

          {/* Dealership List */}
          <section className="pb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Group Members</h4>
            </div>

            {dealerships.length === 0 ? (
              <div className="text-center py-10 px-6 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                <Building2 className="mx-auto text-slate-200 mb-2" size={24} />
                <p className="text-slate-400 text-[10px]">No dealerships are currently assigned to this group.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dealerships.map((dealer) => (
                  <div 
                    key={dealer.id} 
                    className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{dealer.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin size={10} className="text-slate-300" />
                          <span className="text-[9px] font-medium text-slate-400 truncate">{dealer.city}, {dealer.state}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${statusColors[dealer.status]}`}>
                        {dealer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseGroupDetailPanel;
