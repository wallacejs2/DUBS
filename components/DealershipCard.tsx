
import React, { useState } from 'react';
import { Copy, Check, Hash, Link, Star, ChevronRight } from 'lucide-react';
import { Dealership, DealershipStatus } from '../types';

interface DealershipCardProps {
  dealership: Dealership;
  groupName?: string;
  isManaged?: boolean;
  hasClientId?: boolean;
  hasAddlWeb?: boolean;
  hasZeroPrice?: boolean;
  missingCSM?: boolean;
  missingEnrollment?: boolean;
  missingPOC?: boolean;
  missingWebProvider?: boolean;
  missingInvProvider?: boolean;
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
  missingEnrollment, missingPOC, missingWebProvider, missingInvProvider,
  onClick, onToggleFavorite
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${month}-${day}-${year}`;
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

  // Count warnings for collapsed indicator
  const warningCount = [
    !hasClientId,
    hasZeroPrice,
    missingCSM,
    missingEnrollment,
    missingPOC,
    missingWebProvider,
    missingInvProvider,
  ].filter(Boolean).length;

  return (
    <div
      onClick={onClick}
      className="group bg-white/80 dark:bg-[#2C2C2E] rounded-2xl border border-slate-200/60 dark:border-[#38383A] hover:bg-slate-50/80 dark:hover:bg-white/[0.04] hover:border-blue-200 dark:hover:border-blue-700/50 transition-all duration-150 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      tabIndex={0}
    >
      <div className="p-4">
        {/* Row 1: Favorite + CIF + Name (left) | Issues + Status + Chevron (right) */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Favorite star */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(e);
                }}
                className={`flex-shrink-0 transition-colors ${dealership.is_favorite ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}
                title={dealership.is_favorite ? "Unfavorite" : "Mark as Favorite"}
              >
                <Star size={14} fill={dealership.is_favorite ? "currentColor" : "none"} />
              </button>
            )}
            {/* CIF */}
            <span className="flex-shrink-0 text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
              {dealership.cif_number || 'NO CIF'}
            </span>
            {/* Name */}
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {dealership.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {/* Copy buttons — hidden until hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopyDetails}
                className="p-1 text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition-all"
                title="Copy Full Details"
              >
                {copiedField === 'details' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <button
                onClick={handleCopyCombo}
                className="p-1 text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition-all"
                title="Copy PP_Store_Branch"
              >
                {copiedField === 'combo' ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
              </button>
              <button
                onClick={handleCopyPP}
                className="p-1 text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition-all"
                title="Copy PP Sys ID"
              >
                {copiedField === 'pp' ? <Check size={14} className="text-emerald-500" /> : <Hash size={14} />}
              </button>
            </div>
            {/* Warning count badge */}
            {warningCount > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-orange-500 rounded-full leading-none"
                title={[
                  !hasClientId && '40NM',
                  hasZeroPrice && '$0',
                  missingCSM && 'CSM',
                  missingEnrollment && 'ENR',
                  missingPOC && 'POC',
                  missingWebProvider && 'WEB',
                  missingInvProvider && 'INV',
                ].filter(Boolean).join(', ')}
              >
                {warningCount}
              </span>
            )}
            {/* Status badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[dealership.status]}`}>
              {dealership.status}
            </span>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          </div>
        </div>

        {/* Row 2: CRM / tags */}
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-2">
          {dealership.crm_provider}
          {isManaged && ' · Managed'}
          {hasAddlWeb && ' · Addl. Web'}
          {dealership.sms_activated && ' · SMS'}
        </p>

        {/* Row 4: Metadata */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/40 dark:border-[#38383A]/50">
          <div className="flex items-center gap-1.5" title="Group">
            <span className="font-medium text-slate-400 dark:text-slate-500">Grp:</span>
            <span className="font-mono">{groupName || 'Single'}</span>
          </div>

          <div className="flex items-center gap-1.5" title="ERA System ID">
            <span className="font-medium text-slate-400 dark:text-slate-500">ERA:</span>
            <span className="font-mono">{dealership.era_system_id || '--'}</span>
          </div>

          <div className="flex items-center gap-1.5" title="PP System ID">
            <span className="font-medium text-slate-400 dark:text-slate-500">PP:</span>
            <span className="font-mono">{dealership.pp_sys_id || '--'}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Store Number">
            <span className="font-medium text-slate-400 dark:text-slate-500">St:</span>
            <span className="font-mono">{dealership.store_number || '--'}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Branch Number">
            <span className="font-medium text-slate-400 dark:text-slate-500">Br:</span>
            <span className="font-mono">{dealership.branch_number || '--'}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto" title="Onboarding Date">
            <span className="font-medium text-slate-400 dark:text-slate-500">Onb:</span>
            <span>{formatDate(dealership.onboarding_date)}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Go Live Date">
            <span className="font-medium text-slate-400 dark:text-slate-500">Live:</span>
            <span>{formatDate(dealership.go_live_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipCard;
