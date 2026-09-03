import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { OEM_MAKES, sortOems } from '../lib/oem';

interface OemSelectorProps {
  /** Currently selected Makes. Displayed and emitted in alphabetical order. */
  value: string[] | undefined;
  /** Called with the full, alphabetised list whenever a Make is added or removed. */
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

/**
 * Searchable multi-select for a dealership's OEMs (vehicle Makes).
 *
 * Selected Makes render as compact chips inside a single input-styled field; clicking
 * anywhere in the field opens a dropdown that lists every Make alphabetically with a
 * selected-state indicator. The dropdown stays open while multiple Makes are toggled and
 * closes on outside click or Escape. Selections are always alphabetised and de-duplicated.
 */
const OemSelector: React.FC<OemSelectorProps> = ({
  value,
  onChange,
  readOnly = false,
  emptyText = 'No OEMs selected',
  placeholder = 'Select Makes...',
}) => {
  const selected = useMemo(() => sortOems(value), [value]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
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

  // Focus the search box and reset the query each time the dropdown opens.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      searchRef.current?.focus();
    }
  }, [isOpen]);

  const filteredMakes = useMemo(() => {
    const q = query.trim().toLowerCase();
    // OEM_MAKES is already alphabetical, so filtering preserves the ordering.
    return q ? OEM_MAKES.filter(make => make.toLowerCase().includes(q)) : OEM_MAKES;
  }, [query]);

  const emit = (next: Iterable<string>) => onChange?.(sortOems(Array.from(new Set(next))));

  const toggleMake = (make: string) => {
    if (selectedSet.has(make)) {
      emit(selected.filter(m => m !== make));
    } else {
      emit([...selected, make]);
    }
  };

  const removeMake = (make: string) => emit(selected.filter(m => m !== make));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {selected.length === 0 ? (
          <span className="text-sm font-normal leading-tight text-slate-700 dark:text-slate-300">{emptyText}</span>
        ) : (
          selected.map(make => (
            <span key={make} className={chipClasses}>{make}</span>
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
        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-600">{placeholder}</span>
          ) : (
            selected.map(make => (
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
                placeholder="Search Makes..."
                aria-label="Search Makes"
                className="w-full pl-6 pr-2 py-1 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Options */}
          <div role="listbox" aria-multiselectable="true" aria-label="Makes" className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredMakes.length === 0 ? (
              <div className="p-3 text-center text-slate-400 italic text-xs">No Makes found</div>
            ) : (
              filteredMakes.map(make => {
                const isSelected = selectedSet.has(make);
                return (
                  <div
                    key={make}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleMake(make)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OemSelector;
