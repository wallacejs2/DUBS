import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  BarChart3, Building2, Calendar, ChevronDown, ChevronUp, Clock, DollarSign,
  Rocket, TrendingUp, UserPlus, X, Users, Briefcase, ArrowRight, CheckCircle
} from 'lucide-react';
import { useDealerships, useOrders, useEnterpriseGroups, useTeamMembers } from '../hooks';
import { db } from '../db';
import { DealershipFilterState, DealershipStatus, ProductCode, Dealership } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onNavigateToDealerships?: (filters: Partial<DealershipFilterState>) => void;
}

type TimePreset = 'this_month' | 'last_month' | 'ytd' | 'last_12' | 'custom';

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
  if (compact && val >= 1000) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(val);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

const getDateRange = (preset: TimePreset, custom: { start: string; end: string }) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'this_month': {
      const mk = `${y}-${String(m + 1).padStart(2, '0')}`;
      return { start: fmtDate(new Date(y, m, 1)), end: fmtDate(new Date(y, m + 1, 0)), primaryMonthKey: mk };
    }
    case 'last_month': {
      const ly = m === 0 ? y - 1 : y;
      const lm = m === 0 ? 11 : m - 1;
      const mk = `${ly}-${String(lm + 1).padStart(2, '0')}`;
      return { start: fmtDate(new Date(ly, lm, 1)), end: fmtDate(new Date(ly, lm + 1, 0)), primaryMonthKey: mk };
    }
    case 'ytd': {
      const mk = `${y}-${String(m + 1).padStart(2, '0')}`;
      return { start: `${y}-01-01`, end: fmtDate(now), primaryMonthKey: mk };
    }
    case 'last_12': {
      const mk = `${y}-${String(m + 1).padStart(2, '0')}`;
      return { start: fmtDate(new Date(y, m - 11, 1)), end: fmtDate(now), primaryMonthKey: mk };
    }
    case 'custom': {
      const mk = custom.start ? custom.start.slice(0, 7) : `${y}-${String(m + 1).padStart(2, '0')}`;
      return { start: custom.start, end: custom.end, primaryMonthKey: mk };
    }
  }
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const DeltaBadge: React.FC<{ current: number; prev: number }> = ({ current, prev }) => {
  const delta = current - prev;
  if (delta === 0) return null;
  return <span className={`text-xs font-bold ml-1.5 ${delta > 0 ? 'text-emerald-500' : 'text-red-400'}`}>{delta > 0 ? '▲' : '▼'}{Math.abs(delta)}</span>;
};

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
  <div className={`p-4 rounded-2xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A] flex items-center gap-3 transition-all ${clickable ? 'cursor-pointer hover:ring-1 hover:ring-blue-500/40 hover:bg-white dark:hover:bg-[#3A3A3C]' : ''}`} onClick={onClick}>
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

// ─── Colors & Labels ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  [DealershipStatus.LIVE]: '#10b981',
  [DealershipStatus.LEGACY]: '#6ee7b7',
  [DealershipStatus.ONBOARDING]: '#3b82f6',
  [DealershipStatus.DMT_PENDING]: '#94a3b8',
  [DealershipStatus.DMT_APPROVED]: '#64748b',
  [DealershipStatus.HOLD]: '#f97316',
  [DealershipStatus.CANCELLED]: '#ef4444',
};

const STATUS_LABEL: Record<string, string> = {
  [DealershipStatus.LIVE]: 'Live',
  [DealershipStatus.LEGACY]: 'Legacy',
  [DealershipStatus.ONBOARDING]: 'Onboarding',
  [DealershipStatus.DMT_PENDING]: 'DMT-Pending',
  [DealershipStatus.DMT_APPROVED]: 'DMT-Approved',
  [DealershipStatus.HOLD]: 'Hold',
  [DealershipStatus.CANCELLED]: 'Cancelled',
};

const PIPELINE_COLORS = {
  received: '#06b6d4',
  onboarding: '#3b82f6',
  goLive: '#10b981',
  termed: '#ef4444',
};

// ─── Main Component ────────────────────────────────────────────────────────────

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToDealerships }) => {
  const [activePreset, setActivePreset] = useState<TimePreset>('this_month');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [reportingMonth, setReportingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [excludedStatuses, setExcludedStatuses] = useState<DealershipStatus[]>([DealershipStatus.CANCELLED]);
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(null);
  const [pipelineTableOpen, setPipelineTableOpen] = useState(false);

  const { dealerships } = useDealerships();
  const { orders } = useOrders();
  const { groups } = useEnterpriseGroups();
  const { members } = useTeamMembers();

  // ─── Date Range ──────────────────────────────────────────────────────────────
  const dateRange = useMemo(() => getDateRange(activePreset, customRange), [activePreset, customRange]);

  const handlePresetClick = (preset: TimePreset) => {
    setActivePreset(preset);
    const range = getDateRange(preset, customRange);
    setReportingMonth(range.primaryMonthKey);
  };

  // ─── Metrics Computation ─────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const startTs = dateRange.start ? getTimestamp(`${dateRange.start}T00:00:00`) : null;
    const endTs = dateRange.end ? getTimestamp(`${dateRange.end}T23:59:59.999`) : null;

    const activeDealerships = dealerships.filter(d => !excludedStatuses.includes(d.status));
    const activeDealershipIds = new Set(activeDealerships.map(d => d.id));

    // Date-filtered orders (for revenue in range)
    const rangeOrders = orders.filter(o => {
      if (!activeDealershipIds.has(o.dealership_id)) return false;
      const ts = getTimestamp(o.received_date);
      if (ts === null) return false;
      if (startTs !== null && ts < startTs) return false;
      if (endTs !== null && ts > endTs) return false;
      return true;
    });

    const sumRevenue = (orderList: typeof orders) =>
      orderList.reduce((sum, o) => sum + (o.products?.reduce((ps, p) => ps + (Number(p.amount) || 0), 0) || 0), 0);

    const totalRevenue = sumRevenue(rangeOrders);

    // Status counts
    const statusCounts = dealerships.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Revenue by status group
    const statusGroupDefs = [
      { label: 'Live', key: 'live', statuses: [DealershipStatus.LIVE, DealershipStatus.LEGACY], color: '#10b981' },
      { label: 'Onboarding', key: 'onboarding', statuses: [DealershipStatus.ONBOARDING], color: '#3b82f6' },
      { label: 'Pending', key: 'pending', statuses: [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED], color: '#94a3b8' },
      { label: 'Hold', key: 'hold', statuses: [DealershipStatus.HOLD], color: '#f97316' },
      { label: 'Cancelled', key: 'cancelled', statuses: [DealershipStatus.CANCELLED], color: '#ef4444' },
    ];
    const revenueByStatus = statusGroupDefs.map(sg => {
      const ids = new Set(dealerships.filter(d => sg.statuses.includes(d.status)).map(d => d.id));
      const rev = sumRevenue(rangeOrders.filter(o => ids.has(o.dealership_id)));
      const count = sg.statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
      return { ...sg, revenue: rev, count };
    });

    // Revenue by product (in date range)
    const revenueByProduct = Object.values(ProductCode)
      .map(code => {
        const rev = rangeOrders.reduce((sum, o) => {
          const p = o.products?.find(p => p.product_code === code);
          return sum + (p ? Number(p.amount) || 0 : 0);
        }, 0);
        const count = rangeOrders.reduce((sum, o) => sum + (o.products?.some(p => p.product_code === code) ? 1 : 0), 0);
        return { code, label: code.replace(/^\d+\s*-?\s*/, ''), revenue: rev, count };
      })
      .filter(p => p.count > 0 || p.revenue > 0);

    // Revenue trend (last 18 months, cumulative by go-live date)
    const now = new Date();
    const revenueTrend: Array<{ month: string; revenue: number; label: string }> = [];
    for (let i = 17; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      const liveDealershipIds = new Set(
        dealerships
          .filter(dl => {
            const glmk = getMonthKey(dl.go_live_date);
            return glmk && glmk <= mk;
          })
          .map(dl => dl.id)
      );
      const liveOrders = orders.filter(o => liveDealershipIds.has(o.dealership_id));
      revenueTrend.push({ month: mk, label, revenue: sumRevenue(liveOrders) });
    }

    // Avg days to go-live
    const avgDaysAcc = dealerships.reduce(
      (acc, d) => {
        if (d.purchase_date && d.go_live_date) {
          const diff = new Date(d.go_live_date).getTime() - new Date(d.purchase_date).getTime();
          if (diff >= 0) {
            acc.total += Math.round(diff / 86400000);
            acc.count += 1;
          }
        }
        return acc;
      },
      { total: 0, count: 0 }
    );
    const avgDaysToGoLive = avgDaysAcc.count > 0 ? Math.round(avgDaysAcc.total / avgDaysAcc.count) : null;

    // Lifecycle for reporting month (and previous month for delta)
    const prevMonth = (() => {
      const [y, m] = reportingMonth.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const computeLifecycle = (month: string) => {
      const receivedSet = new Set<string>();
      for (const o of orders) {
        if (getMonthKey(o.received_date) === month) receivedSet.add(o.dealership_id);
      }
      const { onboarding, goLive, termed } = dealerships.reduce(
        (acc, d) => {
          const hasOnb = getMonthKey(d.onboarding_date) === month;
          const hasGoLive = getMonthKey(d.go_live_date) === month;
          const hasTerm = getMonthKey(d.term_date) === month;
          if (hasTerm) acc.termed += 1;
          else if (hasGoLive) acc.goLive += 1;
          else if (hasOnb) acc.onboarding += 1;
          return acc;
        },
        { onboarding: 0, goLive: 0, termed: 0 }
      );
      return { received: receivedSet.size, onboarding, goLive, termed };
    };

    const lifecycle = computeLifecycle(reportingMonth);
    const prevLifecycle = computeLifecycle(prevMonth);
    const netLiveChange = lifecycle.goLive - lifecycle.termed;

    // Pipeline chart data (18 months, ordered oldest to newest)
    const pipelineChartData: Array<{ month: string; label: string; received: number; onboarding: number; goLive: number; termed: number }> = [];
    const receivedByMonth = new Map<string, Set<string>>();
    for (const o of orders) {
      const mk = getMonthKey(o.received_date);
      if (!mk) continue;
      if (!receivedByMonth.has(mk)) receivedByMonth.set(mk, new Set());
      receivedByMonth.get(mk)!.add(o.dealership_id);
    }
    for (let i = 17; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const row = { month: mk, label, received: receivedByMonth.get(mk)?.size || 0, onboarding: 0, goLive: 0, termed: 0 };
      for (const dl of dealerships) {
        if (getMonthKey(dl.term_date) === mk) row.termed += 1;
        else if (getMonthKey(dl.go_live_date) === mk) row.goLive += 1;
        else if (getMonthKey(dl.onboarding_date) === mk) row.onboarding += 1;
      }
      pipelineChartData.push(row);
    }

    // Pipeline table (same 18 months but ordered newest first)
    const pipelineTableData = [...pipelineChartData]
      .reverse()
      .map(row => ({
        ...row,
        recvToOnbPct: row.received > 0 ? Math.round((row.onboarding / row.received) * 100) : null,
        onbToLivePct: row.onboarding > 0 ? Math.round((row.goLive / row.onboarding) * 100) : null,
      }));
    const maxReceived = Math.max(1, ...pipelineChartData.map(r => r.received));

    // Enterprise group stats
    const groupStats = groups
      .map(g => {
        const gDealerships = dealerships.filter(d => d.enterprise_group_id === g.id);
        const gIds = new Set(gDealerships.map(d => d.id));
        const gRevenue = sumRevenue(rangeOrders.filter(o => gIds.has(o.dealership_id)));
        const statusBreakdown: Record<string, number> = {};
        for (const d of gDealerships) {
          statusBreakdown[d.status] = (statusBreakdown[d.status] || 0) + 1;
        }
        return { id: g.id, name: g.name, count: gDealerships.length, revenue: gRevenue, statusBreakdown };
      })
      .filter(g => g.count > 0)
      .sort((a, b) => b.count - a.count);

    // Revenue by enterprise group (top 8)
    const revenueByGroupData = [...groupStats]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map(g => ({ name: g.name.length > 20 ? g.name.slice(0, 18) + '…' : g.name, revenue: g.revenue, count: g.count }));

    // Team performance
    const contacts = db.getContacts();
    const contactsByDealership = new Map(contacts.map(c => [c.dealership_id, c]));
    const teamStats = members
      .map(member => {
        const mDealerships = dealerships.filter(d => {
          const c = contactsByDealership.get(d.id);
          return c?.assigned_specialist_name?.trim().toLowerCase() === member.name.trim().toLowerCase();
        });
        const statusBreakdown: Record<string, number> = {};
        for (const d of mDealerships) {
          statusBreakdown[d.status] = (statusBreakdown[d.status] || 0) + 1;
        }
        const live = (statusBreakdown[DealershipStatus.LIVE] || 0) + (statusBreakdown[DealershipStatus.LEGACY] || 0);
        const onboarding = statusBreakdown[DealershipStatus.ONBOARDING] || 0;
        const hold = statusBreakdown[DealershipStatus.HOLD] || 0;
        const pending = (statusBreakdown[DealershipStatus.DMT_PENDING] || 0) + (statusBreakdown[DealershipStatus.DMT_APPROVED] || 0);
        const cancelled = statusBreakdown[DealershipStatus.CANCELLED] || 0;
        return { name: member.name, role: member.role, total: mDealerships.length, live, onboarding, hold, pending, cancelled };
      })
      .filter(m => m.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      totalDealershipsCount: activeDealerships.length,
      totalRevenue,
      avgDaysToGoLive,
      netLiveChange,
      lifecycle,
      prevLifecycle,
      statusCounts,
      revenueByStatus,
      revenueByProduct,
      revenueTrend,
      revenueByGroupData,
      pipelineChartData,
      pipelineTableData,
      maxReceived,
      groupStats,
      teamStats,
    };
  }, [dealerships, orders, groups, members, excludedStatuses, reportingMonth, dateRange]);

  const toggleStatus = (statuses: DealershipStatus[]) => {
    setExcludedStatuses(prev => {
      const allExcluded = statuses.every(s => prev.includes(s));
      if (allExcluded) return prev.filter(s => !statuses.includes(s));
      const next = [...prev];
      statuses.forEach(s => {
        if (!next.includes(s)) next.push(s);
      });
      return next;
    });
  };

  const isExcluded = (statuses: DealershipStatus[]) => statuses.every(s => excludedStatuses.includes(s));

  const presets: Array<{ key: TimePreset; label: string }> = [
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'ytd', label: 'YTD' },
    { key: 'last_12', label: 'Last 12 Mo' },
  ];

  const statusGroupDefs = [
    { label: 'Live', statuses: [DealershipStatus.LIVE, DealershipStatus.LEGACY], color: 'text-emerald-600 dark:text-emerald-400', dotColor: '#10b981' },
    { label: 'Onboarding', statuses: [DealershipStatus.ONBOARDING], color: 'text-blue-600 dark:text-blue-400', dotColor: '#3b82f6' },
    { label: 'Pending', statuses: [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED], color: 'text-slate-500 dark:text-slate-400', dotColor: '#94a3b8' },
    { label: 'Hold', statuses: [DealershipStatus.HOLD], color: 'text-orange-600 dark:text-orange-400', dotColor: '#f97316' },
    { label: 'Cancelled', statuses: [DealershipStatus.CANCELLED], color: 'text-red-600 dark:text-red-400', dotColor: '#ef4444' },
  ];

  const monthLabel = new Date(reportingMonth + '-15').toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="animate-in fade-in duration-700 relative">
      {/* ── Time Filter Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Preset buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A]">
          {presets.map(p => (
            <button
              key={p.key}
              onClick={() => handlePresetClick(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePreset === p.key ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div className="flex items-center gap-2 bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 dark:border-[#38383A]">
          <Calendar size={14} className="text-slate-400 ml-1" />
          <input
            type="date"
            value={customRange.start}
            onChange={e => {
              setCustomRange(r => ({ ...r, start: e.target.value }));
              setActivePreset('custom');
            }}
            className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
          />
          <span className="text-slate-300 dark:text-slate-600 text-xs">–</span>
          <input
            type="date"
            value={customRange.end}
            onChange={e => {
              setCustomRange(r => ({ ...r, end: e.target.value }));
              setActivePreset('custom');
            }}
            className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
          />
          {(customRange.start || customRange.end) && (
            <button
              onClick={() => {
                setCustomRange({ start: '', end: '' });
                handlePresetClick('this_month');
              }}
              className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Reporting month selector */}
        <div className="flex items-center gap-2 bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 dark:border-[#38383A] ml-auto">
          <span className="text-xs font-semibold text-slate-400 ml-1">Lifecycle Month</span>
          <input
            type="month"
            value={reportingMonth}
            onChange={e => setReportingMonth(e.target.value)}
            className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
          />
        </div>
      </div>

      {/* ── Section 1: Portfolio Health ─────────────────────────────────────── */}
      <Section title="Portfolio Health" icon={<Building2 size={15} />} accent="bg-blue-500/5 dark:bg-blue-500/10 border-blue-200/40 dark:border-blue-500/20">
        {/* Top KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <KpiCard icon={<Building2 size={15} className="text-slate-500" />} label="Total Dealerships" value={metrics.totalDealershipsCount} iconBg="bg-slate-100 dark:bg-slate-700" clickable onClick={() => onNavigateToDealerships?.({})} />
          <KpiCard icon={<DollarSign size={15} className="text-emerald-500" />} label="Revenue Booked" value={formatCurrency(metrics.totalRevenue, true)} iconBg="bg-emerald-50 dark:bg-emerald-900/30" clickable onClick={() => onNavigateToDealerships?.({})} />
          <KpiCard icon={<Clock size={15} className="text-violet-500" />} label="Avg Days to Go-Live" value={metrics.avgDaysToGoLive !== null ? `${metrics.avgDaysToGoLive}d` : '—'} iconBg="bg-violet-50 dark:bg-violet-900/30" />
          <KpiCard icon={<TrendingUp size={15} className="text-blue-500" />} label={`Net Live (${monthLabel})`} value={metrics.netLiveChange >= 0 ? `+${metrics.netLiveChange}` : `${metrics.netLiveChange}`} iconBg="bg-blue-50 dark:bg-blue-900/30" />
          <KpiCard icon={<CheckCircle size={15} className="text-emerald-500" />} label="Live / Legacy" value={(metrics.statusCounts[DealershipStatus.LIVE] || 0) + (metrics.statusCounts[DealershipStatus.LEGACY] || 0)} iconBg="bg-emerald-50 dark:bg-emerald-900/30" clickable onClick={() => onNavigateToDealerships?.({ status: DealershipStatus.LIVE })} />
        </div>

        {/* Lifecycle flow cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Received', value: metrics.lifecycle.received, prev: metrics.prevLifecycle.received, color: 'text-cyan-600 dark:text-cyan-400', iconBg: 'bg-cyan-50 dark:bg-cyan-900/30', icon: <Calendar size={15} className="text-cyan-500" />, filter: { received_month: reportingMonth } },
            { label: 'Onboarding', value: metrics.lifecycle.onboarding, prev: metrics.prevLifecycle.onboarding, color: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-900/30', icon: <UserPlus size={15} className="text-blue-500" />, filter: { onboarding_month: reportingMonth } },
            { label: 'Go-Live', value: metrics.lifecycle.goLive, prev: metrics.prevLifecycle.goLive, color: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: <Rocket size={15} className="text-emerald-500" />, filter: { go_live_month: reportingMonth } },
            { label: 'Termed', value: metrics.lifecycle.termed, prev: metrics.prevLifecycle.termed, color: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-50 dark:bg-red-900/30', icon: <X size={15} className="text-red-500" />, filter: { term_month: reportingMonth } },
          ].map(item => (
            <div
              key={item.label}
              className="p-3 rounded-2xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A] cursor-pointer hover:ring-1 hover:ring-blue-500/30 transition-all"
              onClick={() => onNavigateToDealerships?.({ ...item.filter, status: '', received_month: '', onboarding_month: '', go_live_month: '', term_month: '', ...item.filter })}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${item.iconBg}`}>{item.icon}</div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{item.label}</span>
              </div>
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.value}
                <DeltaBadge current={item.value} prev={item.prev} />
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">{monthLabel}</div>
            </div>
          ))}
        </div>

        {/* Status exclusion toggles */}
        <div className="flex flex-wrap gap-2">
          {statusGroupDefs.map(sg => {
            const excluded = isExcluded(sg.statuses);
            const count = sg.statuses.reduce((s, st) => s + (metrics.statusCounts[st] || 0), 0);
            return (
              <button
                key={sg.label}
                onClick={() => toggleStatus(sg.statuses)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  excluded ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-50' : `bg-white/80 dark:bg-[#2C2C2E] border-slate-200/60 dark:border-[#38383A] ${sg.color}`
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: excluded ? undefined : sg.dotColor }} />
                {sg.label} ({count})
                {excluded && <span className="text-xs text-red-400 ml-1">off</span>}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Section 2: Pipeline Flow ─────────────────────────────────────────── */}
      <Section title="Pipeline Flow — Last 18 Months" icon={<BarChart3 size={15} />} accent="bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-200/40 dark:border-cyan-500/20">
        <div className={`grid gap-4 ${selectedChartMonth ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Chart */}
          <div className={selectedChartMonth ? 'lg:col-span-2' : ''}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics.pipelineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} onClick={(data: any) => {
                if (data?.activePayload?.[0]?.payload?.month) setSelectedChartMonth(data.activePayload[0].payload.month);
              }}>
                <defs>
                  {[
                    { key: 'received', color: PIPELINE_COLORS.received },
                    { key: 'onboarding', color: PIPELINE_COLORS.onboarding },
                    { key: 'goLive', color: PIPELINE_COLORS.goLive },
                    { key: 'termed', color: PIPELINE_COLORS.termed },
                  ].map(({ key, color }) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }} labelStyle={{ color: '#e2e8f0', fontWeight: 600 }} itemStyle={{ color: '#cbd5e1' }} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
                <Area type="monotone" dataKey="received" stroke={PIPELINE_COLORS.received} fill={`url(#grad-received)`} strokeWidth={1.5} name="Received" />
                <Area type="monotone" dataKey="onboarding" stroke={PIPELINE_COLORS.onboarding} fill={`url(#grad-onboarding)`} strokeWidth={1.5} name="Onboarding" />
                <Area type="monotone" dataKey="goLive" stroke={PIPELINE_COLORS.goLive} fill={`url(#grad-goLive)`} strokeWidth={1.5} name="Go-Live" />
                <Area type="monotone" dataKey="termed" stroke={PIPELINE_COLORS.termed} fill={`url(#grad-termed)`} strokeWidth={1.5} name="Termed" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Drill-down panel */}
          {selectedChartMonth && (() => {
            const row = metrics.pipelineChartData.find(r => r.month === selectedChartMonth);
            if (!row) return null;
            return (
              <div className="bg-white/80 dark:bg-[#2C2C2E] rounded-2xl border border-slate-200/60 dark:border-[#38383A] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/60 dark:border-[#38383A]">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{row.label}</div>
                  <button onClick={() => setSelectedChartMonth(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 ml-2">
                    <X size={14} />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { stage: 'received', count: row.received, filter: { received_month: selectedChartMonth } },
                    { stage: 'onboarding', count: row.onboarding, filter: { onboarding_month: selectedChartMonth } },
                    { stage: 'goLive', count: row.goLive, filter: { go_live_month: selectedChartMonth } },
                    { stage: 'termed', count: row.termed, filter: { term_month: selectedChartMonth } },
                  ].map(item => (
                    <button
                      key={item.stage}
                      onClick={() => {
                        onNavigateToDealerships?.(item.filter as any);
                        setSelectedChartMonth(null);
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="font-semibold capitalize text-slate-600 dark:text-slate-300">{item.stage.replace('goLive', 'Go-Live').replace('termed', 'Termed')}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </Section>

      {/* ── Section 3: Revenue ──────────────────────────────────────────────── */}
      <Section title="Revenue" icon={<DollarSign size={15} />} accent="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200/40 dark:border-emerald-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revenue by Status */}
          <div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">By Status</div>
            {metrics.revenueByStatus.filter(s => s.revenue > 0).length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No revenue data</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={metrics.revenueByStatus.filter(s => s.revenue > 0)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }} labelStyle={{ color: '#e2e8f0', fontWeight: 600 }} itemStyle={{ color: '#cbd5e1' }} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {metrics.revenueByStatus.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by Product */}
          <div>
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">By Product (Order Date Range)</div>
            {metrics.revenueByProduct.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No orders in range</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={metrics.revenueByProduct.filter(p => p.revenue > 0)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }} labelStyle={{ color: '#e2e8f0', fontWeight: 600 }} itemStyle={{ color: '#cbd5e1' }} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue trend */}
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">Cumulative Revenue by Go-Live Date — Last 18 Months</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={metrics.revenueTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }} labelStyle={{ color: '#e2e8f0', fontWeight: 600 }} itemStyle={{ color: '#cbd5e1' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#grad-rev)" strokeWidth={1.5} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Enterprise Group */}
          {metrics.revenueByGroupData.length > 0 && (
            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">By Enterprise Group (Top 8)</div>
              <ResponsiveContainer width="100%" height={Math.min(160, metrics.revenueByGroupData.length * 25 + 20)}>
                <BarChart data={metrics.revenueByGroupData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => formatCurrency(v, true)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }} labelStyle={{ color: '#e2e8f0', fontWeight: 600 }} itemStyle={{ color: '#cbd5e1' }} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Section>

      {/* ── Section 4: Enterprise Groups ─────────────────────────────────────── */}
      {metrics.groupStats.length > 0 && (
        <Section title="Enterprise Groups" icon={<Users size={15} />} accent="bg-violet-500/5 dark:bg-violet-500/10 border-violet-200/40 dark:border-violet-500/20">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-200/60 dark:border-[#38383A]">
                  <th className="text-left pb-2 font-semibold">Group</th>
                  <th className="text-center pb-2 font-semibold">Total</th>
                  <th className="text-center pb-2 font-semibold text-emerald-500">Live</th>
                  <th className="text-center pb-2 font-semibold text-blue-500">Onboarding</th>
                  <th className="text-center pb-2 font-semibold text-orange-500">Hold</th>
                  <th className="text-center pb-2 font-semibold text-red-500">Cancelled</th>
                  <th className="text-right pb-2 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {metrics.groupStats.map(g => {
                  const live = (g.statusBreakdown[DealershipStatus.LIVE] || 0) + (g.statusBreakdown[DealershipStatus.LEGACY] || 0);
                  const onboarding = g.statusBreakdown[DealershipStatus.ONBOARDING] || 0;
                  const hold = g.statusBreakdown[DealershipStatus.HOLD] || 0;
                  const cancelled = g.statusBreakdown[DealershipStatus.CANCELLED] || 0;
                  return (
                    <tr key={g.id} className="border-b border-slate-100/60 dark:border-slate-800/50 last:border-0 hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer transition-colors" onClick={() => onNavigateToDealerships?.({ group: g.id })}>
                      <td className="py-2 font-medium text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{g.name}</td>
                      <td className="py-2 text-center font-bold text-slate-700 dark:text-slate-200">{g.count}</td>
                      <td className="py-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">{live || '—'}</td>
                      <td className="py-2 text-center font-semibold text-blue-600 dark:text-blue-400">{onboarding || '—'}</td>
                      <td className="py-2 text-center font-semibold text-orange-600 dark:text-orange-400">{hold || '—'}</td>
                      <td className="py-2 text-center font-semibold text-red-600 dark:text-red-400">{cancelled || '—'}</td>
                      <td className="py-2 text-right font-semibold text-slate-600 dark:text-slate-300">{formatCurrency(g.revenue, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Section 5: Team Performance ─────────────────────────────────────── */}
      {metrics.teamStats.length > 0 && (
        <Section title="Team Performance" icon={<Briefcase size={15} />} accent="bg-orange-500/5 dark:bg-orange-500/10 border-orange-200/40 dark:border-orange-500/20">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-200/60 dark:border-[#38383A]">
                  <th className="text-left pb-2 font-semibold">Name</th>
                  <th className="text-center pb-2 font-semibold">Total</th>
                  <th className="text-center pb-2 font-semibold text-emerald-500">Live</th>
                  <th className="text-center pb-2 font-semibold text-blue-500">Onboarding</th>
                  <th className="text-center pb-2 font-semibold text-orange-500">Hold</th>
                  <th className="text-center pb-2 font-semibold text-slate-500">Pending</th>
                  <th className="text-center pb-2 font-semibold text-red-500">Cancelled</th>
                </tr>
              </thead>
              <tbody>
                {metrics.teamStats.map(m => (
                  <tr key={m.name} className="border-b border-slate-100/60 dark:border-slate-800/50 last:border-0 hover:bg-white/60 dark:hover:bg-white/5">
                    <td className="py-2 font-medium text-slate-700 dark:text-slate-200">
                      {m.name}
                      <span className="ml-1.5 text-xs text-slate-400">{m.role}</span>
                    </td>
                    <td className="py-2 text-center font-bold text-slate-700 dark:text-slate-200">{m.total}</td>
                    <td className="py-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">{m.live || '—'}</td>
                    <td className="py-2 text-center font-semibold text-blue-600 dark:text-blue-400">{m.onboarding || '—'}</td>
                    <td className="py-2 text-center font-semibold text-orange-600 dark:text-orange-400">{m.hold || '—'}</td>
                    <td className="py-2 text-center font-semibold text-slate-500">{m.pending || '—'}</td>
                    <td className="py-2 text-center font-semibold text-red-600 dark:text-red-400">{m.cancelled || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Section 6: Pipeline Detail Table ────────────────────────────────── */}
      <Section
        title="Pipeline Detail — Last 18 Months"
        icon={<BarChart3 size={15} />}
        accent="bg-slate-500/5 dark:bg-slate-500/10 border-slate-200/40 dark:border-slate-500/20"
        headerRight={
          <button onClick={() => setPipelineTableOpen(v => !v)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {pipelineTableOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {pipelineTableOpen ? 'Collapse' : 'Expand'}
          </button>
        }
      >
        {pipelineTableOpen ? (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 px-3 py-1.5 text-xs font-bold uppercase text-slate-400 border-b border-slate-200/60 dark:border-[#38383A]">
                {['Month', 'Received', 'Onboarding', 'Go-Live', 'Termed', 'R→O %', 'O→L %'].map(h => (
                  <div key={h} className={h === 'Month' ? '' : 'text-center'}>
                    {h}
                  </div>
                ))}
              </div>
              {metrics.pipelineTableData.map(row => {
                const isSelected = row.month === reportingMonth;
                return (
                  <div
                    key={row.month}
                    className={`grid grid-cols-7 text-xs border-b border-slate-200/60 dark:border-[#38383A] last:border-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-200 dark:ring-blue-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => setReportingMonth(row.month)}
                  >
                    <div className={`px-3 py-2 font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                      {row.label}
                      {isSelected && <span className="ml-1 text-blue-500 text-[10px]">•</span>}
                    </div>
                    <div
                      className="text-center py-2 font-bold text-cyan-700 dark:text-cyan-300 hover:underline"
                      onClick={e => {
                        e.stopPropagation();
                        onNavigateToDealerships?.({ received_month: row.month, status: '', onboarding_month: '', go_live_month: '', term_month: '' });
                      }}
                    >
                      {row.received || '—'}
                    </div>
                    <div
                      className="text-center py-2 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={e => {
                        e.stopPropagation();
                        onNavigateToDealerships?.({ onboarding_month: row.month, status: '', received_month: '', go_live_month: '', term_month: '' });
                      }}
                    >
                      {row.onboarding || '—'}
                    </div>
                    <div
                      className="text-center py-2 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      onClick={e => {
                        e.stopPropagation();
                        onNavigateToDealerships?.({ go_live_month: row.month, status: '', received_month: '', onboarding_month: '', term_month: '' });
                      }}
                    >
                      {row.goLive || '—'}
                    </div>
                    <div
                      className="text-center py-2 font-bold text-red-600 dark:text-red-400 hover:underline"
                      onClick={e => {
                        e.stopPropagation();
                        onNavigateToDealerships?.({ term_month: row.month, status: '', received_month: '', onboarding_month: '', go_live_month: '' });
                      }}
                    >
                      {row.termed || '—'}
                    </div>
                    <div className="text-center py-2 text-slate-500 dark:text-slate-400">{row.recvToOnbPct !== null ? `${row.recvToOnbPct}%` : '—'}</div>
                    <div className="text-center py-2 text-slate-500 dark:text-slate-400">{row.onbToLivePct !== null ? `${row.onbToLivePct}%` : '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-2">
            Click <span className="font-semibold">Expand</span> to view the 18-month pipeline detail table
          </div>
        )}
      </Section>
    </div>
  );
};

export default DashboardPage;
