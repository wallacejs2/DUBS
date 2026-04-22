import React from 'react';
import { Calendar, X } from 'lucide-react';
import { PeriodPreset } from '../../lib/dateRanges';

interface TimeFiltersProps {
  asOfDate: string;
  onAsOfChange: (v: string) => void;
  periodPreset: PeriodPreset;
  onPresetChange: (p: PeriodPreset) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (start: string, end: string) => void;
  periodLabel: string;
}

const PRESETS: Array<{ key: PeriodPreset; label: string }> = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'ytd', label: 'YTD' },
  { key: 'last_12', label: 'Last 12 Mo' },
];

export const TimeFilters: React.FC<TimeFiltersProps> = ({
  asOfDate,
  onAsOfChange,
  periodPreset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomChange,
  periodLabel,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {/* As-of date */}
      <div
        className="flex items-center gap-2 bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 dark:border-[#38383A]"
        title="Snapshot KPIs are evaluated as of this date"
      >
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">As of</span>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => onAsOfChange(e.target.value)}
          className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
          aria-label="As-of date for snapshot KPIs"
        />
      </div>

      {/* Period pills */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A]">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-2 mr-1">Period</span>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPresetChange(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodPreset === p.key
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="flex items-center gap-2 bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 dark:border-[#38383A]">
        <Calendar size={14} className="text-slate-400 ml-1" />
        <input
          type="date"
          value={customStart}
          onChange={(e) => onCustomChange(e.target.value, customEnd)}
          className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
          aria-label="Custom period start"
        />
        <span className="text-slate-300 dark:text-slate-600 text-xs">–</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => onCustomChange(customStart, e.target.value)}
          className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
          aria-label="Custom period end"
        />
        {(customStart || customEnd) && (
          <button
            type="button"
            onClick={() => {
              onCustomChange('', '');
              onPresetChange('this_month');
            }}
            className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            aria-label="Clear custom range"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">
        Showing: <span className="text-slate-600 dark:text-slate-300">{periodLabel}</span>
      </div>
    </div>
  );
};

export default TimeFilters;
