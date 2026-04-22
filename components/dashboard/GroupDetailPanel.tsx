import React, { useMemo } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Dealership, Order, DealershipStatus } from '../../types';
import {
  GroupRollup,
  INDEPENDENTS_ID,
  computeLifecycleFunnel,
  computeRevenueMix,
  DashboardWindow,
} from '../../lib/metrics';
import { formatCurrency, formatPct } from '../../lib/dashboardFormat';
import { STATUS_COLORS, STATUS_LABEL, healthPillClass } from './constants';
import LifecycleFunnel from './LifecycleFunnel';
import RevenueMix from './RevenueMix';

interface GroupDetailPanelProps {
  group: GroupRollup;
  allDealerships: Dealership[];
  allOrders: Order[];
  window: DashboardWindow;
  onClose: () => void;
  onViewDealerships: () => void;
}

export const GroupDetailPanel: React.FC<GroupDetailPanelProps> = ({
  group,
  allDealerships,
  allOrders,
  window,
  onClose,
  onViewDealerships,
}) => {
  const dealerships = useMemo(
    () =>
      allDealerships.filter((d) =>
        group.id === INDEPENDENTS_ID ? !d.enterprise_group_id : d.enterprise_group_id === group.id
      ),
    [allDealerships, group.id]
  );
  const dealerIds = useMemo(() => new Set(dealerships.map((d) => d.id)), [dealerships]);
  const groupOrders = useMemo(
    () => allOrders.filter((o) => dealerIds.has(o.dealership_id)),
    [allOrders, dealerIds]
  );

  const funnel = useMemo(() => computeLifecycleFunnel(dealerships, window.asOf), [dealerships, window.asOf]);
  const mix = useMemo(
    () => computeRevenueMix(dealerships, groupOrders, window.periodStart, window.periodEnd),
    [dealerships, groupOrders, window.periodStart, window.periodEnd]
  );

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel"
        className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 cursor-default"
      />
      <aside
        className="fixed top-0 right-0 h-screen w-full max-w-[640px] bg-white dark:bg-[#1C1C1E] z-50 shadow-2xl flex flex-col overflow-hidden border-l border-slate-200/60 dark:border-[#38383A]"
        role="dialog"
        aria-label={`${group.name} details`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-[#38383A]">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                {group.isIndependents && (
                  <span className="inline-flex text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    Synthetic
                  </span>
                )}
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{group.name}</h2>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {group.dealershipCount} dealerships · {formatPct(group.pctLive)} Live ·{' '}
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${healthPillClass(group.healthScore)}`}>
                  Health {group.healthScore}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onViewDealerships}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              View Dealerships <ArrowRight size={12} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniKpi label="Booked" value={formatCurrency(group.bookedRevenue, true)} />
            <MiniKpi label="Realized (period)" value={formatCurrency(group.realizedRevenue, true)} />
            <MiniKpi label="Live + Legacy" value={group.liveCount + group.legacyCount} />
            <MiniKpi label="On Hold" value={group.holdCount} />
          </div>

          {/* Funnel */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Lifecycle funnel</div>
            <LifecycleFunnel data={funnel} />
          </div>

          {/* Status breakdown */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Status breakdown</div>
            <div className="flex flex-wrap gap-2">
              {[
                DealershipStatus.LIVE,
                DealershipStatus.LEGACY,
                DealershipStatus.ONBOARDING,
                DealershipStatus.DMT_PENDING,
                DealershipStatus.DMT_APPROVED,
                DealershipStatus.HOLD,
                DealershipStatus.CANCELLED,
              ].map((s) => {
                const count = dealerships.filter((d) => d.status === s).length;
                if (count === 0) return null;
                return (
                  <div
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-[#38383A]"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{STATUS_LABEL[s]}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue mix */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Revenue mix (period)</div>
            <RevenueMix data={mix} />
          </div>

          {/* Dealership list */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              Dealerships ({dealerships.length})
            </div>
            <div className="rounded-xl border border-slate-200/60 dark:border-[#38383A] divide-y divide-slate-100 dark:divide-white/5 max-h-[320px] overflow-y-auto">
              {dealerships.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No dealerships
                </div>
              ) : (
                [...dealerships]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((d) => (
                    <div key={d.id} className="px-3 py-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{d.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {d.city}, {d.state}
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${STATUS_COLORS[d.status]}20`,
                          color: STATUS_COLORS[d.status],
                        }}
                      >
                        {STATUS_LABEL[d.status]}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const MiniKpi: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200/60 dark:border-[#38383A] bg-slate-50/60 dark:bg-white/5 p-3">
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</div>
    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</div>
  </div>
);

export default GroupDetailPanel;
