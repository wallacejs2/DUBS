import React, { useMemo, useState } from 'react';
import { Users, BarChart3, TrendingUp, Building2, Trophy, Layers } from 'lucide-react';
import { Dealership, DealershipFilterState, EnterpriseGroup, Order } from '../../types';
import {
  DashboardWindow,
  GroupRollup,
  INDEPENDENTS_ID,
  computeGroupRollups,
} from '../../lib/metrics';
import { formatCurrency, truncate } from '../../lib/dashboardFormat';
import KpiCard from '../../components/dashboard/KpiCard';
import KpiStrip from '../../components/dashboard/KpiStrip';
import SectionCard from '../../components/dashboard/SectionCard';
import GroupsLeaderboard from '../../components/dashboard/GroupsLeaderboard';
import GroupsComparisonChart from '../../components/dashboard/GroupsComparisonChart';
import GroupsGrowthChart from '../../components/dashboard/GroupsGrowthChart';
import GroupDetailPanel from '../../components/dashboard/GroupDetailPanel';

interface GroupsTabProps {
  dealerships: Dealership[];
  orders: Order[];
  groups: EnterpriseGroup[];
  window: DashboardWindow;
  prevWindow: DashboardWindow;
  onNavigate: (filters: Partial<DealershipFilterState>) => void;
}

const BASE_FILTER: DealershipFilterState = {
  search: '', status: '', group: '', issue: '', managed: '', addl_web: '',
  cif: '', client_id: '', sms: '',
  received_month: '', onboarding_month: '', go_live_month: '', term_month: '',
};

export const GroupsTab: React.FC<GroupsTabProps> = ({
  dealerships,
  orders,
  groups,
  window,
  prevWindow,
  onNavigate,
}) => {
  const [selected, setSelected] = useState<GroupRollup | null>(null);

  const rollups = useMemo(
    () => computeGroupRollups(dealerships, orders, groups, window, prevWindow),
    [dealerships, orders, groups, window, prevWindow]
  );

  const realGroups = rollups.filter((r) => !r.isIndependents);
  const independents = rollups.find((r) => r.isIndependents);

  const totalGroups = realGroups.length;
  const avgDealershipsPerGroup =
    totalGroups > 0
      ? (realGroups.reduce((s, r) => s + r.dealershipCount, 0) / totalGroups).toFixed(1)
      : '0';
  const topByRevenue = [...rollups].sort((a, b) => b.bookedRevenue - a.bookedRevenue)[0];

  const navigate = (payload: Partial<DealershipFilterState>) => onNavigate({ ...BASE_FILTER, ...payload });

  return (
    <div>
      {/* KPI strip */}
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Users size={15} className="text-indigo-600 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          label="Total Groups"
          value={totalGroups}
        />
        <KpiCard
          icon={<Building2 size={15} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          label="Avg Dealerships / Group"
          value={avgDealershipsPerGroup}
        />
        <KpiCard
          icon={<Trophy size={15} className="text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          label="Top Group (Booked)"
          value={topByRevenue ? truncate(topByRevenue.name, 14) : '—'}
          sub={topByRevenue ? (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1.5">
              {formatCurrency(topByRevenue.bookedRevenue, true)}
            </span>
          ) : null}
          clickable={!!topByRevenue && !topByRevenue.isIndependents}
          onClick={topByRevenue && !topByRevenue.isIndependents ? () => navigate({ group: topByRevenue.id }) : undefined}
        />
        <KpiCard
          icon={<Layers size={15} className="text-slate-600 dark:text-slate-400" />}
          iconBg="bg-slate-100 dark:bg-slate-700"
          label="Independents"
          value={independents?.dealershipCount ?? 0}
        />
      </KpiStrip>

      {/* Leaderboard */}
      <SectionCard
        title="Groups Leaderboard"
        icon={<Trophy size={14} className="text-amber-500" />}
        accent="bg-amber-500/5 dark:bg-amber-500/10 border-amber-200/40 dark:border-amber-500/20"
      >
        <GroupsLeaderboard rows={rollups} onRowClick={setSelected} />
      </SectionCard>

      {/* Comparison + Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6">
        <SectionCard
          title="Top 10 Groups by Dealerships"
          icon={<BarChart3 size={14} className="text-indigo-500" />}
          accent="bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-200/40 dark:border-indigo-500/20"
        >
          <GroupsComparisonChart rows={realGroups} />
        </SectionCard>
        <SectionCard
          title="Growth in Period"
          icon={<TrendingUp size={14} className="text-emerald-500" />}
          accent="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200/40 dark:border-emerald-500/20"
        >
          <GroupsGrowthChart rows={rollups} />
        </SectionCard>
      </div>

      {selected && (
        <GroupDetailPanel
          group={selected}
          allDealerships={dealerships}
          allOrders={orders}
          window={window}
          onClose={() => setSelected(null)}
          onViewDealerships={() => {
            if (selected.id === INDEPENDENTS_ID) {
              // No dedicated "ungrouped" filter on the Dealerships page today;
              // drill without a group filter so the user lands on the full list.
              navigate({});
            } else {
              navigate({ group: selected.id });
            }
            setSelected(null);
          }}
        />
      )}
    </div>
  );
};

export default GroupsTab;
