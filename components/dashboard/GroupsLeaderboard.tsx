import React, { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Star } from 'lucide-react';
import { GroupRollup, INDEPENDENTS_ID } from '../../lib/metrics';
import { formatCurrency, formatPct } from '../../lib/dashboardFormat';
import { healthPillClass } from './constants';

type SortKey =
  | 'name'
  | 'dealershipCount'
  | 'pctLive'
  | 'bookedRevenue'
  | 'realizedRevenue'
  | 'healthScore'
  | 'delta';

interface GroupsLeaderboardProps {
  rows: GroupRollup[];
  onRowClick: (group: GroupRollup) => void;
}

const HeaderCell: React.FC<{
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: 'asc' | 'desc';
  align?: 'left' | 'right';
  onSort: (key: SortKey) => void;
}> = ({ label, sortKey, activeKey, dir, align = 'left', onSort }) => {
  const active = sortKey === activeKey;
  return (
    <th
      className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 ${
          active ? 'text-slate-700 dark:text-slate-200' : ''
        }`}
      >
        {label}
        {active && (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </button>
    </th>
  );
};

export const GroupsLeaderboard: React.FC<GroupsLeaderboardProps> = ({ rows, onRowClick }) => {
  const [sortKey, setSortKey] = useState<SortKey>('dealershipCount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const valueOf = (r: GroupRollup): number | string => {
      switch (sortKey) {
        case 'name': return r.name.toLowerCase();
        case 'dealershipCount': return r.dealershipCount;
        case 'pctLive': return r.pctLive;
        case 'bookedRevenue': return r.bookedRevenue;
        case 'realizedRevenue': return r.realizedRevenue;
        case 'healthScore': return r.healthScore;
        case 'delta': return r.deltaDealershipsInPeriod;
      }
    };
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
        No enterprise groups yet. Add one from the Enterprise Groups page.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 dark:bg-white/5 border-b border-slate-200/60 dark:border-[#38383A]">
          <tr>
            <HeaderCell label="Group" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={onSort} />
            <HeaderCell label="# Deal." sortKey="dealershipCount" activeKey={sortKey} dir={sortDir} align="right" onSort={onSort} />
            <HeaderCell label="% Live" sortKey="pctLive" activeKey={sortKey} dir={sortDir} align="right" onSort={onSort} />
            <HeaderCell label="Booked" sortKey="bookedRevenue" activeKey={sortKey} dir={sortDir} align="right" onSort={onSort} />
            <HeaderCell label="Realized" sortKey="realizedRevenue" activeKey={sortKey} dir={sortDir} align="right" onSort={onSort} />
            <HeaderCell label="Health" sortKey="healthScore" activeKey={sortKey} dir={sortDir} align="right" onSort={onSort} />
            <HeaderCell label="Δ Period" sortKey="delta" activeKey={sortKey} dir={sortDir} align="right" onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r)}
              className="border-b border-slate-100 dark:border-[#38383A]/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {r.isIndependents && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <Star size={9} /> Synth
                    </span>
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{r.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                {r.dealershipCount}
              </td>
              <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">
                {formatPct(r.pctLive)}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                {formatCurrency(r.bookedRevenue, true)}
              </td>
              <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">
                {formatCurrency(r.realizedRevenue, true)}
              </td>
              <td className="px-3 py-2.5 text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold ${healthPillClass(r.healthScore)}`}>
                  {r.healthScore}
                </span>
              </td>
              <td className={`px-3 py-2.5 text-right font-semibold ${
                r.deltaDealershipsInPeriod > 0 ? 'text-emerald-600 dark:text-emerald-400'
                : r.deltaDealershipsInPeriod < 0 ? 'text-red-500 dark:text-red-400'
                : 'text-slate-400 dark:text-slate-500'
              }`}>
                {r.deltaDealershipsInPeriod > 0 ? `+${r.deltaDealershipsInPeriod}` : r.deltaDealershipsInPeriod}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500">
        Click a row for group details · "Synth" = synthetic bucket for dealerships without an assigned group
      </div>
    </div>
  );
};

export default GroupsLeaderboard;
