import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Users } from 'lucide-react';
import { useDealerships, useOrders, useEnterpriseGroups } from '../hooks';
import { DealershipFilterState } from '../types';
import {
  PeriodPreset,
  resolvePreset,
  shiftPeriodBack,
  todayYmd,
} from '../lib/dateRanges';
import { resolveWindow } from '../lib/metrics';
import TimeFilters from '../components/dashboard/TimeFilters';
import TabSwitcher from '../components/dashboard/TabSwitcher';
import OverviewTab from './dashboard/OverviewTab';
import GroupsTab from './dashboard/GroupsTab';

interface DashboardPageProps {
  onNavigateToDealerships?: (filters: Partial<DealershipFilterState>) => void;
}

type DashTab = 'overview' | 'groups';

interface PersistedFilters {
  activeTab: DashTab;
  asOfDate: string;
  periodPreset: PeriodPreset;
  customStart: string;
  customEnd: string;
}

const STORAGE_KEY = 'dubs_dashboard_filters_v1';

const loadPersisted = (): Partial<PersistedFilters> => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedFilters>) : {};
  } catch {
    return {};
  }
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToDealerships }) => {
  const persisted = useMemo(loadPersisted, []);

  const [activeTab, setActiveTab] = useState<DashTab>(persisted.activeTab ?? 'overview');
  const [asOfDate, setAsOfDate] = useState<string>(persisted.asOfDate ?? todayYmd());
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(persisted.periodPreset ?? 'this_month');
  const [customStart, setCustomStart] = useState<string>(persisted.customStart ?? '');
  const [customEnd, setCustomEnd] = useState<string>(persisted.customEnd ?? '');

  // Persist filters across refreshes within the session
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activeTab, asOfDate, periodPreset, customStart, customEnd } satisfies PersistedFilters)
      );
    } catch {
      // ignore quota / disabled storage
    }
  }, [activeTab, asOfDate, periodPreset, customStart, customEnd]);

  const { dealerships } = useDealerships();
  const { orders } = useOrders();
  const { groups } = useEnterpriseGroups();

  const period = useMemo(
    () => resolvePreset(periodPreset, { start: customStart, end: customEnd }),
    [periodPreset, customStart, customEnd]
  );

  const window = useMemo(
    () => resolveWindow(asOfDate, period.start, period.end),
    [asOfDate, period.start, period.end]
  );

  const prevWindow = useMemo(() => {
    const shifted = shiftPeriodBack(period.start, period.end);
    if (!shifted) return window;
    const prev = resolveWindow(shifted.end, shifted.start, shifted.end);
    return prev;
  }, [period.start, period.end, window]);

  const periodLabel = useMemo(() => {
    switch (periodPreset) {
      case 'this_month': return new Date(period.start + 'T00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'last_month': return new Date(period.start + 'T00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'ytd': return `YTD ${new Date(period.start).getFullYear()}`;
      case 'last_12': return 'Last 12 Months';
      case 'custom': return period.start && period.end ? `${period.start} – ${period.end}` : 'Custom Range';
    }
  }, [periodPreset, period.start, period.end]);

  return (
    <div className="animate-in fade-in duration-500 relative">
      <TimeFilters
        asOfDate={asOfDate}
        onAsOfChange={setAsOfDate}
        periodPreset={periodPreset}
        onPresetChange={setPeriodPreset}
        customStart={customStart}
        customEnd={customEnd}
        onCustomChange={(s, e) => {
          setCustomStart(s);
          setCustomEnd(e);
          if (s || e) setPeriodPreset('custom');
        }}
        periodLabel={periodLabel}
      />

      <div className="mb-5">
        <TabSwitcher<DashTab>
          tabs={[
            { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={13} /> },
            { key: 'groups', label: 'Enterprise Groups', icon: <Users size={13} /> },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'overview' ? (
        <OverviewTab
          dealerships={dealerships}
          orders={orders}
          window={window}
          prevWindow={prevWindow}
          periodStartYmd={period.start}
          periodEndYmd={period.end}
          primaryMonthKey={period.primaryMonthKey}
          onNavigate={(filters) => onNavigateToDealerships?.(filters)}
        />
      ) : (
        <GroupsTab
          dealerships={dealerships}
          orders={orders}
          groups={groups}
          window={window}
          prevWindow={prevWindow}
          onNavigate={(filters) => onNavigateToDealerships?.(filters)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
