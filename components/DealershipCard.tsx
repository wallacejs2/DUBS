import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Dealership, DealershipStatus } from '../types';

interface DealershipCardProps {
  dealership: Dealership;
  onClick: () => void;
}

const statusColors: Record<DealershipStatus, string> = {
  [DealershipStatus.DMT_PENDING]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [DealershipStatus.DMT_APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [DealershipStatus.HOLD]: 'bg-orange-50 text-orange-700 border-orange-200',
  [DealershipStatus.ONBOARDING]: 'bg-blue-50 text-blue-700 border-blue-200',
  [DealershipStatus.LIVE]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [DealershipStatus.CANCELLED]: 'bg-slate-100 text-slate-700 border-slate-200',
};

const DealershipCard: React.FC<DealershipCardProps> = ({ dealership, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Main Info */}
        <div className="flex-1">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
              {dealership.name}
            </h3>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin size={12} />
              <span className="text-[11px] font-medium">{dealership.city}, {dealership.state}</span>
              <span className="mx-1.5 text-slate-200">|</span>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Purchased {new Date(dealership.purchase_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid - Horizontal on Desktop */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-10">
          <div className="min-w-[100px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">CRM Provider</p>
            <p className="text-xs font-bold text-slate-700">{dealership.crm_provider}</p>
          </div>
          
          <div className="min-w-[120px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Contract Value</p>
            <p className="text-sm font-extrabold text-indigo-600">${dealership.contract_value.toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm ${statusColors[dealership.status]}`}>
              {dealership.status}
            </span>
            
            <div className="p-2 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-sm transition-all duration-300">
              <ArrowRight size={16} className="transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipCard;