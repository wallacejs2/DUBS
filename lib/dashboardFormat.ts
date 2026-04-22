// Lightweight formatters used throughout dashboard views.

export const formatCurrency = (val: number | null | undefined, compact = false): string => {
  const n = Number(val || 0);
  if (compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
};

export const formatPct = (ratio: number | null | undefined, fractionDigits = 0): string => {
  if (ratio == null || !Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
};

export const formatDelta = (current: number, prev: number): string => {
  const delta = current - prev;
  if (delta === 0) return '0';
  return delta > 0 ? `+${delta}` : `${delta}`;
};

export const formatDays = (days: number | null | undefined): string => {
  if (days == null || !Number.isFinite(days)) return '—';
  return `${Math.round(days)}d`;
};

export const formatNumber = (n: number | null | undefined): string => {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n);
};

export const truncate = (s: string, max: number): string =>
  s.length <= max ? s : `${s.slice(0, max - 1)}…`;
