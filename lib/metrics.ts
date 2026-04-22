import {
  Dealership,
  DealershipStatus,
  Order,
  EnterpriseGroup,
  ProductCode,
} from '../types';
import { getMonthKey, getTimestamp, monthsInRange, periodToTimestamps } from './dateRanges';

// ─── Windowing ───────────────────────────────────────────────────────────────

export interface DashboardWindow {
  asOf: number;         // ms, end-of-day for the "as of" date
  periodStart: number;  // ms, start-of-day
  periodEnd: number;    // ms, end-of-day
}

export const resolveWindow = (
  asOfDate: string,
  periodStart: string,
  periodEnd: string
): DashboardWindow => {
  const asOfTs = getTimestamp(`${asOfDate}T23:59:59.999`) ?? Date.now();
  const { startTs, endTs } = periodToTimestamps(periodStart, periodEnd);
  return {
    asOf: asOfTs,
    periodStart: startTs ?? 0,
    periodEnd: endTs ?? asOfTs,
  };
};

// ─── Constants / helpers ─────────────────────────────────────────────────────

export const ACTIVE_STATUSES: DealershipStatus[] = [DealershipStatus.LIVE, DealershipStatus.LEGACY];
export const ONBOARDING_STATUSES: DealershipStatus[] = [
  DealershipStatus.DMT_PENDING,
  DealershipStatus.DMT_APPROVED,
  DealershipStatus.ONBOARDING,
];

const inRange = (ts: number | null, start: number, end: number): boolean =>
  ts !== null && ts >= start && ts <= end;

const dealershipExistsAt = (d: Dealership, asOf: number): boolean => {
  const purchaseTs = getTimestamp(d.purchase_date);
  if (purchaseTs !== null && purchaseTs > asOf) return false;
  const termTs = getTimestamp(d.term_date);
  if (termTs !== null && termTs <= asOf) return false;
  return true;
};

const sumOrderAmounts = (orders: Order[]): number =>
  orders.reduce(
    (sum, o) => sum + (o.products?.reduce((ps, p) => ps + (Number(p.amount) || 0), 0) || 0),
    0
  );

// ─── KPIs ────────────────────────────────────────────────────────────────────

export interface KpiSnapshot {
  activeCount: number;
  inOnboardingCount: number;
  atRiskCount: number;
  bookedRevenue: number;
}

export interface KpiFlow {
  netNewLive: number;
  churn: number;
  realizedRevenue: number;
  avgDaysToGoLive: number | null;
}

export interface Kpis extends KpiSnapshot, KpiFlow {
  prev: KpiSnapshot & KpiFlow;
}

const computeSnapshot = (dealerships: Dealership[], asOf: number): KpiSnapshot => {
  let activeCount = 0;
  let inOnboardingCount = 0;
  let atRiskCount = 0;
  let bookedRevenue = 0;

  for (const d of dealerships) {
    if (!dealershipExistsAt(d, asOf)) continue;
    if (ACTIVE_STATUSES.includes(d.status)) {
      activeCount += 1;
      bookedRevenue += Number(d.contract_value) || 0;
    } else if (ONBOARDING_STATUSES.includes(d.status)) {
      inOnboardingCount += 1;
    }
    if (d.status === DealershipStatus.HOLD) atRiskCount += 1;
  }

  return { activeCount, inOnboardingCount, atRiskCount, bookedRevenue };
};

const computeFlow = (
  dealerships: Dealership[],
  orders: Order[],
  periodStart: number,
  periodEnd: number
): KpiFlow => {
  let netNewLive = 0;
  let churn = 0;
  let daysToGoLiveTotal = 0;
  let daysToGoLiveCount = 0;

  for (const d of dealerships) {
    const goLiveTs = getTimestamp(d.go_live_date);
    const termTs = getTimestamp(d.term_date);
    const purchaseTs = getTimestamp(d.purchase_date);

    if (inRange(goLiveTs, periodStart, periodEnd)) {
      netNewLive += 1;
      if (purchaseTs !== null && goLiveTs !== null && goLiveTs >= purchaseTs) {
        daysToGoLiveTotal += Math.round((goLiveTs - purchaseTs) / 86_400_000);
        daysToGoLiveCount += 1;
      }
    }
    if (inRange(termTs, periodStart, periodEnd)) churn += 1;
  }

  const realizedRevenue = sumOrderAmounts(
    orders.filter((o) => inRange(getTimestamp(o.received_date), periodStart, periodEnd))
  );

  return {
    netNewLive,
    churn,
    realizedRevenue,
    avgDaysToGoLive: daysToGoLiveCount > 0 ? Math.round(daysToGoLiveTotal / daysToGoLiveCount) : null,
  };
};

export const computeKpis = (
  dealerships: Dealership[],
  orders: Order[],
  window: DashboardWindow,
  prevWindow: DashboardWindow
): Kpis => {
  const snap = computeSnapshot(dealerships, window.asOf);
  const flow = computeFlow(dealerships, orders, window.periodStart, window.periodEnd);
  const prevSnap = computeSnapshot(dealerships, prevWindow.asOf);
  const prevFlow = computeFlow(dealerships, orders, prevWindow.periodStart, prevWindow.periodEnd);

  return {
    ...snap,
    ...flow,
    prev: { ...prevSnap, ...prevFlow },
  };
};

// ─── Lifecycle funnel ────────────────────────────────────────────────────────

export interface LifecycleFunnel {
  pending: number;
  onboarding: number;
  live: number;
  conversion: {
    pendingToOnboarding: number | null;
    onboardingToLive: number | null;
  };
}

export const computeLifecycleFunnel = (
  dealerships: Dealership[],
  asOf: number
): LifecycleFunnel => {
  let pending = 0;
  let onboarding = 0;
  let live = 0;
  for (const d of dealerships) {
    if (!dealershipExistsAt(d, asOf)) continue;
    if (d.status === DealershipStatus.DMT_PENDING || d.status === DealershipStatus.DMT_APPROVED) pending += 1;
    else if (d.status === DealershipStatus.ONBOARDING) onboarding += 1;
    else if (d.status === DealershipStatus.LIVE) live += 1;
  }
  return {
    pending,
    onboarding,
    live,
    conversion: {
      pendingToOnboarding: pending > 0 ? onboarding / pending : null,
      onboardingToLive: onboarding > 0 ? live / onboarding : null,
    },
  };
};

// ─── Pipeline trend ──────────────────────────────────────────────────────────

export interface PipelineTrendRow {
  month: string;     // YYYY-MM
  label: string;     // "Feb 25"
  received: number;
  onboarding: number;
  goLive: number;
  termed: number;
}

export const computePipelineTrend = (
  dealerships: Dealership[],
  orders: Order[],
  periodStart: string,
  periodEnd: string
): PipelineTrendRow[] => {
  const months = monthsInRange(periodStart, periodEnd);
  if (months.length === 0) return [];

  const receivedByMonth = new Map<string, Set<string>>();
  for (const o of orders) {
    const mk = getMonthKey(o.received_date);
    if (!mk) continue;
    if (!receivedByMonth.has(mk)) receivedByMonth.set(mk, new Set());
    receivedByMonth.get(mk)!.add(o.dealership_id);
  }

  return months.map(({ key, label }) => {
    const row: PipelineTrendRow = {
      month: key,
      label,
      received: receivedByMonth.get(key)?.size || 0,
      onboarding: 0,
      goLive: 0,
      termed: 0,
    };
    for (const d of dealerships) {
      if (getMonthKey(d.onboarding_date) === key) row.onboarding += 1;
      if (getMonthKey(d.go_live_date) === key) row.goLive += 1;
      if (getMonthKey(d.term_date) === key) row.termed += 1;
    }
    return row;
  });
};

// ─── Attention queue ─────────────────────────────────────────────────────────

export interface AttentionHold {
  id: string;
  name: string;
  reason: string;
  daysOnHold: number;
}
export interface AttentionStuck {
  id: string;
  name: string;
  daysInOnboarding: number;
}
export interface AttentionCancellation {
  id: string;
  name: string;
  reason: string;
  termDate: string;
}

export interface AttentionQueue {
  holds: AttentionHold[];
  stuckOnboarding: AttentionStuck[];
  recentCancellations: AttentionCancellation[];
}

const STUCK_ONBOARDING_DAYS = 60;
const RECENT_CANCEL_DAYS = 90;

export const computeAttentionQueue = (
  dealerships: Dealership[],
  asOf: number
): AttentionQueue => {
  const holds: AttentionHold[] = [];
  const stuckOnboarding: AttentionStuck[] = [];
  const recentCancellations: AttentionCancellation[] = [];

  const recentCancelCutoff = asOf - RECENT_CANCEL_DAYS * 86_400_000;

  for (const d of dealerships) {
    if (d.status === DealershipStatus.HOLD) {
      const anchor = getTimestamp(d.onboarding_date) ?? getTimestamp(d.purchase_date) ?? asOf;
      holds.push({
        id: d.id,
        name: d.name,
        reason: d.hold_reason || '—',
        daysOnHold: Math.max(0, Math.round((asOf - anchor) / 86_400_000)),
      });
    } else if (d.status === DealershipStatus.ONBOARDING && !d.go_live_date) {
      const onbTs = getTimestamp(d.onboarding_date);
      if (onbTs !== null) {
        const days = Math.round((asOf - onbTs) / 86_400_000);
        if (days > STUCK_ONBOARDING_DAYS) {
          stuckOnboarding.push({ id: d.id, name: d.name, daysInOnboarding: days });
        }
      }
    } else if (d.status === DealershipStatus.CANCELLED) {
      const termTs = getTimestamp(d.term_date);
      if (termTs !== null && termTs >= recentCancelCutoff && termTs <= asOf) {
        recentCancellations.push({
          id: d.id,
          name: d.name,
          reason: d.cancellation_reason || '—',
          termDate: d.term_date || '',
        });
      }
    }
  }

  holds.sort((a, b) => b.daysOnHold - a.daysOnHold);
  stuckOnboarding.sort((a, b) => b.daysInOnboarding - a.daysInOnboarding);
  recentCancellations.sort((a, b) => (a.termDate < b.termDate ? 1 : -1));

  return {
    holds: holds.slice(0, 10),
    stuckOnboarding: stuckOnboarding.slice(0, 10),
    recentCancellations: recentCancellations.slice(0, 10),
  };
};

// ─── Revenue mix ─────────────────────────────────────────────────────────────

export interface RevenueByProductRow {
  code: string;
  label: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueByStatusGroup {
  key: string;
  label: string;
  revenue: number;
  color: string;
  statuses: DealershipStatus[];
}

export interface RevenueMix {
  byProduct: RevenueByProductRow[];
  byStatus: RevenueByStatusGroup[];
}

const STATUS_GROUP_DEFS: Array<{ key: string; label: string; color: string; statuses: DealershipStatus[] }> = [
  { key: 'live', label: 'Live', color: '#10b981', statuses: [DealershipStatus.LIVE, DealershipStatus.LEGACY] },
  { key: 'onboarding', label: 'Onboarding', color: '#3b82f6', statuses: [DealershipStatus.ONBOARDING] },
  { key: 'pending', label: 'Pending', color: '#94a3b8', statuses: [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED] },
  { key: 'hold', label: 'Hold', color: '#f97316', statuses: [DealershipStatus.HOLD] },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444', statuses: [DealershipStatus.CANCELLED] },
];

export const computeRevenueMix = (
  dealerships: Dealership[],
  orders: Order[],
  periodStart: number,
  periodEnd: number
): RevenueMix => {
  const rangeOrders = orders.filter((o) =>
    inRange(getTimestamp(o.received_date), periodStart, periodEnd)
  );

  const byProduct: RevenueByProductRow[] = Object.values(ProductCode)
    .map((code) => {
      let revenue = 0;
      let orderCount = 0;
      for (const o of rangeOrders) {
        const match = o.products?.find((p) => p.product_code === code);
        if (match) {
          revenue += Number(match.amount) || 0;
          orderCount += 1;
        }
      }
      return {
        code,
        label: code.replace(/^\d+\s*-?\s*/, ''),
        revenue,
        orderCount,
      };
    })
    .filter((r) => r.revenue > 0 || r.orderCount > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const statusById = new Map<string, DealershipStatus>();
  for (const d of dealerships) statusById.set(d.id, d.status);

  const byStatus: RevenueByStatusGroup[] = STATUS_GROUP_DEFS.map((g) => {
    const statusSet = new Set(g.statuses);
    const revenue = sumOrderAmounts(
      rangeOrders.filter((o) => {
        const s = statusById.get(o.dealership_id);
        return s !== undefined && statusSet.has(s);
      })
    );
    return { ...g, revenue };
  });

  return { byProduct, byStatus };
};

// ─── Enterprise-group rollups ───────────────────────────────────────────────

export const INDEPENDENTS_ID = '__independents__';

export interface GroupRollup {
  id: string;
  name: string;
  isIndependents: boolean;
  dealershipCount: number;
  liveCount: number;
  legacyCount: number;
  onboardingCount: number;
  holdCount: number;
  cancelledCount: number;
  pendingCount: number;
  pctLive: number;                    // 0..1
  bookedRevenue: number;
  realizedRevenue: number;
  healthScore: number;                // 0..100
  deltaDealershipsInPeriod: number;
  prevDealershipCount: number;
}

export const computeHealthScore = (roll: Pick<GroupRollup,
  'liveCount' | 'legacyCount' | 'holdCount' | 'cancelledCount' | 'dealershipCount'>): number => {
  if (roll.dealershipCount === 0) return 50;
  const pctGood = (roll.liveCount + roll.legacyCount) / roll.dealershipCount;
  const pctBad = (roll.holdCount + roll.cancelledCount) / roll.dealershipCount;
  const raw = pctGood - pctBad; // -1..1
  const score = Math.round(((raw + 1) / 2) * 100);
  return Math.max(0, Math.min(100, score));
};

const emptyRollup = (id: string, name: string, isIndependents: boolean): GroupRollup => ({
  id,
  name,
  isIndependents,
  dealershipCount: 0,
  liveCount: 0,
  legacyCount: 0,
  onboardingCount: 0,
  holdCount: 0,
  cancelledCount: 0,
  pendingCount: 0,
  pctLive: 0,
  bookedRevenue: 0,
  realizedRevenue: 0,
  healthScore: 50,
  deltaDealershipsInPeriod: 0,
  prevDealershipCount: 0,
});

export const computeGroupRollups = (
  dealerships: Dealership[],
  orders: Order[],
  groups: EnterpriseGroup[],
  window: DashboardWindow,
  _prevWindow: DashboardWindow
): GroupRollup[] => {
  const byId = new Map<string, GroupRollup>();
  for (const g of groups) byId.set(g.id, emptyRollup(g.id, g.name, false));
  const independents = emptyRollup(INDEPENDENTS_ID, 'Independents', true);

  const roll = (d: Dealership): GroupRollup => {
    if (!d.enterprise_group_id) return independents;
    let r = byId.get(d.enterprise_group_id);
    if (!r) {
      r = emptyRollup(d.enterprise_group_id, d.enterprise_group_id, false);
      byId.set(d.enterprise_group_id, r);
    }
    return r;
  };

  const { asOf, periodStart, periodEnd } = window;

  for (const d of dealerships) {
    const target = roll(d);
    const exists = dealershipExistsAt(d, asOf);
    if (!exists) continue;

    target.dealershipCount += 1;
    switch (d.status) {
      case DealershipStatus.LIVE:
        target.liveCount += 1;
        target.bookedRevenue += Number(d.contract_value) || 0;
        break;
      case DealershipStatus.LEGACY:
        target.legacyCount += 1;
        target.bookedRevenue += Number(d.contract_value) || 0;
        break;
      case DealershipStatus.ONBOARDING:
        target.onboardingCount += 1;
        break;
      case DealershipStatus.HOLD:
        target.holdCount += 1;
        break;
      case DealershipStatus.CANCELLED:
        target.cancelledCount += 1;
        break;
      case DealershipStatus.DMT_PENDING:
      case DealershipStatus.DMT_APPROVED:
        target.pendingCount += 1;
        break;
    }

    const purchaseTs = getTimestamp(d.purchase_date);
    const termTs = getTimestamp(d.term_date);
    if (inRange(purchaseTs, periodStart, periodEnd)) target.deltaDealershipsInPeriod += 1;
    if (inRange(termTs, periodStart, periodEnd)) target.deltaDealershipsInPeriod -= 1;
  }

  // Realized revenue per group — map orders via dealership's group.
  const groupIdForDealer = new Map<string, string>();
  for (const d of dealerships) {
    groupIdForDealer.set(d.id, d.enterprise_group_id || INDEPENDENTS_ID);
  }
  for (const o of orders) {
    const ts = getTimestamp(o.received_date);
    if (!inRange(ts, periodStart, periodEnd)) continue;
    const gid = groupIdForDealer.get(o.dealership_id);
    if (!gid) continue;
    const target = gid === INDEPENDENTS_ID ? independents : byId.get(gid);
    if (!target) continue;
    const amt = o.products?.reduce((s, p) => s + (Number(p.amount) || 0), 0) || 0;
    target.realizedRevenue += amt;
  }

  const finalize = (r: GroupRollup): GroupRollup => {
    r.pctLive = r.dealershipCount > 0 ? (r.liveCount + r.legacyCount) / r.dealershipCount : 0;
    r.healthScore = computeHealthScore(r);
    return r;
  };

  const rolls: GroupRollup[] = [];
  for (const r of byId.values()) rolls.push(finalize(r));
  if (independents.dealershipCount > 0) rolls.push(finalize(independents));

  return rolls;
};

// ─── Primary month key (for drill-through when period is a single month) ────

export const primaryMonthKey = (isSingleMonth: boolean, periodStart: string): string =>
  isSingleMonth && periodStart ? periodStart.slice(0, 7) : '';
