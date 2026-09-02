import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DealershipOEM } from '../types';
import { OEM_HIERARCHY, createOemSelection, formatOem, makesForOemGroup } from '../lib/oem';

interface OemSelectorProps {
  /** Current selections, in display/export order. */
  value: DealershipOEM[] | undefined;
  /** Called with the full updated list whenever a selection is added or removed. */
  onChange?: (oems: DealershipOEM[]) => void;
  /** Render chips only (no add/remove controls). */
  readOnly?: boolean;
  /** Text shown when nothing is selected in read-only mode. */
  emptyText?: string;
}

const selectClasses =
  'w-full px-2 py-1 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-xl focus:ring-1 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal disabled:opacity-50 disabled:cursor-not-allowed';

const chipClasses =
  'inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800 rounded-md text-xs font-bold tracking-wide';

/**
 * Compact OEM picker: selected OEMs are shown as "OEM Group - Make" chips, and "+ Add OEM"
 * reveals a two-level OEM Group -> Make picker. Choosing a Make adds it immediately (its OEM
 * Group is resolved from the shared hierarchy), and Makes already selected are hidden so a
 * Make can never be added twice.
 */
const OemSelector: React.FC<OemSelectorProps> = ({ value, onChange, readOnly = false, emptyText = 'No OEMs selected' }) => {
  const selections = value || [];
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerGroup, setPickerGroup] = useState('');

  const selectedMakes = useMemo(() => new Set(selections.map(s => s.make)), [selections]);

  // Available Makes = hierarchy minus Makes already on this dealership, optionally
  // narrowed to the chosen OEM Group.
  const availableGroups = useMemo(
    () =>
      OEM_HIERARCHY
        .filter(g => !pickerGroup || g.group === pickerGroup)
        .map(g => ({ group: g.group, makes: g.makes.filter(m => !selectedMakes.has(m)) })),
    [pickerGroup, selectedMakes]
  );
  const availableMakeCount = availableGroups.reduce((n, g) => n + g.makes.length, 0);
  const groupExhausted = !!pickerGroup && makesForOemGroup(pickerGroup).every(m => selectedMakes.has(m));

  const addMake = (make: string) => {
    if (!make || selectedMakes.has(make)) return;
    const selection = createOemSelection(make);
    if (!selection) return;
    // Keep the OEM Group filter so the next Make from the same group is one click away.
    onChange?.([...selections, selection]);
  };

  const removeAt = (idx: number) => {
    onChange?.(selections.filter((_, i) => i !== idx));
  };

  const closePicker = () => {
    setIsPickerOpen(false);
    setPickerGroup('');
  };

  const chips = selections.map((oem, idx) => (
    <span key={oem.make} className={chipClasses} title={formatOem(oem)}>
      {formatOem(oem)}
      {!readOnly && (
        <button
          type="button"
          onClick={() => removeAt(idx)}
          className="text-violet-400 hover:text-red-500 transition-colors"
          aria-label={`Remove ${formatOem(oem)}`}
        >
          <X size={10} />
        </button>
      )}
    </span>
  ));

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {selections.length === 0 ? (
          <span className="text-sm font-normal leading-tight text-slate-700 dark:text-slate-300">{emptyText}</span>
        ) : (
          chips
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 items-center min-h-[26px]">
        {chips}
        <button
          type="button"
          onClick={() => (isPickerOpen ? closePicker() : setIsPickerOpen(true))}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border border-dashed transition-colors ${
            isPickerOpen
              ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
              : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
          aria-expanded={isPickerOpen}
        >
          <Plus size={12} /> Add OEM
        </button>
      </div>

      {isPickerOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end bg-slate-50/50 dark:bg-white/[0.02] p-2 rounded-lg border border-slate-100/60 dark:border-[#38383A]">
          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 block">OEM Group</label>
            <select
              value={pickerGroup}
              onChange={(e) => setPickerGroup(e.target.value)}
              className={selectClasses}
              aria-label="OEM Group"
            >
              <option value="">All OEM Groups</option>
              {OEM_HIERARCHY.map(g => (
                <option key={g.group} value={g.group}>{g.group}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 block">Make</label>
            <select
              value=""
              onChange={(e) => addMake(e.target.value)}
              disabled={availableMakeCount === 0}
              className={selectClasses}
              aria-label="Make"
            >
              <option value="">
                {availableMakeCount === 0
                  ? (groupExhausted ? 'All makes in this group selected' : 'All makes selected')
                  : 'Select a Make...'}
              </option>
              {pickerGroup
                ? availableGroups.flatMap(g => g.makes).map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))
                : availableGroups
                    .filter(g => g.makes.length > 0)
                    .map(g => (
                      <optgroup key={g.group} label={g.group}>
                        {g.makes.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </optgroup>
                    ))}
            </select>
          </div>
          <button
            type="button"
            onClick={closePicker}
            className="h-[30px] px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Done adding OEMs"
            title="Done"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default OemSelector;
