import React from 'react';
import { ChevronRight } from 'lucide-react';
import { LifecycleFunnel as LifecycleFunnelData } from '../../lib/metrics';
import { formatPct } from '../../lib/dashboardFormat';
import { DealershipStatus } from '../../types';
import { STATUS_COLORS } from './constants';

interface LifecycleFunnelProps {
  data: LifecycleFunnelData;
  onStageClick?: (statuses: DealershipStatus[]) => void;
}

const Stage: React.FC<{
  label: string;
  value: number;
  color: string;
  width: number;   // 0..1
  onClick?: () => void;
}> = ({ label, value, color, width, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`flex-1 text-left rounded-xl p-3 transition-all border border-transparent ${
      onClick ? 'hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10' : ''
    }`}
  >
    <div className="flex items-baseline justify-between mb-2">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(4, width * 100)}%`, backgroundColor: color }}
      />
    </div>
  </button>
);

const Conversion: React.FC<{ value: number | null }> = ({ value }) => (
  <div className="flex flex-col items-center justify-center px-2 py-1 min-w-[64px]">
    <ChevronRight size={20} className="text-slate-300 dark:text-slate-600" />
    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
      {formatPct(value)}
    </span>
  </div>
);

export const LifecycleFunnel: React.FC<LifecycleFunnelProps> = ({ data, onStageClick }) => {
  const max = Math.max(1, data.pending, data.onboarding, data.live);
  return (
    <div className="flex items-stretch gap-1">
      <Stage
        label="Pending"
        value={data.pending}
        color={STATUS_COLORS[DealershipStatus.DMT_PENDING]}
        width={data.pending / max}
        onClick={onStageClick ? () => onStageClick([DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED]) : undefined}
      />
      <Conversion value={data.conversion.pendingToOnboarding} />
      <Stage
        label="Onboarding"
        value={data.onboarding}
        color={STATUS_COLORS[DealershipStatus.ONBOARDING]}
        width={data.onboarding / max}
        onClick={onStageClick ? () => onStageClick([DealershipStatus.ONBOARDING]) : undefined}
      />
      <Conversion value={data.conversion.onboardingToLive} />
      <Stage
        label="Live"
        value={data.live}
        color={STATUS_COLORS[DealershipStatus.LIVE]}
        width={data.live / max}
        onClick={onStageClick ? () => onStageClick([DealershipStatus.LIVE]) : undefined}
      />
    </div>
  );
};

export default LifecycleFunnel;
