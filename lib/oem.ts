import { DealershipOEM } from '../types';

/**
 * The single source of truth for the OEM Group -> Make hierarchy.
 *
 * Every OEM feature (filtering the Make dropdown, auto-resolving the OEM Group for a
 * Make, chip display, duplicate prevention, and CSV export) reads from this list so the
 * relationship stays consistent everywhere. A Make must belong to exactly one OEM Group.
 */
export interface OemGroupDefinition {
  group: string;
  makes: string[];
}

export const OEM_HIERARCHY: readonly OemGroupDefinition[] = [
  { group: 'GM', makes: ['Chevrolet', 'Buick', 'GMC', 'Cadillac'] },
  { group: 'Ford', makes: ['Ford', 'Lincoln'] },
  { group: 'Stellantis', makes: ['Chrysler', 'Dodge', 'Jeep', 'Ram', 'Fiat', 'Alfa Romeo', 'Maserati'] },
  { group: 'Toyota', makes: ['Toyota', 'Lexus'] },
  { group: 'Honda', makes: ['Honda', 'Acura'] },
  { group: 'Nissan', makes: ['Nissan', 'Infiniti'] },
  { group: 'Mitsubishi', makes: ['Mitsubishi'] },
  { group: 'Hyundai Motor Group', makes: ['Hyundai', 'Kia', 'Genesis'] },
  { group: 'Volkswagen Group', makes: ['Volkswagen', 'Audi', 'Porsche', 'Bentley', 'Lamborghini'] },
  { group: 'BMW Group', makes: ['BMW', 'MINI', 'Rolls-Royce'] },
  { group: 'Mercedes-Benz Group', makes: ['Mercedes-Benz'] },
  { group: 'Subaru', makes: ['Subaru'] },
  { group: 'Mazda', makes: ['Mazda'] },
  { group: 'Jaguar Land Rover', makes: ['Jaguar', 'Land Rover'] },
  { group: 'Geely', makes: ['Volvo', 'Polestar', 'Lotus'] },
  { group: 'Tesla', makes: ['Tesla'] },
  { group: 'Rivian', makes: ['Rivian'] },
  { group: 'Lucid', makes: ['Lucid'] },
  { group: 'VinFast', makes: ['VinFast'] },
  { group: 'INEOS', makes: ['INEOS'] },
];

/** Every OEM Group name, in hierarchy order. */
export const OEM_GROUPS: readonly string[] = OEM_HIERARCHY.map(g => g.group);

/** Make -> OEM Group lookup. Built once; guarantees a Make maps to exactly one group. */
const MAKE_TO_GROUP: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  OEM_HIERARCHY.forEach(({ group, makes }) => {
    makes.forEach(make => {
      if (map.has(make)) {
        throw new Error(`OEM hierarchy error: make "${make}" is listed under both "${map.get(make)}" and "${group}"`);
      }
      map.set(make, group);
    });
  });
  return map;
})();

/** Every Make across all OEM Groups, in hierarchy order. */
export const OEM_MAKES: readonly string[] = Array.from(MAKE_TO_GROUP.keys());

/** The OEM Group a Make belongs to, or undefined for an unknown Make. */
export const findOemGroupForMake = (make: string): string | undefined => MAKE_TO_GROUP.get(make);

/** Makes belonging to one OEM Group (empty for an unknown group). */
export const makesForOemGroup = (group: string): readonly string[] =>
  OEM_HIERARCHY.find(g => g.group === group)?.makes ?? [];

/** Whether a Make is a known Make within its given OEM Group. */
export const isValidOem = (oem: Pick<DealershipOEM, 'oem_group' | 'make'>): boolean =>
  findOemGroupForMake(oem.make) === oem.oem_group;

/** Display value for one selection, e.g. "GM - Chevrolet". */
export const formatOem = (oem: Pick<DealershipOEM, 'oem_group' | 'make'>): string =>
  `${oem.oem_group} - ${oem.make}`;

/**
 * Export value for a dealership's OEMs: every selection in its saved order, formatted as
 * "OEM Group - Make" and joined with commas into a single cell.
 */
export const formatOemsForExport = (oems: readonly DealershipOEM[] | undefined): string =>
  (oems || []).map(formatOem).join(', ');

/** Build a selection for a Make, resolving its OEM Group from the hierarchy. */
export const createOemSelection = (make: string): DealershipOEM | null => {
  const group = findOemGroupForMake(make);
  if (!group) return null;
  return { oem_group: group, make };
};

/**
 * Sanitise a stored/incoming OEM list: drop entries that are not in the hierarchy,
 * re-derive the OEM Group from the Make (the Make is authoritative), and remove
 * duplicate Makes while preserving first-seen order.
 */
export const normalizeOems = (oems: unknown): DealershipOEM[] => {
  if (!Array.isArray(oems)) return [];
  const seen = new Set<string>();
  const result: DealershipOEM[] = [];
  oems.forEach((entry: any) => {
    const make = typeof entry?.make === 'string' ? entry.make.trim() : '';
    const group = make ? findOemGroupForMake(make) : undefined;
    if (!group || seen.has(make)) return;
    seen.add(make);
    result.push({ oem_group: group, make });
  });
  return result;
};

/** Every Make across all OEM Groups, sorted alphabetically (for flat "all Makes" lists). */
export const OEM_MAKES_ALPHABETICAL: readonly string[] = [...OEM_MAKES].sort((a, b) => a.localeCompare(b));

/** Whether a dealership has no OEMs recorded (list missing or empty). */
export const hasNoOems = (oems: readonly DealershipOEM[] | undefined | null): boolean =>
  !Array.isArray(oems) || oems.length === 0;

/**
 * OEM filter selection. A single encoded string field covers both levels of the
 * hierarchy so it fits alongside the other string-valued dealership filters:
 *   "group:<OEM Group>"  -> match any dealership with at least one Make in that group
 *   "make:<Make>"        -> match only dealerships with that exact Make
 */
export type OemFilterKind = 'group' | 'make';

export interface OemFilterSelection {
  kind: OemFilterKind;
  value: string;
}

const OEM_FILTER_SEPARATOR = ':';

/** Encode an OEM filter selection into its stored string form, e.g. "group:GM" or "make:Lexus". */
export const encodeOemFilter = (kind: OemFilterKind, value: string): string =>
  `${kind}${OEM_FILTER_SEPARATOR}${value}`;

/**
 * Parse a stored OEM filter value. Returns null for an empty value or one that does not
 * name a known OEM Group / Make, so a stale selection never silently matches everything.
 */
export const parseOemFilter = (encoded: string | undefined | null): OemFilterSelection | null => {
  if (!encoded) return null;
  const idx = encoded.indexOf(OEM_FILTER_SEPARATOR);
  if (idx <= 0) return null;
  const kind = encoded.slice(0, idx);
  const value = encoded.slice(idx + 1).trim();
  if (!value) return null;
  if (kind === 'group') return OEM_GROUPS.includes(value) ? { kind, value } : null;
  if (kind === 'make') return MAKE_TO_GROUP.has(value) ? { kind, value } : null;
  return null;
};

/**
 * Whether a dealership's OEM list satisfies an OEM filter.
 *  - A group selection matches when any of the dealership's Makes belongs to that OEM Group
 *    (e.g. "group:GM" matches a dealership with "GM - GMC").
 *  - A make selection matches only the exact Make (e.g. "make:Lexus" does NOT match a
 *    dealership that only has "Toyota - Toyota").
 * An empty or unparseable filter matches everything (i.e. the filter is inactive).
 */
export const matchesOemFilter = (
  oems: readonly DealershipOEM[] | undefined | null,
  filter: string | OemFilterSelection | undefined | null
): boolean => {
  const selection = typeof filter === 'string' ? parseOemFilter(filter) : filter ?? null;
  if (!selection) return true;
  const list = Array.isArray(oems) ? oems : [];
  if (selection.kind === 'group') {
    return list.some(oem => findOemGroupForMake(oem.make) === selection.value);
  }
  return list.some(oem => oem.make === selection.value);
};
