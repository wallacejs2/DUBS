import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { RevenueMix as RevenueMixData } from '../../lib/metrics';
import { formatCurrency } from '../../lib/dashboardFormat';

interface RevenueMixProps {
  data: RevenueMixData;
}

const SubPanel: React.FC<{ title: string; children: React.ReactNode; isEmpty: boolean; emptyLabel: string }> = ({
  title,
  children,
  isEmpty,
  emptyLabel,
}) => (
  <div className="rounded-xl border border-slate-200/60 dark:border-[#38383A] bg-white/50 dark:bg-[#1C1C1E]/60 overflow-hidden">
    <div className="px-3 py-2 border-b border-slate-200/60 dark:border-[#38383A] text-xs font-bold text-slate-700 dark:text-slate-200">
      {title}
    </div>
    <div className="p-3">
      {isEmpty ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

export const RevenueMix: React.FC<RevenueMixProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SubPanel title="Revenue by Product" isEmpty={data.byProduct.length === 0} emptyLabel="No product revenue in period">
        <div className="w-full h-[200px]">
          <ResponsiveContainer>
            <BarChart data={data.byProduct} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[#3a3a3c]" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v, true)} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SubPanel>

      <SubPanel title="Revenue by Status" isEmpty={data.byStatus.every((s) => s.revenue === 0)} emptyLabel="No revenue in period">
        <div className="w-full h-[200px]">
          <ResponsiveContainer>
            <BarChart data={data.byStatus} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[#3a3a3c]" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v, true)} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {data.byStatus.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SubPanel>
    </div>
  );
};

export default RevenueMix;
