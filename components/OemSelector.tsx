import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Minus, Search, X } from 'lucide-react';
import { OEM_GROUPS, OEM_HIERARCHY, groupOems, makesForOemGroup, sortOems } from '../lib/oem';

interface OemSelectorProps {
  /** Currently selected Makes. Displayed grouped by OEM Group and emitted in alphabetical order. */
  value: string[] | undefined;
  /** Called with the full, alphabetised list of Makes whenever a Make is added or removed. */
  onChange?: (makes: string[]) => void;
  /** Render selected chips only (no dropdown or remove controls). */
  readOnly?: boolean;
  /** Text shown when nothing is selected in read-only mode. */
  emptyText?: string;
  /** Placeholder shown in the field when nothing is selected. */
  placeholder?: string;
}

const chipClasses =
  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold leading-4 max-w-full';

const groupLabelClasses =
  'text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-4 whitespace-nowrap';

/** Sentinel for the group strip's "All" option (no narrowing). */
const ALL_GROUPS = '';

/**
 * Searchable multi-select for a dealership's OEMs, organised by OEM Group.
 *
 * Selected Makes render as compact chips inside a single input-styled field, clustered under
 * their OEM Group label (e.g. "GM  Buick  Chevrolet"). Clicking anywhere in the field opens a
 * dropdown with:
 *   - a search box that matches Make and OEM Group names,
 *   - a strip of OEM Group buttons that narrows the list to one group ("All" shows every group),
 *   - the Makes listed under their group heading; the heading's checkbox selects or clears
 *     every Make in that group at once, while each Make row toggles just that Make.
 * The dropdown stays open while multiple Makes are toggled and closes on outside click or
 * Escape. The emitted value is always a flat, alphabetised, de-duplicated list of Makes; the
 * OEM Group is derived from the Make and never stored.
 */
const OemSelector: React.FC<OemSelectorProps> = ({
  value,
  onChange,
  readOnly = false,
  emptyText = 'No OEMs selected',
  placeholder = 'Select OEM Group & Makes...',
}) => {
  const selected = useMemo(() => sortOems(value), [value]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedGroups = useMemo(() => groupOems(selected), [selected]);
  const selectedCountByGroup = useMemo(
    () => new Map(selectedGroups.map(g => [g.group, g.makes.length])),
    [selectedGroups]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>(ALL_GROUPS);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click (mousedown so the click never reaches the page underneath).
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus the search box and reset the query / group narrowing each time the dropdown opens.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveGroup(ALL_GROUPS);
      searchRef.current?.focus();
    }
  }, [isOpen]);

  /**
   * Groups (with their Makes) to list. A search query matches either the group name (all of
   * its Makes are shown) or individual Make names, and overrides the group strip so a result
   * can never be hidden by a stale narrowing. Without a query the strip narrows to one group.
   */
  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return OEM_HIERARCHY
        .map(({ group, makes }) => ({
          group,
          makes: group.toLowerCase().includes(q) ? [...makes] : makes.filter(m => m.toLowerCase().includes(q)),
        }))
        .filter(g => g.makes.length > 0);
    }
    const groups = activeGroup ? OEM_HIERARCHY.filter(g => g.group === activeGroup) : OEM_HIERARCHY;
    return groups.map(({ group, makes }) => ({ group, makes: [...makes] }));
  }, [query, activeGroup]);

  const emit = (next: Iterable<string>) => onChange?.(sortOems(Array.from(new Set(next))));

  const toggleMake = (make: string) => {
    if (selectedSet.has(make)) {
      emit(selected.filter(m => m !== make));
    } else {
      emit([...selected, make]);
    }
  };

  const removeMake = (make: string) => emit(selected.filter(m => m !== make));

  /** Select every Make in a group, or clear them all when they are all already selected. */
  const toggleGroup = (group: string) => {
    const makes = makesForOemGroup(group);
    const allSelected = makes.every(m => selectedSet.has(m));
    if (allSelected) {
      emit(selected.filter(m => !makes.includes(m)));
    } else {
      emit([...selected, ...makes]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  if (readOnly) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
        {selectedGroups.length === 0 ? (
          <span className="text-sm font-normal leading-tight text-slate-700 dark:text-slate-300">{emptyText}</span>
        ) : (
          selectedGroups.map(({ group, makes }) => (
            <div key={group} className="inline-flex flex-wrap items-center gap-1">
              <span className={groupLabelClasses}>{group}</span>
              {makes.map(make => (
                <span key={make} className={chipClasses}>{make}</span>
              ))}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger: looks like the form's Input/Select controls; grows only when chips wrap. */}
      <div
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="OEMs"
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-2 py-1 min-h-[30px] text-sm border rounded-xl outline-none cursor-pointer transition-colors bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal focus:ring-1 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
          isOpen
            ? 'border-blue-500 ring-1 ring-blue-500'
            : 'border-slate-200/60 dark:border-[#38383A] hover:border-slate-300 dark:hover:border-[#48484A]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 flex-1 min-w-0">
          {selectedGroups.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-600">{placeholder}</span>
          ) : (
            selectedGroups.map(({ group, makes }, index) => (
              <div
                key={group}
                className={`inline-flex flex-wrap items-center gap-1 ${
                  index > 0 ? 'border-l border-slate-200/60 dark:border-[#38383A] pl-2' : ''
                }`}
              >
                <span className={groupLabelClasses}>{group}</span>
                {makes.map(make => (
                  <span key={make} className={chipClasses}>
                    <span className="truncate">{make}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeMake(make); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-blue-400 dark:text-blue-400/80 hover:text-blue-900 dark:hover:text-blue-100 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                      aria-label={`Remove ${make}`}
                      title={`Remove ${make}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            ))
          )}
        </div>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur border border-slate-200/60 dark:border-[#38383A] rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          {/* Search */}
          <div className="p-1.5 border-b border-slate-100/60 dark:border-[#38383A]">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Makes or OEM Groups..."
                aria-label="Search Makes or OEM Groups"
                className="w-full pl-6 pr-2 py-1 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* OEM Group strip: narrows the list to one group. Hidden while searching (search wins). */}
          {!query.trim() && (
            <div
              role="tablist"
              aria-label="OEM Groups"
              className="flex flex-wrap gap-1 px-1.5 py-1.5 border-b border-slate-100/60 dark:border-[#38383A]"
            >
              {[ALL_GROUPS, ...OEM_GROUPS].map(group => {
                const isActive = group === activeGroup;
                const count = group ? selectedCountByGroup.get(group) ?? 0 : selected.length;
                return (
                  <button
                    key={group || '__all'}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setActiveGroup(group)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                      isActive
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-slate-100/50 dark:bg-[#2C2C2E] border-slate-200/60 dark:border-[#38383A] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#48484A]'
                    }`}
                  >
                    {group || 'All'}
                    {count > 0 && (
                      <span className={`px-1 rounded-full text-[10px] leading-4 ${
                        isActive ? 'bg-white/25 text-white' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Options, grouped by OEM Group */}
          <div role="listbox" aria-multiselectable="true" aria-label="Makes" className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            {visibleGroups.length === 0 ? (
              <div className="p-3 text-center text-slate-400 italic text-xs">No Makes or OEM Groups found</div>
            ) : (
              visibleGroups.map(({ group, makes }) => {
                const groupMakes = makesForOemGroup(group);
                const selectedInGroup = groupMakes.filter(m => selectedSet.has(m)).length;
                const allSelected = selectedInGroup === groupMakes.length;
                const someSelected = selectedInGroup > 0 && !allSelected;
                return (
                  <div key={group} role="group" aria-label={group} className="mb-1 last:mb-0">
                    {/* Group heading: tri-state checkbox selects / clears every Make in the group. */}
                    <div
                      role="option"
                      aria-selected={allSelected}
                      onClick={() => toggleGroup(group)}
                      title={allSelected ? `Clear all ${group} Makes` : `Select all ${group} Makes`}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
                        allSelected
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex items-center justify-center w-3.5 h-3.5 rounded border shrink-0 transition-colors ${
                          allSelected || someSelected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#2C2C2E]'
                        }`}
                      >
                        {allSelected && <Check size={10} strokeWidth={3} />}
                        {someSelected && <Minus size={10} strokeWidth={3} />}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{group}</span>
                      {selectedInGroup > 0 && (
                        <span className="ml-auto text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {selectedInGroup}/{groupMakes.length}
                        </span>
                      )}
                    </div>

                    {makes.map(make => {
                      const isSelected = selectedSet.has(make);
                      return (
                        <div
                          key={make}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => toggleMake(make)}
                          className={`flex items-center gap-2.5 pl-6 pr-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`flex items-center justify-center w-3.5 h-3.5 rounded border shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#2C2C2E]'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </span>
                          <span className="text-sm">{make}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OemSelector;
