import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { PipelineTrendRow } from '../../lib/metrics';
import { PIPELINE_COLORS } from './constants';

interface PipelineTrendProps {
  data: PipelineTrendRow[];
  onMonthClick?: (monthKey: string, stage: 'received' | 'onboarding' | 'goLive' | 'termed') => void;
}

export const PipelineTrend: React.FC<PipelineTrendProps> = ({ data, onMonthClick }) => {
  if (data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        No pipeline data for this period.
      </div>
    );
  }

  const handleXAxisClick = (monthKey: string) => {
    if (onMonthClick) onMonthClick(monthKey, 'goLive');
  };

  return (
    <div className="w-full h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
          <defs>
            <linearGradient id="pipe-received" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PIPELINE_COLORS.received} stopOpacity={0.4} />
              <stop offset="100%" stopColor={PIPELINE_COLORS.received} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pipe-onboarding" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PIPELINE_COLORS.onboarding} stopOpacity={0.4} />
              <stop offset="100%" stopColor={PIPELINE_COLORS.onboarding} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pipe-golive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PIPELINE_COLORS.goLive} stopOpacity={0.5} />
              <stop offset="100%" stopColor={PIPELINE_COLORS.goLive} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pipe-termed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PIPELINE_COLORS.termed} stopOpacity={0.4} />
              <stop offset="100%" stopColor={PIPELINE_COLORS.termed} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[#3a3a3c]" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval="preserveStartEnd"
            onClick={(e: any) => {
              // Recharts forwards click payload with `index` and the raw tick value
              const idx = typeof e?.index === 'number' ? e.index : null;
              if (idx !== null && data[idx]) handleXAxisClick(data[idx].month);
            }}
            style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
          />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="received" name="Received" stroke={PIPELINE_COLORS.received} strokeWidth={2} fill="url(#pipe-received)" />
          <Area type="monotone" dataKey="onboarding" name="Onboarding" stroke={PIPELINE_COLORS.onboarding} strokeWidth={2} fill="url(#pipe-onboarding)" />
          <Area type="monotone" dataKey="goLive" name="Go-Live" stroke={PIPELINE_COLORS.goLive} strokeWidth={2} fill="url(#pipe-golive)" />
          <Area type="monotone" dataKey="termed" name="Termed" stroke={PIPELINE_COLORS.termed} strokeWidth={2} fill="url(#pipe-termed)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PipelineTrend;
