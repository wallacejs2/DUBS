import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  BarChart3, Building2, Calendar, Clock, DollarSign,
  Rocket, TrendingUp, UserPlus, X, ArrowRight
} from 'lucide-react';
import { useDealerships, useOrders } from '../hooks';
import { DealershipFilterState, DealershipStatus, Order } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onNavigateToDealerships?: (filters: Partial<DealershipFilterState>) => void;
}

type S2Preset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getMonthKey = (dateValue?: string): string => {
  if (!dateValue) return '';
  const raw = dateValue.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const getTimestamp = (value?: string): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatCurrency = (val: number, compact = false): string => {
  if (compact && Math.abs(val) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
    }).format(val);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(val);
};

const getS2DateRange = (preset: S2Preset, custom: { start: string; end: string }): { start: string; end: string } => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'this_month':
      return { start: fmtDate(new Date(y, m, 1)), end: fmtDate(new Date(y, m + 1, 0)) };
    case 'last_month': {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      return { start: fmtDate(new Date(ly, lm, 1)), end: fmtDate(new Date(ly, lm + 1, 0)) };
    }
    case 'this_quarter': {
      const q = Math.floor(m / 3);
      return { start: fmtDate(new Date(y, q * 3, 1)), end: fmtDate(new Date(y, q * 3 + 3, 0)) };
    }
    case 'last_quarter': {
      const q = Math.floor(m / 3);
      const lq = q === 0 ? 3 : q - 1;
      const lqy = q === 0 ? y - 1 : y;
      return { start: fmtDate(new Date(lqy, lq * 3, 1)), end: fmtDate(new Date(lqy, lq * 3 + 3, 0)) };
    }
    case 'this_year':
      return { start: fmtDate(new Date(y, 0, 1)), end: fmtDate(new Date(y, 11, 31)) };
    case 'last_year':
      return { start: fmtDate(new Date(y - 1, 0, 1)), end: fmtDate(new Date(y - 1, 11, 31)) };
    case 'custom':
      return { start: custom.start, end: custom.end };
  }
};

// ─── Sub-components ────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, iconBg = 'bg-slate-100 dark:bg-slate-800', onClick, clickable }) => (
  <div
    className={`p-4 rounded-2xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A] flex items-center gap-3 transition-all ${clickable ? 'cursor-pointer hover:ring-1 hover:ring-blue-500/40 hover:bg-white dark:hover:bg-[#3A3A3C]' : ''}`}
    onClick={onClick}
  >
    <div className={`p-2 rounded-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">{label}</div>
      <div className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
        {value}
        {sub}
      </div>
    </div>
    {clickable && <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />}
  </div>
);

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, accent, children, headerRight }) => (
  <div className={`rounded-2xl border overflow-hidden mb-6 ${accent}`}>
    <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
        {icon}
        {title}
      </div>
      {headerRight && <div>{headerRight}</div>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// ─── Constants ─────────────────────────────────────────────────────────────────

const GOLIVE_COLOR = '#10b981';

const STATUS_TOGGLE_GROUPS = [
  {
    label: 'Live',
    statuses: [DealershipStatus.LIVE, DealershipStatus.LEGACY],
    color: 'text-emerald-600 dark:text-emerald-400',
    dotColor: '#10b981',
  },
  {
    label: 'Onboarding',
    statuses: [DealershipStatus.ONBOARDING],
    color: 'text-indigo-600 dark:text-indigo-400',
    dotColor: '#6366f1',
  },
  {
    label: 'Pending',
    statuses: [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED],
    color: 'text-slate-500 dark:text-slate-400',
    dotColor: '#94a3b8',
  },
  {
    label: 'Hold',
    statuses: [DealershipStatus.HOLD],
    color: 'text-orange-600 dark:text-orange-400',
    dotColor: '#f97316',
  },
  {
    label: 'Cancelled',
    statuses: [DealershipStatus.CANCELLED],
    color: 'text-red-600 dark:text-red-400',
    dotColor: '#ef4444',
  },
] as const;

const S2_PRESETS: Array<{ key: S2Preset; label: string }> = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'last_quarter', label: 'Last Quarter' },
  { key: 'this_year', label: 'This Year' },
  { key: 'last_year', label: 'Last Year' },
  { key: 'custom', label: 'Custom' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToDealerships }) => {
  // Section 1: all toggles active by default (nothing excluded)
  const [s1ExcludedStatuses, setS1ExcludedStatuses] = useState<DealershipStatus[]>([]);

  // Section 2: date range filter
  const [s2Preset, setS2Preset] = useState<S2Preset>('this_month');
  const [s2CustomRange, setS2CustomRange] = useState({ start: '', end: '' });

  const { dealerships } = useDealerships();
  const { orders } = useOrders();

  // ─── Section 1 Metrics ─────────────────────────────────────────────────────
  const s1Metrics = useMemo(() => {
    const filteredDealerships = dealerships.filter(d => !s1ExcludedStatuses.includes(d.status));
    const filteredIds = new Set(filteredDealerships.map(d => d.id));
    const filteredOrders = orders.filter(o => filteredIds.has(o.dealership_id));

    const totalDealerships = filteredDealerships.length;
    const totalLineItems = filteredOrders.reduce((sum, o) => sum + (o.products?.length || 0), 0);
    const totalRevenue = filteredOrders.reduce(
      (sum, o) => sum + (o.products?.reduce((ps, p) => ps + (Number(p.amount) || 0), 0) || 0),
      0
    );

    // Build per-dealer order index for reallocated revenue
    const ordersByDealer = new Map<string, Order[]>();
    for (const o of filteredOrders) {
      const list = ordersByDealer.get(o.dealership_id) ?? [];
      list.push(o);
      ordersByDealer.set(o.dealership_id, list);
    }
    const reallocatedRevenue = filteredDealerships.reduce((total, d) => {
      const dealerOrders = ordersByDealer.get(d.id) ?? [];
      const dealerRevenue = dealerOrders.reduce(
        (sum, o) => sum + (o.products?.reduce((ps, p) => ps + (Number(p.amount) || 0), 0) || 0),
        0
      );
      return total + (dealerRevenue - 2500);
    }, 0);

    // Status counts from unfiltered dataset (for toggle button labels)
    const statusCounts = dealerships.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalDealerships, totalLineItems, totalRevenue, reallocatedRevenue, statusCounts };
  }, [dealerships, orders, s1ExcludedStatuses]);

  // ─── Section 2 Metrics ─────────────────────────────────────────────────────
  const s2Range = useMemo(() => getS2DateRange(s2Preset, s2CustomRange), [s2Preset, s2CustomRange]);

  const s2Metrics = useMemo(() => {
    const startTs = s2Range.start ? getTimestamp(`${s2Range.start}T00:00:00`) : null;
    const endTs = s2Range.end ? getTimestamp(`${s2Range.end}T23:59:59.999`) : null;

    const inRange = (dateStr: string | undefined): boolean => {
      if (!dateStr) return false;
      const ts = getTimestamp(`${dateStr}T00:00:00`);
      if (ts === null) return false;
      if (startTs !== null && ts < startTs) return false;
      if (endTs !== null && ts > endTs) return false;
      return true;
    };

    // Distinct dealerships with ≥1 order whose received_date is in range
    const receivedDealerIds = new Set<string>();
    for (const o of orders) {
      if (inRange(o.received_date)) receivedDealerIds.add(o.dealership_id);
    }

    const received = receivedDealerIds.size;
    const onboarding = dealerships.filter(d => inRange(d.onboarding_date)).length;
    const live = dealerships.filter(d => inRange(d.go_live_date)).length;
    const termed = dealerships.filter(d => inRange(d.term_date)).length;

    // Avg days across ALL dealerships with both onboarding_date and go_live_date (not date-filtered)
    const daysAcc = dealerships.reduce(
      (acc, d) => {
        if (d.onboarding_date && d.go_live_date) {
          const days = Math.round(
            (new Date(d.go_live_date).getTime() - new Date(d.onboarding_date).getTime()) / 86400000
          );
          acc.total += days;
          acc.count += 1;
        }
        return acc;
      },
      { total: 0, count: 0 }
    );
    const avgDaysToGoLive = daysAcc.count > 0 ? Math.round(daysAcc.total / daysAcc.count) : null;

    return { received, onboarding, live, termed, avgDaysToGoLive };
  }, [dealerships, orders, s2Range]);

  // ─── Section 3 Chart Data ──────────────────────────────────────────────────
  const s3ChartData = useMemo(() => {
    const now = new Date();
    const data: Array<{ month: string; label: string; goLive: number }> = [];
    for (let i = 17; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const goLive = dealerships.filter(dl => getMonthKey(dl.go_live_date) === mk).length;
      data.push({ month: mk, label, goLive });
    }
    return data;
  }, [dealerships]);

  // ─── Section 1 Toggle Helpers ──────────────────────────────────────────────
  const toggleS1Group = (statuses: readonly DealershipStatus[]) => {
    setS1ExcludedStatuses(prev => {
      const allExcluded = statuses.every(s => prev.includes(s));
      if (allExcluded) return prev.filter(s => !statuses.includes(s));
      const next = [...prev];
      statuses.forEach(s => { if (!next.includes(s)) next.push(s); });
      return next;
    });
  };

  const isS1GroupExcluded = (statuses: readonly DealershipStatus[]) =>
    statuses.every(s => s1ExcludedStatuses.includes(s));

  return (
    <div className="animate-in fade-in duration-700 relative">

      {/* ── Section 1: Overall KPIs ─────────────────────────────────────────── */}
      <Section
        title="Overall KPIs"
        icon={<Building2 size={15} />}
        accent="bg-blue-500/5 dark:bg-blue-500/10 border-blue-200/40 dark:border-blue-500/20"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <KpiCard
            icon={<Building2 size={15} className="text-slate-500" />}
            label="Total Dealerships"
            value={s1Metrics.totalDealerships}
            iconBg="bg-slate-100 dark:bg-slate-700"
            clickable
            onClick={() => onNavigateToDealerships?.({})}
          />
          <KpiCard
            icon={<BarChart3 size={15} className="text-indigo-500" />}
            label="Total Line Items"
            value={s1Metrics.totalLineItems.toLocaleString()}
            iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          />
          <KpiCard
            icon={<DollarSign size={15} className="text-emerald-500" />}
            label="Total Revenue"
            value={formatCurrency(s1Metrics.totalRevenue, true)}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          />
          <KpiCard
            icon={<TrendingUp size={15} className="text-blue-500" />}
            label="Reallocated Revenue"
            value={formatCurrency(s1Metrics.reallocatedRevenue, true)}
            iconBg="bg-blue-50 dark:bg-blue-900/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TOGGLE_GROUPS.map(sg => {
            const excluded = isS1GroupExcluded(sg.statuses);
            const count = sg.statuses.reduce((s, st) => s + (s1Metrics.statusCounts[st] || 0), 0);
            return (
              <button
                key={sg.label}
                onClick={() => toggleS1Group(sg.statuses)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  excluded
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-50'
                    : `bg-white/80 dark:bg-[#2C2C2E] border-slate-200/60 dark:border-[#38383A] ${sg.color}`
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: excluded ? undefined : sg.dotColor }}
                />
                {sg.label} ({count})
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Section 2: Date-Range KPIs ──────────────────────────────────────── */}
      <Section
        title="Date-Range KPIs"
        icon={<Calendar size={15} />}
        accent="bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-200/40 dark:border-cyan-500/20"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A]">
            {S2_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => setS2Preset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  s2Preset === p.key
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {s2Preset === 'custom' && (
            <div className="flex items-center gap-2 bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 dark:border-[#38383A]">
              <Calendar size={14} className="text-slate-400 ml-1" />
              <input
                type="date"
                value={s2CustomRange.start}
                onChange={e => setS2CustomRange(r => ({ ...r, start: e.target.value }))}
                className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
              />
              <span className="text-slate-300 dark:text-slate-600 text-xs">–</span>
              <input
                type="date"
                value={s2CustomRange.end}
                onChange={e => setS2CustomRange(r => ({ ...r, end: e.target.value }))}
                className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
              />
              {(s2CustomRange.start || s2CustomRange.end) && (
                <button
                  onClick={() => setS2CustomRange({ start: '', end: '' })}
                  className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            icon={<Calendar size={15} className="text-cyan-500" />}
            label="Received"
            value={s2Metrics.received}
            iconBg="bg-cyan-50 dark:bg-cyan-900/30"
          />
          <KpiCard
            icon={<UserPlus size={15} className="text-indigo-500" />}
            label="Onboarding"
            value={s2Metrics.onboarding}
            iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          />
          <KpiCard
            icon={<Rocket size={15} className="text-emerald-500" />}
            label="Live"
            value={s2Metrics.live}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          />
          <KpiCard
            icon={<X size={15} className="text-red-500" />}
            label="Termed"
            value={s2Metrics.termed}
            iconBg="bg-red-50 dark:bg-red-900/30"
          />
          <KpiCard
            icon={<Clock size={15} className="text-violet-500" />}
            label="Avg Days to Go-Live"
            value={s2Metrics.avgDaysToGoLive !== null ? `${s2Metrics.avgDaysToGoLive}d` : '—'}
            iconBg="bg-violet-50 dark:bg-violet-900/30"
          />
        </div>
      </Section>

      {/* ── Section 3: 18-Month Go-Live Chart ──────────────────────────────── */}
      <Section
        title="Go-Live by Month — Last 18 Months"
        icon={<BarChart3 size={15} />}
        accent="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200/40 dark:border-emerald-500/20"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={s3ChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-s3-golive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GOLIVE_COLOR} stopOpacity={0.5} />
                <stop offset="95%" stopColor={GOLIVE_COLOR} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
              itemStyle={{ color: '#cbd5e1' }}
              cursor={{ fill: 'rgba(148,163,184,0.05)' }}
            />
            <Area
              type="monotone"
              dataKey="goLive"
              stroke={GOLIVE_COLOR}
              fill="url(#grad-s3-golive)"
              strokeWidth={1.5}
              name="Go-Live"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

    </div>
  );
};

export default DashboardPage;
