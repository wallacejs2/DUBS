import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import {
  AlertTriangle, BarChart3, Building2, Calendar, Car, Clock, DollarSign, Layers,
  Rocket, Tag, TrendingUp, UserPlus, X, ArrowRight
} from 'lucide-react';
import { useDealerships, useOrders, useProductPricing } from '../hooks';
import { DealershipFilterState, DealershipStatus, FeeType, Order, ProductCode } from '../types';
import { ProductSalesEntry, resolveLineAmount, summarizeByProduct, summarizeOrders, summarizeProducts, getActiveOrders, allProductCodes } from '../lib/orderPricing';
import { encodeOemFilter, groupOems, hasNoOems, normalizeOems, OemFilterKind } from '../lib/oem';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onNavigateToDealerships?: (filters: Partial<DealershipFilterState>) => void;
}

type S2Preset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';

/** Section 6 chart rollup: one bar per OEM Group, or one bar per Make. */
type OemChartMode = OemFilterKind;

/** One row of the Section 6 chart: a group/make label, a total, and a count per status. */
type OemChartRow = { label: string; total: number } & Partial<Record<DealershipStatus, number>>;

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

const EstPill: React.FC<{ title?: string }> = ({ title }) => (
  <span
    className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 leading-none"
    title={title ?? 'Includes estimated default pricing for unpriced line items'}
  >
    est.
  </span>
);

interface ProductSalesTableProps {
  sales: Map<string, ProductSalesEntry>;
  productCodes: string[];
}

const ProductSalesTable: React.FC<ProductSalesTableProps> = ({ sales, productCodes }) => {
  // Show list products first (in list order), then any code only present on orders
  const active = [...productCodes, ...[...sales.keys()].filter(c => !productCodes.includes(c))]
    .filter(code => (sales.get(code)?.count ?? 0) > 0);
  if (active.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-slate-600 italic">No product sales data for this period.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {active.map(code => {
        const { count, monthly, oneTime, estimatedCount } = sales.get(code)!;
        return (
          <div
            key={code}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-[#2C2C2E] border border-slate-200/60 dark:border-[#38383A]"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: productColor(code, productCodes) }}
            />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{code}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{count.toLocaleString()}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{formatCurrency(monthly, true)}/mo</span>
            {oneTime > 0 && (
              <span className="text-xs text-violet-500 dark:text-violet-400">+{formatCurrency(oneTime, true)} one-time</span>
            )}
            {estimatedCount > 0 && <EstPill title={`${estimatedCount} line item${estimatedCount === 1 ? '' : 's'} using estimated default pricing`} />}
          </div>
        );
      })}
    </div>
  );
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const GOLIVE_COLOR = '#10b981';
/** Vertical space per OEM Group / Make row in the OEM bar chart (bar + spacer). */
const OEM_ROW_HEIGHT = 24;

/** Stack segment colour per dealership status in the OEM bar chart (aligned with STATUS_TOGGLE_GROUPS dots). */
const STATUS_BAR_COLORS: Record<DealershipStatus, string> = {
  [DealershipStatus.LIVE]: '#10b981',
  [DealershipStatus.LEGACY]: '#14b8a6',
  [DealershipStatus.ONBOARDING]: '#6366f1',
  [DealershipStatus.DMT_PENDING]: '#94a3b8',
  [DealershipStatus.DMT_APPROVED]: '#64748b',
  [DealershipStatus.HOLD]: '#f97316',
  [DealershipStatus.CANCELLED]: '#ef4444',
};

const OEM_CHART_MODES: Array<{ key: OemChartMode; label: string }> = [
  { key: 'group', label: 'OEM Groups' },
  { key: 'make', label: 'Makes' },
];

const PRODUCT_COLORS: Record<string, string> = {
  [ProductCode.P15391_SE]: '#3b82f6',
  [ProductCode.P15392_MANAGED]: '#10b981',
  [ProductCode.P15435_ADDL_WEB]: '#8b5cf6',
  [ProductCode.P15436_MNGD_ADDL]: '#f59e0b',
  [ProductCode.P15382_PREV_SE]: '#06b6d4',
  [ProductCode.P15381_PREV_AA]: '#f97316',
  [ProductCode.P15390_SMS]: '#ec4899',
};

// Palette for user-added products (assigned by position so a product keeps its color)
const EXTRA_PRODUCT_COLORS = ['#14b8a6', '#a855f7', '#ef4444', '#84cc16', '#0ea5e9', '#d946ef', '#eab308', '#64748b'];

const productColor = (code: string, productCodes: string[]): string => {
  if (PRODUCT_COLORS[code]) return PRODUCT_COLORS[code];
  const extras = productCodes.filter(c => !PRODUCT_COLORS[c]);
  const idx = extras.indexOf(code);
  return EXTRA_PRODUCT_COLORS[(idx >= 0 ? idx : extras.length) % EXTRA_PRODUCT_COLORS.length];
};

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
  const [oemChartMode, setOemChartMode] = useState<OemChartMode>('group');

  const { dealerships } = useDealerships();
  const { orders } = useOrders();
  const { pricing, productCodes: listedProductCodes } = useProductPricing();

  // Only each dealership's ACTIVE DMT order (most recent on or before today)
  // feeds revenue and product metrics. Previous orders are excluded so a
  // re-order never double counts the same products.
  const activeOrders = useMemo(() => getActiveOrders(orders), [orders]);

  // ─── Section 1 Metrics ─────────────────────────────────────────────────────
  const s1Metrics = useMemo(() => {
    const filteredDealerships = dealerships.filter(d => !s1ExcludedStatuses.includes(d.status));
    const filteredIds = new Set(filteredDealerships.map(d => d.id));
    const filteredOrders = activeOrders.filter(o => filteredIds.has(o.dealership_id));

    const totalDealerships = filteredDealerships.length;
    // Revenue split: monthly recurring vs one-time fees. Unpriced line items
    // use the product default price and are flagged as estimated.
    const revenue = summarizeOrders(filteredOrders, pricing);
    const totalLineItems = revenue.lineCount;
    const monthlyRevenue = revenue.monthly;
    const oneTimeRevenue = revenue.oneTime;
    const hasEstimated = revenue.hasEstimated;

    // Build per-dealer order index for reallocated revenue
    const ordersByDealer = new Map<string, Order[]>();
    for (const o of filteredOrders) {
      const list = ordersByDealer.get(o.dealership_id) ?? [];
      list.push(o);
      ordersByDealer.set(o.dealership_id, list);
    }
    // Reallocated = monthly recurring only (one-time fees excluded) minus the per-dealer allocation
    const reallocatedRevenue = filteredDealerships.reduce((total, d) => {
      const dealerMonthly = summarizeOrders(ordersByDealer.get(d.id) ?? [], pricing).monthly;
      return total + (dealerMonthly - 2500);
    }, 0);

    // Status counts from unfiltered dataset (for toggle button labels)
    const statusCounts = dealerships.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const productSales = summarizeByProduct(filteredOrders, pricing);

    return { totalDealerships, totalLineItems, monthlyRevenue, oneTimeRevenue, hasEstimated, reallocatedRevenue, statusCounts, productSales };
  }, [dealerships, activeOrders, pricing, s1ExcludedStatuses]);

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

    // Active orders received within the range (previous orders excluded)
    const s2ProductSales = summarizeByProduct(activeOrders.filter(o => inRange(o.received_date)), pricing);

    return { received, onboarding, live, termed, avgDaysToGoLive, productSales: s2ProductSales };
  }, [dealerships, orders, activeOrders, pricing, s2Range]);

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

  // ─── Section 4 Chart Data: Cumulative Product Monthly Recurring Revenue ───
  // Monthly recurring only: one-time fees are excluded so the running total
  // reflects run-rate. Unpriced lines use the product default (estimated).
  const productRevenue = useMemo(() => {
    const now = new Date();
    const months: Array<{ month: string; label: string }> = [];
    for (let i = 17; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      months.push({ month: mk, label });
    }

    // Group per-month revenue per product (non-cumulative)
    const perMonth = new Map<string, Map<string, number>>();
    for (const o of activeOrders) {
      const mk = getMonthKey(o.received_date);
      if (!mk) continue;
      if (!o.products) continue;
      const bucket = perMonth.get(mk) ?? new Map<string, number>();
      for (const p of o.products) {
        const line = resolveLineAmount(p, pricing);
        if (line.feeType !== FeeType.MONTHLY) continue;
        bucket.set(p.product_code, (bucket.get(p.product_code) ?? 0) + line.amount);
      }
      perMonth.set(mk, bucket);
    }

    // Running totals in chronological order — include ALL earlier orders
    // in the first visible bucket (so buckets reflect cumulative all-time
    // revenue on or before the last day of that month).
    const firstMk = months[0].month;
    const priorTotals: Record<string, number> = {};
    const productCodes = allProductCodes(listedProductCodes, activeOrders);
    for (const code of productCodes) priorTotals[code] = 0;
    for (const [mk, bucket] of perMonth.entries()) {
      if (mk < firstMk) {
        for (const [code, v] of bucket.entries()) {
          priorTotals[code] = (priorTotals[code] ?? 0) + v;
        }
      }
    }

    const running: Record<string, number> = { ...priorTotals };
    const chartData = months.map(({ month, label }) => {
      const bucket = perMonth.get(month);
      if (bucket) {
        for (const [code, v] of bucket.entries()) {
          running[code] = (running[code] ?? 0) + v;
        }
      }
      const row: Record<string, string | number> = { month, label };
      for (const code of productCodes) {
        row[code] = running[code] ?? 0;
      }
      return row;
    });

    // Omit product codes with zero cumulative revenue across all 18 months
    const activeCodes = productCodes.filter(code =>
      chartData.some(row => {
        const v = row[code];
        return typeof v === 'number' && v > 0;
      })
    );

    return { chartData, activeCodes };
  }, [activeOrders, pricing, listedProductCodes]);

  // ─── Section 5 Chart Data: Cumulative Revenue by Go-Live Month ─────────────
  const goLiveRevenueTrend = useMemo(() => {
    const now = new Date();
    const months: Array<{ month: string; label: string }> = [];
    for (let i = 17; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      months.push({ month: mk, label });
    }
    const firstMk = months[0].month;

    // Per-dealer monthly recurring revenue across that dealer's orders (one-time fees excluded)
    const dealerRevenue = new Map<string, number>();
    for (const o of activeOrders) {
      if (!o.products) continue;
      const rev = summarizeProducts(o.products, pricing).monthly;
      dealerRevenue.set(o.dealership_id, (dealerRevenue.get(o.dealership_id) ?? 0) + rev);
    }

    // Assign each qualifying dealership's revenue to its go-live month bucket
    const revenueByMonth = new Map<string, number>();
    let priorRevenue = 0;
    for (const d of dealerships) {
      if (!d.go_live_date) continue;
      const mk = getMonthKey(d.go_live_date);
      if (!mk) continue;
      const rev = dealerRevenue.get(d.id) ?? 0;
      if (mk < firstMk) {
        priorRevenue += rev;
      } else {
        revenueByMonth.set(mk, (revenueByMonth.get(mk) ?? 0) + rev);
      }
    }

    // Running cumulative across the visible window — priors seed the start
    let running = priorRevenue;
    return months.map(({ month, label }) => {
      running += revenueByMonth.get(month) ?? 0;
      return { month, label, revenue: running };
    });
  }, [dealerships, activeOrders, pricing]);

  // ─── Section 6 Chart Data: Dealerships by OEM, stacked by status ───────────
  // One bar per OEM Group (or per Make), split into a segment per dealership status.
  // A dealership counts once under each group it represents (GM with Chevrolet + Buick
  // adds 1 to GM), or once under each Make in Make mode, so bars can sum to more than
  // the total. Statuses no dealership has are left out of the stack and legend.
  const oemChartData = useMemo(() => {
    const rows = new Map<string, OemChartRow>();
    const statusTotals = new Map<DealershipStatus, number>();
    let missing = 0;
    for (const d of dealerships) {
      if (hasNoOems(d.oems)) { missing += 1; continue; }
      const labels = oemChartMode === 'group'
        ? groupOems(d.oems).map(g => g.group)
        : normalizeOems(d.oems);
      for (const label of labels) {
        const row = rows.get(label) ?? { label, total: 0 };
        row[d.status] = (row[d.status] ?? 0) + 1;
        row.total += 1;
        rows.set(label, row);
        statusTotals.set(d.status, (statusTotals.get(d.status) ?? 0) + 1);
      }
    }
    const data = [...rows.values()]
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
    const statuses = Object.values(DealershipStatus).filter(s => (statusTotals.get(s) ?? 0) > 0);
    return { data, statuses, missing };
  }, [dealerships, oemChartMode]);

  // ─── Section 6 Totals: dealership-level OEM metrics ─────────────────────────
  // Unlike the chart rows, every dealership is counted ONCE here regardless of how
  // many Makes it has, so "With OEM" + "Missing OEM" always equals the dealership
  // total. Status totals count dealerships with an OEM recorded, so they match the
  // chart's population without double-counting multi-Make dealerships.
  const oemTotals = useMemo(() => {
    const groups = new Set<string>();
    const makes = new Set<string>();
    const statusCounts: Partial<Record<DealershipStatus, number>> = {};
    let withOem = 0;
    let missing = 0;
    let multiMake = 0;
    let multiGroup = 0;
    let makeAssignments = 0;
    for (const d of dealerships) {
      if (hasNoOems(d.oems)) { missing += 1; continue; }
      const dealerMakes = normalizeOems(d.oems);
      const dealerGroups = groupOems(d.oems).map(g => g.group);
      withOem += 1;
      makeAssignments += dealerMakes.length;
      if (dealerMakes.length > 1) multiMake += 1;
      if (dealerGroups.length > 1) multiGroup += 1;
      dealerMakes.forEach(m => makes.add(m));
      dealerGroups.forEach(g => groups.add(g));
      statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;
    }
    const avgMakes = withOem > 0 ? makeAssignments / withOem : 0;
    return {
      withOem,
      missing,
      total: withOem + missing,
      groupCount: groups.size,
      makeCount: makes.size,
      multiMake,
      multiGroup,
      makeAssignments,
      avgMakes,
      statusCounts,
    };
  }, [dealerships]);

  // Total label at the end of each OEM bar. Every stacked segment gets a LabelList,
  // but the value only resolves on the row's LAST non-empty segment, so the total
  // sits at the bar's right edge even for rows missing the top-most status. The
  // dataKey reads the row payload directly (not a list index) because Recharts
  // drops empty segments from a Bar's label entries.
  const oemBarTotalValue = (statusIndex: number) => (row: OemChartRow): number | undefined => {
    const status = oemChartData.statuses[statusIndex];
    if (!(row[status] ?? 0)) return undefined;
    const hasLater = oemChartData.statuses.slice(statusIndex + 1).some(s => (row[s] ?? 0) > 0);
    return hasLater ? undefined : row.total;
  };
  const renderOemBarTotal = (props: Record<string, unknown>) => {
    const { value } = props;
    if (typeof value !== 'number') return null;
    const x = Number(props.x) + Number(props.width) + 6;
    const y = Number(props.y) + Number(props.height) / 2;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return (
      <text x={x} y={y} dy={3.5} fontSize={10} fontWeight={600} fill="#94a3b8">
        {value.toLocaleString()}
      </text>
    );
  };

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
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
            label="Monthly Recurring"
            value={formatCurrency(s1Metrics.monthlyRevenue, true)}
            sub={s1Metrics.hasEstimated ? <span className="ml-1.5 align-middle"><EstPill /></span> : undefined}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          />
          <KpiCard
            icon={<DollarSign size={15} className="text-violet-500" />}
            label="One-Time Fees"
            value={formatCurrency(s1Metrics.oneTimeRevenue, true)}
            sub={s1Metrics.hasEstimated ? <span className="ml-1.5 align-middle"><EstPill /></span> : undefined}
            iconBg="bg-violet-50 dark:bg-violet-900/30"
          />
          <KpiCard
            icon={<TrendingUp size={15} className="text-blue-500" />}
            label="Reallocated Revenue"
            value={formatCurrency(s1Metrics.reallocatedRevenue, true)}
            sub={s1Metrics.hasEstimated ? <span className="ml-1.5 align-middle"><EstPill /></span> : undefined}
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

        <div className="mt-4 border-t border-slate-200/40 dark:border-slate-700/40 pt-4">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
            Product Sales — All Time
          </div>
          <ProductSalesTable sales={s1Metrics.productSales} productCodes={listedProductCodes} />
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

        <div className="mt-4 border-t border-slate-200/40 dark:border-slate-700/40 pt-4">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
            Product Sales — Selected Range
          </div>
          <ProductSalesTable sales={s2Metrics.productSales} productCodes={listedProductCodes} />
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

      {/* ── Section 4: Product Revenue — Last 18 Months ────────────────────── */}
      <Section
        title="Product Monthly Recurring Revenue — Last 18 Months"
        icon={<DollarSign size={15} />}
        accent="bg-violet-500/5 dark:bg-violet-500/10 border-violet-200/40 dark:border-violet-500/20"
      >
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          Cumulative monthly recurring revenue by order received month, using each dealership's active DMT order only. Excludes one-time fees and previous orders; includes estimated default pricing for unpriced line items.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={productRevenue.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => formatCurrency(v, true)}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
              itemStyle={{ color: '#cbd5e1' }}
              cursor={{ fill: 'rgba(148,163,184,0.05)' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            {productRevenue.activeCodes.map((code, i) => (
              <Bar
                key={code}
                dataKey={code}
                name={code}
                stackId="revenue"
                fill={productColor(code, listedProductCodes)}
                radius={i === productRevenue.activeCodes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Section 5: Cumulative Revenue by Go-Live Date ──────────────────── */}
      <Section
        title="Cumulative Monthly Recurring by Go-Live Date — Last 18 Months"
        icon={<TrendingUp size={15} />}
        accent="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200/40 dark:border-emerald-500/20"
      >
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          Each dealership's active DMT order monthly recurring revenue is attributed to its go-live month. Excludes one-time fees and previous orders; includes estimated default pricing for unpriced line items.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={goLiveRevenueTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-s5-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => formatCurrency(v, true)}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
              itemStyle={{ color: '#cbd5e1' }}
              cursor={{ fill: 'rgba(148,163,184,0.05)' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              fill="url(#grad-s5-rev)"
              strokeWidth={1.5}
              name="Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Section 6: Dealerships by OEM ──────────────────────────────────── */}
      <Section
        title="Dealerships by OEM"
        icon={<Car size={15} />}
        accent="bg-blue-500/5 dark:bg-blue-500/10 border-blue-200/40 dark:border-blue-500/20"
        headerRight={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800" role="tablist" aria-label="Chart rollup">
              {OEM_CHART_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={oemChartMode === key}
                  onClick={() => setOemChartMode(key)}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                    oemChartMode === key
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {oemChartData.missing > 0 && (
              <button
                onClick={() => onNavigateToDealerships?.({ issue: 'no_oem', oem: '' })}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
                title="View dealerships with no OEM recorded"
              >
                {oemChartData.missing} missing OEM
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <KpiCard
            icon={<Building2 size={15} className="text-blue-500" />}
            label="With OEM"
            value={oemTotals.withOem.toLocaleString()}
            sub={
              <span className="ml-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 align-middle">
                of {oemTotals.total.toLocaleString()}
              </span>
            }
            iconBg="bg-blue-50 dark:bg-blue-900/30"
          />
          <KpiCard
            icon={<AlertTriangle size={15} className={oemTotals.missing > 0 ? 'text-amber-500' : 'text-slate-400'} />}
            label="Missing OEM"
            value={oemTotals.missing.toLocaleString()}
            iconBg={oemTotals.missing > 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-700'}
            clickable={oemTotals.missing > 0}
            onClick={oemTotals.missing > 0 ? () => onNavigateToDealerships?.({ issue: 'no_oem', oem: '' }) : undefined}
          />
          <KpiCard
            icon={<Layers size={15} className="text-indigo-500" />}
            label="OEM Groups"
            value={oemTotals.groupCount.toLocaleString()}
            sub={
              <span className="ml-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 align-middle">
                {oemTotals.multiGroup.toLocaleString()} multi-group
              </span>
            }
            iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          />
          <KpiCard
            icon={<Tag size={15} className="text-violet-500" />}
            label="Makes"
            value={oemTotals.makeCount.toLocaleString()}
            sub={
              <span className="ml-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 align-middle">
                {oemTotals.multiMake.toLocaleString()} multi-make
              </span>
            }
            iconBg="bg-violet-50 dark:bg-violet-900/30"
          />
          <KpiCard
            icon={<Car size={15} className="text-emerald-500" />}
            label="Avg Makes"
            value={oemTotals.withOem > 0 ? oemTotals.avgMakes.toFixed(1) : '—'}
            sub={
              oemTotals.withOem > 0 ? (
                <span className="ml-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 align-middle">
                  {oemTotals.makeAssignments.toLocaleString()} total
                </span>
              ) : undefined
            }
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_TOGGLE_GROUPS.map(sg => {
            const count = sg.statuses.reduce((sum, st) => sum + (oemTotals.statusCounts[st] ?? 0), 0);
            return (
              <div
                key={sg.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white/80 dark:bg-[#2C2C2E] border-slate-200/60 dark:border-[#38383A] ${sg.color}`}
                title={`${count.toLocaleString()} dealership${count === 1 ? '' : 's'} with an OEM recorded`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sg.dotColor }} />
                {sg.label} ({count.toLocaleString()})
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          {oemChartMode === 'group'
            ? 'Number of dealerships representing each OEM Group, split by dealership status. A dealership with Makes in several groups is counted once under each group. Click a segment to view those dealerships.'
            : 'Number of dealerships representing each Make, split by dealership status. A dealership with several Makes is counted once under each Make. Click a segment to view those dealerships.'}
        </p>
        {oemChartData.data.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-600 italic">No dealerships have an OEM recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={oemChartData.data.length * OEM_ROW_HEIGHT + 60}>
            <BarChart
              data={oemChartData.data}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 10, bottom: 0 }}
              barCategoryGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={100}
                interval={0}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => `${v.toLocaleString()} dealership${v === 1 ? '' : 's'}`}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                itemStyle={{ color: '#cbd5e1' }}
                cursor={{ fill: 'rgba(148,163,184,0.05)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              {oemChartData.statuses.map((status, i) => (
                <Bar
                  key={status}
                  dataKey={status}
                  name={status}
                  stackId="oem"
                  fill={STATUS_BAR_COLORS[status]}
                  radius={i === oemChartData.statuses.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  maxBarSize={OEM_ROW_HEIGHT - 2}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const label = entry?.payload?.label;
                    if (typeof label === 'string') {
                      onNavigateToDealerships?.({ oem: encodeOemFilter(oemChartMode, label), status, issue: '' });
                    }
                  }}
                >
                  <LabelList dataKey={oemBarTotalValue(i)} content={renderOemBarTotal} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

    </div>
  );
};

export default DashboardPage;
