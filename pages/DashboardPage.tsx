import React, { useMemo, useState } from 'react';
import { BarChart3, Building2, Calendar, Clock, DollarSign, Rocket, TrendingUp, UserPlus, X } from 'lucide-react';
import { useDealerships, useOrders } from '../hooks';
import { DealershipFilterState, DealershipStatus, ProductCode } from '../types';

interface DashboardPageProps {
  onNavigateToDealerships?: (filters: Partial<DealershipFilterState>) => void;
}

const DeltaBadge: React.FC<{ current: number; prev: number }> = ({ current, prev }) => {
  const delta = current - prev;
  if (delta === 0) return null;
  return (
    <span className={`text-[9px] font-bold ml-1 ${delta > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
      {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToDealerships }) => {
  const [orderDateRange, setOrderDateRange] = useState({ start: '', end: '' });
  const [reportingMonth, setReportingMonth] = useState(new Date().toISOString().slice(0, 7));
  // Default: Cancelled is excluded
  const [excludedStatuses, setExcludedStatuses] = useState<DealershipStatus[]>([DealershipStatus.CANCELLED]);

  const { dealerships } = useDealerships();
  const { orders } = useOrders();

  const dashboardMetrics = useMemo(() => {
    const getMonthKey = (dateValue?: string) => {
      if (!dateValue) return '';

      // Keep month derivation in local calendar terms and avoid UTC shifts.
      const rawMonth = dateValue.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(rawMonth)) return rawMonth;

      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) return '';
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };

    const getTimestamp = (value?: string) => {
      if (!value) return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.getTime();
    };

    const startTimestamp = orderDateRange.start ? getTimestamp(`${orderDateRange.start}T00:00:00`) : null;
    const endTimestamp = orderDateRange.end ? getTimestamp(`${orderDateRange.end}T23:59:59.999`) : null;

    const statusCounts = dealerships.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<DealershipStatus, number>);

    const activeDealerships = dealerships.filter(d => !excludedStatuses.includes(d.status));
    const activeDealershipIds = new Set(activeDealerships.map(d => d.id));

    // Revenue: only from Live/Legacy dealerships (not date-filtered)
    const liveOrLegacyIds = new Set(
      dealerships
        .filter(d => d.status === DealershipStatus.LIVE || d.status === DealershipStatus.LEGACY)
        .map(d => d.id)
    );
    const revenueOrders = orders.filter(o => liveOrLegacyIds.has(o.dealership_id));
    const totalRevenue = revenueOrders.reduce((sum, order) => {
      const orderTotal = order.products?.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) || 0;
      return sum + orderTotal;
    }, 0);

    // Product breakdown: uses date-range filtered orders from active dealerships
    const filteredOrders = orders.filter(order => {
      if (!activeDealershipIds.has(order.dealership_id)) return false;
      const orderTimestamp = getTimestamp(order.received_date);
      if (orderTimestamp === null) return false;
      if (startTimestamp !== null && orderTimestamp < startTimestamp) return false;
      if (endTimestamp !== null && orderTimestamp > endTimestamp) return false;
      return true;
    });

    const productBreakdown = filteredOrders.reduce((acc, order) => {
      order.products?.forEach(p => {
        if (p.product_code) {
          acc[p.product_code] = (acc[p.product_code] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Lifecycle metrics: use ALL dealerships (not just active) so historical data is complete
    // Received count now comes from orders' received_date (unique dealerships)
    const receivedThisMonthSet = new Set<string>();
    for (const order of orders) {
      if (getMonthKey(order.received_date) === reportingMonth) {
        receivedThisMonthSet.add(order.dealership_id);
      }
    }

    // Onboarding / Go-Live / Termed are flow-based: each dealership in only its furthest stage
    const lifecycle = dealerships.reduce(
      (acc, d) => {
        const hasOnboarding = getMonthKey(d.onboarding_date) === reportingMonth;
        const hasGoLive = getMonthKey(d.go_live_date) === reportingMonth;
        const hasTerm = getMonthKey(d.term_date) === reportingMonth;

        if (hasTerm) acc.termedThisMonth += 1;
        else if (hasGoLive) acc.goLiveThisMonth += 1;
        else if (hasOnboarding) acc.onboardingThisMonth += 1;
        return acc;
      },
      { receivedThisMonth: receivedThisMonthSet.size, onboardingThisMonth: 0, goLiveThisMonth: 0, termedThisMonth: 0 }
    );

    // Previous month lifecycle (for delta indicators)
    const prevMonth = (() => {
      const [y, m] = reportingMonth.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const receivedPrevMonthSet = new Set<string>();
    for (const order of orders) {
      if (getMonthKey(order.received_date) === prevMonth) {
        receivedPrevMonthSet.add(order.dealership_id);
      }
    }

    const prevLifecycle = dealerships.reduce(
      (acc, d) => {
        const hasOnboarding = getMonthKey(d.onboarding_date) === prevMonth;
        const hasGoLive = getMonthKey(d.go_live_date) === prevMonth;
        const hasTerm = getMonthKey(d.term_date) === prevMonth;

        if (hasTerm) acc.termedThisMonth += 1;
        else if (hasGoLive) acc.goLiveThisMonth += 1;
        else if (hasOnboarding) acc.onboardingThisMonth += 1;
        return acc;
      },
      { receivedThisMonth: receivedPrevMonthSet.size, onboardingThisMonth: 0, goLiveThisMonth: 0, termedThisMonth: 0 }
    );

    // Pre-compute earliest order received_date per dealership for avg days
    const earliestReceivedByDealership = new Map<string, number>();
    for (const order of orders) {
      if (!order.received_date) continue;
      const ts = new Date(order.received_date).getTime();
      if (Number.isNaN(ts)) continue;
      const existing = earliestReceivedByDealership.get(order.dealership_id);
      if (existing === undefined || ts < existing) {
        earliestReceivedByDealership.set(order.dealership_id, ts);
      }
    }

    // Average days: Received → Onboarding, Onboarding → Live (all-time averages)
    const avgDaysAcc = dealerships.reduce(
      (acc, d) => {
        const earliestReceived = earliestReceivedByDealership.get(d.id);
        if (earliestReceived !== undefined && d.onboarding_date) {
          const diff = new Date(d.onboarding_date).getTime() - earliestReceived;
          if (diff >= 0) { acc.recvToOnbTotal += Math.round(diff / 86400000); acc.recvToOnbCount += 1; }
        }
        if (d.onboarding_date && d.go_live_date) {
          const diff = new Date(d.go_live_date).getTime() - new Date(d.onboarding_date).getTime();
          if (diff >= 0) { acc.onbToLiveTotal += Math.round(diff / 86400000); acc.onbToLiveCount += 1; }
        }
        return acc;
      },
      { recvToOnbTotal: 0, recvToOnbCount: 0, onbToLiveTotal: 0, onbToLiveCount: 0 }
    );
    const avgRecvToOnb = avgDaysAcc.recvToOnbCount > 0 ? Math.round(avgDaysAcc.recvToOnbTotal / avgDaysAcc.recvToOnbCount) : null;
    const avgOnbToLive = avgDaysAcc.onbToLiveCount > 0 ? Math.round(avgDaysAcc.onbToLiveTotal / avgDaysAcc.onbToLiveCount) : null;

    // 18-month pipeline with flow-based counts (each dealership at its furthest stage per month)
    const pipelineMonths = (() => {
      const months: Array<{
        monthKey: string; label: string;
        received: number; onboarding: number; goLive: number; termed: number;
        recvToOnbPct: number | null; onbToLivePct: number | null;
      }> = [];

      // Pre-compute: for each month, which dealership IDs have a received order
      const receivedByMonth = new Map<string, Set<string>>();
      for (const order of orders) {
        const mk = getMonthKey(order.received_date);
        if (!mk) continue;
        if (!receivedByMonth.has(mk)) receivedByMonth.set(mk, new Set());
        receivedByMonth.get(mk)!.add(order.dealership_id);
      }

      // Pre-compute dealership lookup
      const dealershipMap = new Map(dealerships.map(d => [d.id, d]));

      // Pre-compute dealership date month keys for quick lookup
      const dlMonthKeys = new Map(dealerships.map(d => [d.id, {
        onboarding: getMonthKey(d.onboarding_date),
        goLive: getMonthKey(d.go_live_date),
        term: getMonthKey(d.term_date),
      }]));

      const now = new Date();
      for (let i = 0; i < 18; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });

        const receivedSet = receivedByMonth.get(monthKey) || new Set<string>();
        const row = { received: receivedSet.size, onboarding: 0, goLive: 0, termed: 0 };

        // Received is an independent count (unique dealerships with an order received_date this month).
        // Onboarding / Go-Live / Termed are flow-based: each dealership appears in only its furthest stage.
        for (const dl of dealerships) {
          const mk = dlMonthKeys.get(dl.id)!;
          const hasOnboarding = mk.onboarding === monthKey;
          const hasGoLive = mk.goLive === monthKey;
          const hasTerm = mk.term === monthKey;

          // Furthest stage wins (termed > goLive > onboarding)
          if (hasTerm) row.termed += 1;
          else if (hasGoLive) row.goLive += 1;
          else if (hasOnboarding) row.onboarding += 1;
        }

        months.push({
          monthKey, label, ...row,
          recvToOnbPct: row.received > 0 ? Math.round((row.onboarding / row.received) * 100) : null,
          onbToLivePct: row.onboarding > 0 ? Math.round((row.goLive / row.onboarding) * 100) : null,
        });
      }
      return months;
    })();

    const maxPipelineReceived = Math.max(1, ...pipelineMonths.map(r => r.received));

    return {
      statusCounts,
      totalDealershipsCount: activeDealerships.length,
      totalRevenue,
      productBreakdown,
      lifecycle,
      prevLifecycle,
      netLiveChangeThisMonth: lifecycle.goLiveThisMonth - lifecycle.termedThisMonth,
      pipelineMonths,
      maxPipelineReceived,
      avgRecvToOnb,
      avgOnbToLive,
      isOrderDateFiltered: !!(orderDateRange.start || orderDateRange.end),
    };
  }, [dealerships, orders, excludedStatuses, orderDateRange, reportingMonth]);

  const toggleStatus = (statuses: DealershipStatus[]) => {
    setExcludedStatuses(prev => {
      const isAllExcluded = statuses.every(s => prev.includes(s));
      if (isAllExcluded) {
        return prev.filter(s => !statuses.includes(s));
      }

      const newExcluded = [...prev];
      statuses.forEach(s => {
        if (!newExcluded.includes(s)) newExcluded.push(s);
      });
      return newExcluded;
    });
  };

  const isExcluded = (statuses: DealershipStatus[]) => statuses.every(s => excludedStatuses.includes(s));

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const statusGroups = [
    {
      label: 'Live',
      statuses: [DealershipStatus.LIVE, DealershipStatus.LEGACY],
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-800',
    },
    {
      label: 'Onboarding',
      statuses: [DealershipStatus.ONBOARDING],
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-800',
    },
    {
      label: 'Pending',
      statuses: [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED],
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-800',
    },
    {
      label: 'Hold',
      statuses: [DealershipStatus.HOLD],
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-800',
    },
    {
      label: 'Cancelled',
      statuses: [DealershipStatus.CANCELLED],
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-800',
    },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monthly pipeline flow: order received, onboarding, go-live, and term/cancelled.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center gap-2 px-2 border-r border-slate-100 dark:border-slate-800">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Date</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={orderDateRange.start}
                onChange={e => setOrderDateRange({ ...orderDateRange, start: e.target.value })}
                className="text-xs border-none outline-none bg-transparent text-slate-600 dark:text-slate-300 font-medium dark:color-scheme-dark"
              />
              <span className="text-slate-300 dark:text-slate-600">-</span>
              <input
                type="date"
                value={orderDateRange.end}
                onChange={e => setOrderDateRange({ ...orderDateRange, end: e.target.value })}
                className="text-xs border-none outline-none bg-transparent text-slate-600 dark:text-slate-300 font-medium dark:color-scheme-dark"
              />
            </div>
            {(orderDateRange.start || orderDateRange.end) && (
              <button
                onClick={() => setOrderDateRange({ start: '', end: '' })}
                className="ml-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifecycle Month</span>
            <input
              type="month"
              value={reportingMonth}
              onChange={e => setReportingMonth(e.target.value)}
              className="text-xs border-none outline-none bg-transparent text-slate-600 dark:text-slate-300 font-medium dark:color-scheme-dark"
            />
          </div>
        </div>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3 mb-3">
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
              <Building2 size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dealerships</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{dashboardMetrics.totalDealershipsCount}</div>
        </div>

        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <DollarSign size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revenue Booked</span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 block -mt-0.5">Live / Legacy</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{formatCurrency(dashboardMetrics.totalRevenue)}</div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-24">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold"><Calendar size={13} /> Received</div>
          <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-2">
            {dashboardMetrics.lifecycle.receivedThisMonth}
            <DeltaBadge current={dashboardMetrics.lifecycle.receivedThisMonth} prev={dashboardMetrics.prevLifecycle.receivedThisMonth} />
          </div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-24">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold"><UserPlus size={13} /> Onboarding</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {dashboardMetrics.lifecycle.onboardingThisMonth}
            <DeltaBadge current={dashboardMetrics.lifecycle.onboardingThisMonth} prev={dashboardMetrics.prevLifecycle.onboardingThisMonth} />
          </div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-24">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold"><Rocket size={13} /> Go-Live</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {dashboardMetrics.lifecycle.goLiveThisMonth}
            <DeltaBadge current={dashboardMetrics.lifecycle.goLiveThisMonth} prev={dashboardMetrics.prevLifecycle.goLiveThisMonth} />
          </div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-24">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold"><X size={13} /> Termed</div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-2">
            {dashboardMetrics.lifecycle.termedThisMonth}
            <DeltaBadge current={dashboardMetrics.lifecycle.termedThisMonth} prev={dashboardMetrics.prevLifecycle.termedThisMonth} />
          </div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-24">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold"><TrendingUp size={13} /> Net Live</div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-2">{dashboardMetrics.netLiveChangeThisMonth}</div>
        </div>
      </div>

      {/* Average days KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3 mb-3">
        <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-20 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold"><Clock size={13} /> Avg Days: Received → Onboarding</div>
          <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
            {dashboardMetrics.avgRecvToOnb !== null ? dashboardMetrics.avgRecvToOnb : '—'}
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-20 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold"><Clock size={13} /> Avg Days: Onboarding → Live</div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
            {dashboardMetrics.avgOnbToLive !== null ? dashboardMetrics.avgOnbToLive : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3 mb-4">
        {statusGroups.map(group => {
          const excluded = isExcluded(group.statuses);
          const count = group.statuses.reduce((sum, status) => sum + (dashboardMetrics.statusCounts[status] || 0), 0);

          return (
            <button
              key={group.label}
              onClick={() => toggleStatus(group.statuses)}
              className={`col-span-1 p-3 rounded-xl border shadow-sm flex flex-col justify-center h-24 transition-all duration-200 text-left relative overflow-hidden group
                ${group.bg} ${group.border}
                ${excluded ? 'opacity-40 grayscale hover:opacity-60' : 'hover:-translate-y-1 hover:shadow-md ring-1 ring-transparent hover:ring-indigo-100 dark:hover:ring-indigo-900'}
              `}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{group.label}</span>
                {excluded && (
                  <span className="text-[8px] font-bold text-red-400 uppercase bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                    Excluded
                  </span>
                )}
              </div>
              <span className={`text-xl font-bold ${group.color}`}>{count}</span>
              {!excluded && (
                <div className={`absolute bottom-0 left-0 h-1 bg-current opacity-20 w-full ${group.color.replace('text-', 'bg-')}`}></div>
              )}
            </button>
          );
        })}
      </div>

      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6">
        Product Breakdown
        {dashboardMetrics.isOrderDateFiltered && <span className="font-normal text-slate-300 dark:text-slate-600 ml-2">(In Order Date Range)</span>}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        {Object.values(ProductCode).map(code => {
          const count = dashboardMetrics.productBreakdown[code] || 0;
          return (
            <div
              key={code}
              className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center transition-colors"
            >
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 break-words w-full">
                {code.replace(/^\d+\s*-?\s*/, '')}
              </span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{count}</span>
            </div>
          );
        })}
      </div>

      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6 flex items-center gap-2">
        <BarChart3 size={13} /> Onboarding Pipeline — Last 18 Months
      </h3>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 overflow-hidden">
        <div className="grid grid-cols-7 px-4 py-2 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <div className="col-span-1">Month</div>
          <div className="col-span-1 text-center">Received</div>
          <div className="col-span-1 text-center">Onboarding</div>
          <div className="col-span-1 text-center">Go-Live</div>
          <div className="col-span-1 text-center">Termed / Cxl</div>
          <div className="col-span-1 text-center">Recv→Onb</div>
          <div className="col-span-1 text-center">Onb→Live</div>
        </div>
        {dashboardMetrics.pipelineMonths.map(row => {
          const isSelected = row.monthKey === reportingMonth;
          const heatIntensity = row.received / dashboardMetrics.maxPipelineReceived;
          return (
            <div
              key={row.monthKey}
              className={`grid grid-cols-7 text-xs border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer transition-colors
                ${isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              onClick={() => setReportingMonth(row.monthKey)}
            >
              <div className={`col-span-1 px-4 py-2 font-semibold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                {row.label}
                {isSelected && <span className="ml-1.5 text-[9px] font-bold text-indigo-500 uppercase">Selected</span>}
              </div>
              {/* Received — heatmap + click-through */}
              <div
                className="col-span-1 text-center py-2 font-bold text-cyan-700 dark:text-cyan-300 hover:underline"
                style={{ backgroundColor: row.received > 0 ? `rgba(6,182,212,${heatIntensity * 0.25})` : undefined }}
                onClick={e => { e.stopPropagation(); onNavigateToDealerships?.({ received_month: row.monthKey, status: '', onboarding_month: '', go_live_month: '', term_month: '' }); }}
              >
                {row.received || '—'}
              </div>
              {/* Onboarding — click-through */}
              <div
                className="col-span-1 text-center py-2 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={e => { e.stopPropagation(); onNavigateToDealerships?.({ onboarding_month: row.monthKey, status: '', received_month: '', go_live_month: '', term_month: '' }); }}
              >
                {row.onboarding || '—'}
              </div>
              {/* Go-Live — click-through */}
              <div
                className="col-span-1 text-center py-2 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                onClick={e => { e.stopPropagation(); onNavigateToDealerships?.({ go_live_month: row.monthKey, status: '', received_month: '', onboarding_month: '', term_month: '' }); }}
              >
                {row.goLive || '—'}
              </div>
              {/* Termed — click-through */}
              <div
                className="col-span-1 text-center py-2 font-bold text-red-600 dark:text-red-400 hover:underline"
                onClick={e => { e.stopPropagation(); onNavigateToDealerships?.({ term_month: row.monthKey, status: '', received_month: '', onboarding_month: '', go_live_month: '' }); }}
              >
                {row.termed || '—'}
              </div>
              {/* Recv→Onb % */}
              <div className="col-span-1 text-center py-2 text-slate-500 dark:text-slate-400">
                {row.recvToOnbPct !== null ? `${row.recvToOnbPct}%` : '—'}
              </div>
              {/* Onb→Live % */}
              <div className="col-span-1 text-center py-2 text-slate-500 dark:text-slate-400">
                {row.onbToLivePct !== null ? `${row.onbToLivePct}%` : '—'}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default DashboardPage;
