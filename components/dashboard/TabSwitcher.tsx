import React from 'react';

interface TabConfig<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
}

interface TabSwitcherProps<T extends string> {
  tabs: ReadonlyArray<TabConfig<T>>;
  active: T;
  onChange: (key: T) => void;
}

export function TabSwitcher<T extends string>({ tabs, active, onChange }: TabSwitcherProps<T>) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard sections"
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm border border-slate-200/60 dark:border-[#38383A]"
    >
      {tabs.map((t) => {
        const selected = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selected
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default TabSwitcher;
