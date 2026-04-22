import React from 'react';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  accent?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  accent = 'bg-white/70 dark:bg-[#1C1C1E]/70 border-slate-200/60 dark:border-[#38383A]',
  headerRight,
  children,
  className = '',
}) => (
  <div className={`rounded-2xl border overflow-hidden mb-6 ${accent} ${className}`}>
    <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
        {icon}
        {title}
      </div>
      {headerRight && <div>{headerRight}</div>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default SectionCard;
