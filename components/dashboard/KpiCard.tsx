import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CARD_CLASS } from './constants';

interface DeltaBadgeProps {
  current: number;
  prev: number;
  invertColors?: boolean; // use when "down" is good (e.g. churn)
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({ current, prev, invertColors }) => {
  const delta = current - prev;
  if (delta === 0) return null;
  const positive = invertColors ? delta < 0 : delta > 0;
  return (
    <span className={`text-xs font-bold ml-1.5 ${positive ? 'text-emerald-500' : 'text-red-400'}`}>
      {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  );
};

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  icon,
  label,
  value,
  sub,
  iconBg = 'bg-slate-100 dark:bg-slate-800',
  onClick,
  clickable,
}) => {
  const interactive = clickable && !!onClick;
  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      aria-label={typeof value === 'string' || typeof value === 'number' ? `${label}: ${value}` : label}
      className={`
        p-4 ${CARD_CLASS} flex items-center gap-3 text-left w-full transition-all
        ${interactive
          ? 'cursor-pointer hover:ring-1 hover:ring-blue-500/40 hover:bg-white dark:hover:bg-[#3A3A3C] focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none'
          : 'cursor-default'}
      `}
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">{label}</div>
        <div className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-baseline">
          <span>{value}</span>
          {sub ? <span className="ml-0">{sub}</span> : null}
        </div>
      </div>
      {interactive && <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />}
    </button>
  );
};

export default KpiCard;
