

import React from 'react';
import { Dealership, DealershipStatus } from '../types';

interface DealershipCardProps {
  dealership: Dealership;
  groupName?: string;
  isManaged?: boolean;
  onClick: () => void;
}

const statusColors: Record<DealershipStatus, string> = {
  [DealershipStatus.DMT_PENDING]: 'bg-slate-100 text-slate-600 border-slate-200',
  [DealershipStatus.DMT_APPROVED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [DealershipStatus.HOLD]: 'bg-orange-50 text-orange-700 border-orange-200',
  [DealershipStatus.ONBOARDING]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [DealershipStatus.LIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [DealershipStatus.LEGACY]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [DealershipStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200',
};

const DealershipCard: React.FC<DealershipCardProps> = ({ dealership, groupName, isManaged, onClick }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Top Row: CIF and CRM Provider */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {dealership.cif_number || 'NO CIF'}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {dealership.crm_provider}
            </span>
            {isManaged && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Managed
              </span>
            )}
          </div>

          {/* Middle Row: Name */}
          <h3 className="text-base font-extrabold text-slate-800 truncate mb-1.5 leading-tight group-hover:text-indigo-700 transition-colors">
            {dealership.name}
          </h3>

          {/* Bottom Row: Group, Store/Branch, IDs, Date */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] text-slate-500 font-medium">
             <div className="flex items-center gap-1.5" title="Enterprise Group">
               <span className="text-slate-400">GRP:</span>
               <span className="text-slate-700 font-semibold truncate max-w-[150px]">{groupName || 'Independent'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 hidden sm:block"></div>
             
             <div className="flex items-center gap-1.5" title="Store / Branch">
               <span className="text-slate-400">S/B:</span>
               <span className="font-mono text-slate-700">{dealership.store_number || '-'}/{dealership.branch_number || '-'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 hidden sm:block"></div>

             <div className="flex items-center gap-1.5" title="PP Sys ID">
               <span className="text-slate-400">PP:</span>
               <span className="font-mono text-slate-700">{dealership.pp_sys_id || '-'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 hidden sm:block"></div>

             <div className="flex items-center gap-1.5" title="ERA ID">
               <span className="text-slate-400">ERA:</span>
               <span className="font-mono text-slate-700">{dealership.era_system_id || '-'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 hidden sm:block"></div>

             <div className="flex items-center gap-1.5" title="Go-Live Date">
               <span className="text-slate-400">LIVE:</span>
               <span className="text-slate-700">{formatDate(dealership.go_live_date)}</span>
             </div>
          </div>
        </div>

        {/* Right Side: Status */}
        <div className="flex-shrink-0 pl-4 border-l border-slate-100">
           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[dealership.status]}`}>
              {dealership.status}
           </span>
        </div>
      </div>
    </div>
  );
};

export default DealershipCard;