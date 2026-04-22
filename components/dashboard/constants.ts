import { DealershipStatus } from '../../types';

export const STATUS_COLORS: Record<string, string> = {
  [DealershipStatus.LIVE]: '#10b981',
  [DealershipStatus.LEGACY]: '#6ee7b7',
  [DealershipStatus.ONBOARDING]: '#3b82f6',
  [DealershipStatus.DMT_PENDING]: '#94a3b8',
  [DealershipStatus.DMT_APPROVED]: '#64748b',
  [DealershipStatus.HOLD]: '#f97316',
  [DealershipStatus.CANCELLED]: '#ef4444',
};

export const STATUS_LABEL: Record<string, string> = {
  [DealershipStatus.LIVE]: 'Live',
  [DealershipStatus.LEGACY]: 'Legacy',
  [DealershipStatus.ONBOARDING]: 'Onboarding',
  [DealershipStatus.DMT_PENDING]: 'DMT-Pending',
  [DealershipStatus.DMT_APPROVED]: 'DMT-Approved',
  [DealershipStatus.HOLD]: 'Hold',
  [DealershipStatus.CANCELLED]: 'Cancelled',
};

export const PIPELINE_COLORS = {
  received: '#06b6d4',
  onboarding: '#3b82f6',
  goLive: '#10b981',
  termed: '#ef4444',
};

export const HEALTH_COLORS = {
  good: '#10b981',    // ≥75
  ok: '#f59e0b',      // 50–74
  bad: '#ef4444',     // <50
};

export const healthColor = (score: number): string =>
  score >= 75 ? HEALTH_COLORS.good : score >= 50 ? HEALTH_COLORS.ok : HEALTH_COLORS.bad;

export const healthPillClass = (score: number): string => {
  if (score >= 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
  return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
};

export const CARD_CLASS =
  'rounded-2xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A]';
