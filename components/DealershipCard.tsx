
import React, { useState } from 'react';
import { Copy, Check, Hash, Link } from 'lucide-react';
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    // Fix: Parse YYYY-MM-DD explicitly to avoid timezone offset issues (e.g. showing previous day)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create local date (month is 0-indexed)
    return new Date(year, month - 1, day).toLocaleDateString('en-US');
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleCopyDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const lines = [
      `--- ${dealership.name.toUpperCase()} ---`,
      `CIF: ${dealership.cif_number || ''}`,
      `Group: ${groupName || 'Single'}`,
      `PPSysID: ${dealership.pp_sys_id || ''}`,
      `St/Br: ${dealership.store_number || ''}/${dealership.branch_number || ''}`
    ];
    
    copyToClipboard(lines.join('\n'), 'details');
  };

  const handleCopyPP = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(dealership.pp_sys_id || '', 'pp');
  };

  const handleCopyCombo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pp = dealership.pp_sys_id || '';
    const store = dealership.store_number || '';
    const branch = dealership.branch_number || '';
    copyToClipboard(`${pp}_${store}_${branch}`, 'combo');
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Top Row: CIF, CRM Provider and Copy Buttons */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
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
            
            {/* Copy Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleCopyDetails}
                className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                title="Copy Full Details"
              >
                {copiedField === 'details' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <button 
                onClick={handleCopyCombo}
                className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                title="Copy PP_Store_Branch"
              >
                {copiedField === 'combo' ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
              </button>
              <button 
                onClick={handleCopyPP}
                className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                title="Copy PP Sys ID"
              >
                {copiedField === 'pp' ? <Check size={14} className="text-emerald-500" /> : <Hash size={14} />}
              </button>
            </div>
          </div>

          {/* Middle Row: Name */}
          <h3 className="text-base font-extrabold text-slate-800 truncate mb-1.5 leading-tight group-hover:text-indigo-700 transition-colors">
            {dealership.name}
          </h3>

          {/* Hold Reason Display */}
          {dealership.status === DealershipStatus.HOLD && dealership.hold_reason && (
            <div className="mb-2 bg-orange-50 border border-orange-100 rounded px-2 py-1 text-[10px] text-orange-800 font-medium truncate">
               <span className="font-bold uppercase text-orange-400 mr-1">Hold:</span>
               {dealership.hold_reason}
            </div>
          )}

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

             {dealership.status === DealershipStatus.CANCELLED ? (
               <div className="flex items-center gap-1.5" title="Termination Date">
                 <span className="text-red-400 font-bold">TERM:</span>
                 <span className="text-slate-700">{formatDate(dealership.term_date)}</span>
               </div>
             ) : (
               <div className="flex items-center gap-1.5" title="Go-Live Date">
                 <span className="text-slate-400">LIVE:</span>
                 <span className="text-slate-700">{formatDate(dealership.go_live_date)}</span>
               </div>
             )}
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
