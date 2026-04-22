import React, { useMemo } from 'react';
import {
  Building2, DollarSign, Wallet, Rocket, TrendingDown, AlertTriangle, Clock, Trophy,
  BarChart3, Activity, Zap,
} from 'lucide-react';
import { Dealership, DealershipFilterState, DealershipStatus, Order } from '../../types';
import {
  DashboardWindow,
  computeKpis,
  computeLifecycleFunnel,
  computePipelineTrend,
  computeAttentionQueue,
  computeRevenueMix,
} from '../../lib/metrics';
import { formatCurrency, formatDays } from '../../lib/dashboardFormat';
import KpiCard, { DeltaBadge } from '../../components/dashboard/KpiCard';
import KpiStrip from '../../components/dashboard/KpiStrip';
import SectionCard from '../../components/dashboard/SectionCard';
import LifecycleFunnel from '../../components/dashboard/LifecycleFunnel';
import PipelineTrend from '../../components/dashboard/PipelineTrend';
import AttentionQueue from '../../components/dashboard/AttentionQueue';
import RevenueMix from '../../components/dashboard/RevenueMix';

interface OverviewTabProps {
  dealerships: Dealership[];
  orders: Order[];
  window: DashboardWindow;
  prevWindow: DashboardWindow;
  periodStartYmd: string;
  periodEndYmd: string;
  primaryMonthKey: string;
  onNavigate: (filters: Partial<DealershipFilterState>) => void;
}

const BASE_FILTER: DealershipFilterState = {
  search: '', status: '', group: '', issue: '', managed: '', addl_web: '',
  cif: '', client_id: '', sms: '',
  received_month: '', onboarding_month: '', go_live_month: '', term_month: '',
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  dealerships,
  orders,
  window,
  prevWindow,
  periodStartYmd,
  periodEndYmd,
  primaryMonthKey,
  onNavigate,
}) => {
  const kpis = useMemo(
    () => computeKpis(dealerships, orders, window, prevWindow),
    [dealerships, orders, window, prevWindow]
  );
  const funnel = useMemo(
    () => computeLifecycleFunnel(dealerships, window.asOf),
    [dealerships, window.asOf]
  );
  const trend = useMemo(
    () => computePipelineTrend(dealerships, orders, periodStartYmd, periodEndYmd),
    [dealerships, orders, periodStartYmd, periodEndYmd]
  );
  const attention = useMemo(
    () => computeAttentionQueue(dealerships, window.asOf),
    [dealerships, window.asOf]
  );
  const revMix = useMemo(
    () => computeRevenueMix(dealerships, orders, window.periodStart, window.periodEnd),
    [dealerships, orders, window.periodStart, window.periodEnd]
  );

  const navigate = (payload: Partial<DealershipFilterState>) =>
    onNavigate({ ...BASE_FILTER, ...payload });

  const monthFilter = (field: 'received_month' | 'go_live_month' | 'term_month'): Partial<DealershipFilterState> =>
    primaryMonthKey ? { [field]: primaryMonthKey } as Partial<DealershipFilterState> : {};

  return (
    <div>
      {/* KPI strip */}
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Building2 size={15} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          label="Active Dealerships"
          value={kpis.activeCount}
          sub={<DeltaBadge current={kpis.activeCount} prev={kpis.prev.activeCount} />}
          clickable
          onClick={() => navigate({ status: DealershipStatus.LIVE })}
        />
        <KpiCard
          icon={<Rocket size={15} className="text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          label="In Onboarding"
          value={kpis.inOnboardingCount}
          sub={<DeltaBadge current={kpis.inOnboardingCount} prev={kpis.prev.inOnboardingCount} />}
          clickable
          onClick={() => navigate({ status: DealershipStatus.ONBOARDING })}
        />
        <KpiCard
          icon={<TrendingDown size={15} className="text-slate-500" style={{ transform: 'rotate(180deg)' }} />}
          iconBg="bg-violet-50 dark:bg-violet-900/30"
          label="Net New Live"
          value={kpis.netNewLive}
          sub={<DeltaBadge current={kpis.netNewLive} prev={kpis.prev.netNewLive} />}
          clickable
          onClick={() => navigate(monthFilter('go_live_month'))}
        />
        <KpiCard
          icon={<TrendingDown size={15} className="text-red-600 dark:text-red-400" />}
          iconBg="bg-red-50 dark:bg-red-900/30"
          label="Churn"
          value={kpis.churn}
          sub={<DeltaBadge current={kpis.churn} prev={kpis.prev.churn} invertColors />}
          clickable
          onClick={() => navigate(monthFilter('term_month'))}
        />
        <KpiCard
          icon={<AlertTriangle size={15} className="text-orange-600 dark:text-orange-400" />}
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          label="At Risk (Hold)"
          value={kpis.atRiskCount}
          sub={<DeltaBadge current={kpis.atRiskCount} prev={kpis.prev.atRiskCount} invertColors />}
          clickable
          onClick={() => navigate({ status: DealershipStatus.HOLD })}
        />
        <KpiCard
          icon={<Wallet size={15} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          label="Booked Revenue"
          value={formatCurrency(kpis.bookedRevenue, true)}
          clickable
          onClick={() => navigate({ status: DealershipStatus.LIVE })}
        />
        <KpiCard
          icon={<DollarSign size={15} className="text-cyan-600 dark:text-cyan-400" />}
          iconBg="bg-cyan-50 dark:bg-cyan-900/30"
          label="Realized Revenue"
          value={formatCurrency(kpis.realizedRevenue, true)}
          clickable
          onClick={() => navigate(monthFilter('received_month'))}
        />
        <KpiCard
          icon={<Clock size={15} className="text-violet-600 dark:text-violet-400" />}
          iconBg="bg-violet-50 dark:bg-violet-900/30"
          label="Avg Days to Go-Live"
          value={formatDays(kpis.avgDaysToGoLive)}
          clickable
          onClick={() => navigate(monthFilter('go_live_month'))}
        />
      </KpiStrip>

      {/* Lifecycle funnel */}
      <SectionCard
        title="Lifecycle Funnel"
        icon={<Trophy size={14} className="text-blue-500" />}
        accent="bg-blue-500/5 dark:bg-blue-500/10 border-blue-200/40 dark:border-blue-500/20"
      >
        <LifecycleFunnel
          data={funnel}
          onStageClick={(statuses) => {
            // Filter only supports a single status; use the first (primary) one in the stage.
            navigate({ status: statuses[0] });
          }}
        />
      </SectionCard>

      {/* Pipeline trend */}
      <SectionCard
        title="Pipeline Trend"
        icon={<Activity size={14} className="text-cyan-500" />}
        accent="bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-200/40 dark:border-cyan-500/20"
      >
        <PipelineTrend
          data={trend}
          onMonthClick={(mk, stage) => {
            const field =
              stage === 'received' ? 'received_month'
              : stage === 'onboarding' ? 'onboarding_month'
              : stage === 'goLive' ? 'go_live_month'
              : 'term_month';
            navigate({ [field]: mk } as Partial<DealershipFilterState>);
          }}
        />
      </SectionCard>

      {/* Attention queue */}
      <SectionCard
        title="Needs Attention"
        icon={<Zap size={14} className="text-amber-500" />}
        accent="bg-amber-500/5 dark:bg-amber-500/10 border-amber-200/40 dark:border-amber-500/20"
      >
        <AttentionQueue
          data={attention}
          onRowClick={(_id, name, bucket) => {
            const status =
              bucket === 'hold' ? DealershipStatus.HOLD
              : bucket === 'stuck' ? DealershipStatus.ONBOARDING
              : DealershipStatus.CANCELLED;
            navigate({ status, search: name });
          }}
        />
      </SectionCard>

      {/* Revenue mix */}
      <SectionCard
        title="Revenue Mix"
        icon={<BarChart3 size={14} className="text-emerald-500" />}
        accent="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200/40 dark:border-emerald-500/20"
      >
        <RevenueMix data={revMix} />
      </SectionCard>
    </div>
  );
};

export default OverviewTab;
