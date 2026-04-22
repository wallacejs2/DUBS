import React from 'react';
import { AlertTriangle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { AttentionQueue as AttentionQueueData } from '../../lib/metrics';

interface AttentionQueueProps {
  data: AttentionQueueData;
  onRowClick?: (dealershipId: string, dealershipName: string, bucket: 'hold' | 'stuck' | 'cancelled') => void;
}

const Column: React.FC<{
  icon: React.ReactNode;
  title: string;
  accent: string;
  countLabel: string;
  emptyLabel: string;
  children: React.ReactNode;
  isEmpty: boolean;
}> = ({ icon, title, accent, countLabel, emptyLabel, children, isEmpty }) => (
  <div className="rounded-xl border border-slate-200/60 dark:border-[#38383A] bg-white/50 dark:bg-[#1C1C1E]/60 overflow-hidden flex flex-col">
    <div className={`flex items-center justify-between px-3 py-2 border-b border-slate-200/60 dark:border-[#38383A] ${accent}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
        {icon}
        {title}
      </div>
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{countLabel}</span>
    </div>
    <div className="flex-1 divide-y divide-slate-100 dark:divide-white/5">
      {isEmpty ? (
        <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">{emptyLabel}</div>
      ) : (
        children
      )}
    </div>
  </div>
);

const Row: React.FC<{
  name: string;
  meta: React.ReactNode;
  sub?: React.ReactNode;
  onClick?: () => void;
}> = ({ name, meta, sub, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors group ${
      onClick ? 'hover:bg-slate-50 dark:hover:bg-white/5' : ''
    }`}
  >
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{name}</div>
      {sub ? <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{sub}</div> : null}
    </div>
    <div className="flex items-center gap-1 flex-shrink-0">
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{meta}</span>
      {onClick && <ArrowRight size={12} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100" />}
    </div>
  </button>
);

export const AttentionQueue: React.FC<AttentionQueueProps> = ({ data, onRowClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Column
        icon={<AlertTriangle size={13} className="text-orange-500" />}
        title="On Hold"
        accent="bg-orange-50/50 dark:bg-orange-900/10"
        countLabel={`${data.holds.length}`}
        emptyLabel="No dealerships on hold"
        isEmpty={data.holds.length === 0}
      >
        {data.holds.map((h) => (
          <Row
            key={h.id}
            name={h.name}
            meta={`${h.daysOnHold}d`}
            sub={h.reason !== '—' ? h.reason : undefined}
            onClick={onRowClick ? () => onRowClick(h.id, h.name, 'hold') : undefined}
          />
        ))}
      </Column>

      <Column
        icon={<Clock size={13} className="text-amber-500" />}
        title="Stuck Onboarding"
        accent="bg-amber-50/50 dark:bg-amber-900/10"
        countLabel={`>60d · ${data.stuckOnboarding.length}`}
        emptyLabel="Everyone's moving on schedule"
        isEmpty={data.stuckOnboarding.length === 0}
      >
        {data.stuckOnboarding.map((s) => (
          <Row
            key={s.id}
            name={s.name}
            meta={`${s.daysInOnboarding}d`}
            onClick={onRowClick ? () => onRowClick(s.id, s.name, 'stuck') : undefined}
          />
        ))}
      </Column>

      <Column
        icon={<XCircle size={13} className="text-red-500" />}
        title="Recent Cancellations"
        accent="bg-red-50/50 dark:bg-red-900/10"
        countLabel={`90d · ${data.recentCancellations.length}`}
        emptyLabel="No recent cancellations"
        isEmpty={data.recentCancellations.length === 0}
      >
        {data.recentCancellations.map((c) => (
          <Row
            key={c.id}
            name={c.name}
            meta={c.termDate ? c.termDate.slice(5) : '—'}
            sub={c.reason !== '—' ? c.reason : undefined}
            onClick={onRowClick ? () => onRowClick(c.id, c.name, 'cancelled') : undefined}
          />
        ))}
      </Column>
    </div>
  );
};

export default AttentionQueue;
