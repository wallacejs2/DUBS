import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GroupRollup } from '../../lib/metrics';
import { truncate } from '../../lib/dashboardFormat';

interface GroupsComparisonChartProps {
  rows: GroupRollup[];
  includeIndependents?: boolean;
  limit?: number;
}

export const GroupsComparisonChart: React.FC<GroupsComparisonChartProps> = ({
  rows,
  includeIndependents = false,
  limit = 10,
}) => {
  const data = rows
    .filter((r) => includeIndependents || !r.isIndependents)
    .sort((a, b) => b.dealershipCount - a.dealershipCount)
    .slice(0, limit)
    .map((r) => ({ name: truncate(r.name, 18), count: r.dealershipCount }));

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        No groups to compare yet.
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
          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GroupsComparisonChart;
