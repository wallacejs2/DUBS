// Date-range and month-key helpers used by the dashboard metrics layer.
// These are pure functions with no React or DB dependencies.

export type PeriodPreset = 'this_month' | 'last_month' | 'ytd' | 'last_12' | 'custom';

export interface ResolvedPeriod {
  start: string;            // YYYY-MM-DD
  end: string;              // YYYY-MM-DD
  primaryMonthKey: string;  // YYYY-MM; empty when range spans multiple months
  isSingleMonth: boolean;
}

export const getMonthKey = (dateValue?: string): string => {
  if (!dateValue) return '';
  const raw = dateValue.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

export const getTimestamp = (value?: string): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

export const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfDayTs = (yyyyMmDd: string): number | null =>
  getTimestamp(`${yyyyMmDd}T00:00:00`);

const endOfDayTs = (yyyyMmDd: string): number | null =>
  getTimestamp(`${yyyyMmDd}T23:59:59.999`);

export const resolvePreset = (
  preset: PeriodPreset,
  custom: { start: string; end: string } = { start: '', end: '' }
): ResolvedPeriod => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const monthKey = (yr: number, mo: number) => `${yr}-${String(mo + 1).padStart(2, '0')}`;
  const mkSingle = (start: string, end: string): boolean =>
    !!start && !!end && start.slice(0, 7) === end.slice(0, 7);

  switch (preset) {
    case 'this_month': {
      const start = fmtDate(new Date(y, m, 1));
      const end = fmtDate(new Date(y, m + 1, 0));
      return { start, end, primaryMonthKey: monthKey(y, m), isSingleMonth: true };
    }
    case 'last_month': {
      const ly = m === 0 ? y - 1 : y;
      const lm = m === 0 ? 11 : m - 1;
      return {
        start: fmtDate(new Date(ly, lm, 1)),
        end: fmtDate(new Date(ly, lm + 1, 0)),
        primaryMonthKey: monthKey(ly, lm),
        isSingleMonth: true,
      };
    }
    case 'ytd': {
      return {
        start: `${y}-01-01`,
        end: fmtDate(now),
        primaryMonthKey: '',
        isSingleMonth: false,
      };
    }
    case 'last_12': {
      return {
        start: fmtDate(new Date(y, m - 11, 1)),
        end: fmtDate(now),
        primaryMonthKey: '',
        isSingleMonth: false,
      };
    }
    case 'custom': {
      const isSingle = mkSingle(custom.start, custom.end);
      return {
        start: custom.start,
        end: custom.end,
        primaryMonthKey: isSingle ? custom.start.slice(0, 7) : '',
        isSingleMonth: isSingle,
      };
    }
  }
};

// Shifts a period backward by its own length to compute the equivalent "previous period"
// used for delta badges on flow KPIs.
export const shiftPeriodBack = (periodStart: string, periodEnd: string): { start: string; end: string } | null => {
  const startTs = startOfDayTs(periodStart);
  const endTs = endOfDayTs(periodEnd);
  if (startTs === null || endTs === null) return null;

  const span = endTs - startTs;
  const prevEndTs = startTs - 1;
  const prevStartTs = prevEndTs - span;

  const toDate = (ts: number) => fmtDate(new Date(ts));
  return { start: toDate(prevStartTs), end: toDate(prevEndTs) };
};

export const periodToTimestamps = (start: string, end: string): { startTs: number | null; endTs: number | null } => ({
  startTs: start ? startOfDayTs(start) : null,
  endTs: end ? endOfDayTs(end) : null,
});

// Returns list of month keys between start and end (inclusive, chronological order).
export const monthsInRange = (start: string, end: string): Array<{ key: string; label: string }> => {
  if (!start || !end) return [];
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return [];

  const result: Array<{ key: string; label: string }> = [];
  const cursor = new Date(s.getFullYear(), s.getMonth(), 1);
  const stop = new Date(e.getFullYear(), e.getMonth(), 1);

  while (cursor <= stop) {
    const yr = cursor.getFullYear();
    const mo = cursor.getMonth();
    result.push({
      key: `${yr}-${String(mo + 1).padStart(2, '0')}`,
      label: cursor.toLocaleString('default', { month: 'short', year: '2-digit' }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
};

export const todayYmd = (): string => fmtDate(new Date());
