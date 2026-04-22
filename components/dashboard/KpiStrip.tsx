import React from 'react';

interface KpiStripProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}

export const KpiStrip: React.FC<KpiStripProps> = ({ children, cols = 4 }) => {
  const colClass =
    cols === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : cols === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  return <div className={`grid ${colClass} gap-3 mb-6`}>{children}</div>;
};

export default KpiStrip;
