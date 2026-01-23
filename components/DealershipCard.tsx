
import React, { useState } from 'react';
import { Copy, Check, Hash, Link, Star } from 'lucide-react';
import { Dealership, DealershipStatus } from '../types';

interface DealershipCardProps {
  dealership: Dealership;
  groupName?: string;
  isManaged?: boolean;
  hasClientId?: boolean;
  hasAddlWeb?: boolean;
  hasZeroPrice?: boolean;
  missingCSM?: boolean;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const statusColors: Record<DealershipStatus, string> = {
  [DealershipStatus.DMT_PENDING]: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  [DealershipStatus.DMT_APPROVED]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [DealershipStatus.HOLD]: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [DealershipStatus.ONBOARDING]: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  [DealershipStatus.LIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  [DealershipStatus.LEGACY]: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  [DealershipStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

const DealershipCard: React.FC<DealershipCardProps> = ({ 
  dealership, groupName, isManaged, hasClientId = true, hasAddlWeb, hasZeroPrice, missingCSM,
  onClick, onToggleFavorite 
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
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
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 cursor-pointer overflow-hidden relative"
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Top Row: CIF, CRM Provider and Copy Buttons */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {dealership.cif_number || 'NO CIF'}
              </span>
              
              {!hasClientId && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  NO ID
                </span>
              )}

              {hasZeroPrice && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  $0
                </span>
              )}

              {missingCSM && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  NO CSM
                </span>
              )}

              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {dealership.crm_provider}
              </span>
              {isManaged && (
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Managed
                </span>
              )}
              {hasAddlWeb && (
                <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  ADDL. WEB
                </span>
              )}
              {dealership.sms_activated && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  SMS
                </span>
              )}
            </div>
            
            {/* Copy Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleCopyDetails}
                className="p-1 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded transition-all"
                title="Copy Full Details"
              >
                {copiedField === 'details' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <button 
                onClick={handleCopyCombo}
                className="p-1 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded transition-all"
                title="Copy PP_Store_Branch"
              >
                {copiedField === 'combo' ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
              </button>
              <button 
                onClick={handleCopyPP}
                className="p-1 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded transition-all"
                title="Copy PP Sys ID"
              >
                {copiedField === 'pp' ? <Check size={14} className="text-emerald-500" /> : <Hash size={14} />}
              </button>
            </div>
          </div>

          {/* Middle Row: Name and Favorite */}
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   onToggleFavorite(e);
                }}
                className={`transition-colors ${dealership.is_favorite ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}
                title={dealership.is_favorite ? "Unfavorite" : "Mark as Favorite"}
              >
                 <Star size={16} fill={dealership.is_favorite ? "currentColor" : "none"} />
              </button>
            )}
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate mb-1.5 leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
              {dealership.name}
            </h3>
          </div>

          {/* Hold Reason Display */}
          {dealership.status === DealershipStatus.HOLD && dealership.hold_reason && (
            <div className="mb-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded px-2 py-1 text-[10px] text-orange-800 dark:text-orange-200 font-medium truncate">
               <span className="font-bold uppercase text-orange-400 mr-1">Hold:</span>
               {dealership.hold_reason}
            </div>
          )}

          {/* Bottom Row: Group, Store/Branch, IDs, Date */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
             <div className="flex items-center gap-1.5" title="Enterprise Group">
               <span className="text-slate-400 dark:text-slate-500">GRP:</span>
               <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[150px]">{groupName || 'Single'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
             
             <div className="flex items-center gap-1.5" title="Store / Branch">
               <span className="text-slate-400 dark:text-slate-500">S/B:</span>
               <span className="font-mono text-slate-700 dark:text-slate-300">{dealership.store_number || '-'}/{dealership.branch_number || '-'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

             <div className="flex items-center gap-1.5" title="PP Sys ID">
               <span className="text-slate-400 dark:text-slate-500">PP:</span>
               <span className="font-mono text-slate-700 dark:text-slate-300">{dealership.pp_sys_id || '-'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

             <div className="flex items-center gap-1.5" title="ERA ID">
               <span className="text-slate-400 dark:text-slate-500">ERA:</span>
               <span className="font-mono text-slate-700 dark:text-slate-300">{dealership.era_system_id || '-'}</span>
             </div>
             <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

             {dealership.status === DealershipStatus.CANCELLED ? (
               <div className="flex items-center gap-1.5" title="Termination Date">
                 <span className="text-red-400 font-bold">TERM:</span>
                 <span className="text-slate-700 dark:text-slate-300">{formatDate(dealership.term_date)}</span>
               </div>
             ) : (
               <div className="flex items-center gap-1.5" title="Go-Live Date">
                 <span className="text-slate-400 dark:text-slate-500">LIVE:</span>
                 <span className="text-slate-700 dark:text-slate-300">{formatDate(dealership.go_live_date)}</span>
               </div>
             )}
          </div>
        </div>

        {/* Right Side: Status */}
        <div className="flex-shrink-0 pl-4 border-l border-slate-100 dark:border-slate-800">
           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[dealership.status]}`}>
              {dealership.status}
           </span>
        </div>
      </div>
    </div>
  );
};

export default DealershipCard;
