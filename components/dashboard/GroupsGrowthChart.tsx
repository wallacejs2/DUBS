import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { GroupRollup } from '../../lib/metrics';
import { truncate } from '../../lib/dashboardFormat';

interface GroupsGrowthChartProps {
  rows: GroupRollup[];
  limit?: number;
}

export const GroupsGrowthChart: React.FC<GroupsGrowthChartProps> = ({ rows, limit = 15 }) => {
  const data = rows
    .filter((r) => r.deltaDealershipsInPeriod !== 0)
    .sort((a, b) => Math.abs(b.deltaDealershipsInPeriod) - Math.abs(a.deltaDealershipsInPeriod))
    .slice(0, limit)
    .map((r) => ({ name: truncate(r.name, 18), delta: r.deltaDealershipsInPeriod }));

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        No dealership additions or terminations in this period.
      </div>
    );
  }

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[#3a3a3c]" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <ReferenceLine x={0} stroke="#94a3b8" />
          <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.delta >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GroupsGrowthChart;
