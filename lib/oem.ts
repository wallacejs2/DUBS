/**
 * The single source of truth for the OEM Group -> Make hierarchy a dealership can represent.
 *
 * Makes are grouped under their parent OEM Group (e.g. GM -> Chevrolet, Buick, GMC, Cadillac).
 * A Make belongs to exactly one OEM Group, so the group is always DERIVED from the Make and is
 * never stored: dealerships keep a flat, alphabetised list of Make names (e.g. ["Buick",
 * "Chevrolet", "Jeep"]) and every group-level feature (picker narrowing, "select all in group",
 * grouped chips, group filters, dashboard rollups, export) resolves the group from the Make.
 *
 * "Used" is included as a selectable Make (under "Other") so a dealership that sells only
 * pre-owned inventory can be tagged alongside the franchised OEMs.
 */

const sortMakes = (makes: readonly string[]): string[] =>
  [...makes].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

export interface OemGroupDefinition {
  group: string;
  /** The group's Makes, always alphabetised. */
  makes: readonly string[];
}

/** The catch-all OEM Group for Makes without a franchise-level parent (plus "Used"). */
export const OTHER_OEM_GROUP = 'Other';

const defineGroup = (group: string, makes: readonly string[]): OemGroupDefinition => ({
  group,
  makes: sortMakes(makes),
});

/** Every OEM Group with its Makes, in display order ("Other" always last). */
export const OEM_HIERARCHY: readonly OemGroupDefinition[] = [
  defineGroup('GM', ['Chevrolet', 'Buick', 'GMC', 'Cadillac']),
  defineGroup('CDJR', ['Chrysler', 'Dodge', 'Jeep', 'Ram', 'FIAT', 'Alfa Romeo']),
  defineGroup('Ford', ['Ford', 'Lincoln']),
  defineGroup('Toyota', ['Toyota', 'Lexus']),
  defineGroup('Honda', ['Honda', 'Acura']),
  defineGroup('Nissan', ['Nissan', 'Infiniti']),
  defineGroup('Hyundai', ['Hyundai', 'Genesis']),
  defineGroup('Kia', ['Kia']),
  defineGroup('VW Group', ['Volkswagen', 'Audi', 'Porsche', 'Bentley', 'Lamborghini', 'Bugatti']),
  defineGroup('BMW', ['BMW', 'MINI', 'Rolls-Royce']),
  defineGroup('Mercedes-Benz', ['Mercedes-Benz']),
  defineGroup('Subaru', ['Subaru']),
  defineGroup('Mazda', ['Mazda']),
  defineGroup('Mitsubishi', ['Mitsubishi']),
  defineGroup('JLR', ['Jaguar', 'Land Rover']),
  defineGroup('Volvo', ['Volvo', 'Polestar']),
  defineGroup('Tesla', ['Tesla']),
  defineGroup('Rivian', ['Rivian']),
  defineGroup('Lucid', ['Lucid']),
  defineGroup(OTHER_OEM_GROUP, [
    'Aston Martin',
    'Ferrari',
    'INEOS',
    'Karma',
    'Koenigsegg',
    'Lotus',
    'Maserati',
    'McLaren',
    'Pagani',
    'Used',
    'VinFast',
  ]),
];

/** Every OEM Group name, in hierarchy (display) order. */
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

/** Every selectable Make across all OEM Groups, always in alphabetical order. */
export const OEM_MAKES: readonly string[] = sortMakes(Array.from(MAKE_TO_GROUP.keys()));

/** Case-insensitive lookup from any spelling of a Make to its canonical name. */
const CANONICAL_MAKE: ReadonlyMap<string, string> = new Map(OEM_MAKES.map(m => [m.toLowerCase(), m]));

/** Case-insensitive lookup from any spelling of an OEM Group to its canonical name. */
const CANONICAL_GROUP: ReadonlyMap<string, string> = new Map(OEM_GROUPS.map(g => [g.toLowerCase(), g]));

/** Position of each OEM Group in the hierarchy, for ordering grouped output. */
const GROUP_ORDER: ReadonlyMap<string, number> = new Map(OEM_GROUPS.map((g, i) => [g, i]));

/** The canonical Make name for a value, or undefined if it is not a known Make. */
export const findMake = (value: unknown): string | undefined =>
  typeof value === 'string' ? CANONICAL_MAKE.get(value.trim().toLowerCase()) : undefined;

/** Whether a value names a known Make. */
export const isKnownMake = (value: unknown): boolean => findMake(value) !== undefined;

/** The canonical OEM Group name for a value, or undefined if it is not a known group. */
export const findOemGroup = (value: unknown): string | undefined =>
  typeof value === 'string' ? CANONICAL_GROUP.get(value.trim().toLowerCase()) : undefined;

/** Whether a value names a known OEM Group. */
export const isKnownOemGroup = (value: unknown): boolean => findOemGroup(value) !== undefined;

/** The OEM Group a Make belongs to (case-insensitive), or undefined for an unknown Make. */
export const findOemGroupForMake = (make: unknown): string | undefined => {
  const canonical = findMake(make);
  return canonical ? MAKE_TO_GROUP.get(canonical) : undefined;
};

/** Makes belonging to one OEM Group, alphabetised (empty for an unknown group). */
export const makesForOemGroup = (group: string): readonly string[] => {
  const canonical = findOemGroup(group);
  return canonical ? OEM_HIERARCHY.find(g => g.group === canonical)?.makes ?? [] : [];
};

/** Alphabetise a list of Makes (never mutates the input). */
export const sortOems = (makes: readonly string[] | undefined | null): string[] =>
  sortMakes(Array.isArray(makes) ? makes : []);

/**
 * Sanitise a stored/incoming OEM list into a clean, alphabetised list of Make names.
 *  - Accepts plain Make strings, and legacy `{ make }` objects from the old
 *    stored OEM Group -> Make model (only the Make is kept; the group is derived).
 *  - Drops values that are not in the Make list.
 *  - Removes duplicate Makes.
 */
export const normalizeOems = (oems: unknown): string[] => {
  if (!Array.isArray(oems)) return [];
  const seen = new Set<string>();
  oems.forEach((entry: unknown) => {
    const raw = typeof entry === 'string' ? entry : (entry as { make?: unknown } | null)?.make;
    const make = findMake(raw);
    if (make) seen.add(make);
  });
  return sortMakes(Array.from(seen));
};

/** Whether a stored OEM list still uses the legacy `{ oem_group, make }` object shape. */
export const hasLegacyOemShape = (oems: unknown): boolean =>
  Array.isArray(oems) && oems.some(entry => typeof entry !== 'string');

/** A dealership's selected Makes bucketed under their OEM Group. */
export interface OemGroupSelection {
  group: string;
  /** The selected Makes in this group, alphabetised. */
  makes: string[];
}

/**
 * Bucket a dealership's Makes by OEM Group. Groups come back in hierarchy order and only
 * groups with at least one selected Make are included; Makes within a group are alphabetised.
 * This is the one helper the picker chips, read-only view, dashboard and export all use.
 */
export const groupOems = (oems: unknown): OemGroupSelection[] => {
  const buckets = new Map<string, string[]>();
  normalizeOems(oems).forEach(make => {
    const group = MAKE_TO_GROUP.get(make);
    if (!group) return;
    const list = buckets.get(group);
    if (list) list.push(make);
    else buckets.set(group, [make]);
  });
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (GROUP_ORDER.get(a) ?? Infinity) - (GROUP_ORDER.get(b) ?? Infinity))
    .map(([group, makes]) => ({ group, makes: sortMakes(makes) }));
};

/** The distinct OEM Groups a dealership represents, in hierarchy order. */
export const oemGroupsFor = (oems: unknown): string[] => groupOems(oems).map(g => g.group);

/**
 * Export value for a dealership's OEMs: one "OEM Group - Make" entry per selected Make,
 * grouped in hierarchy order and joined with commas into a single cell, e.g.
 * "GM - Buick, GM - Chevrolet, CDJR - Jeep".
 */
export const formatOemsForExport = (oems: readonly string[] | undefined | null): string =>
  groupOems(oems)
    .flatMap(({ group, makes }) => makes.map(make => `${group} - ${make}`))
    .join(', ');

/** Whether a dealership has no OEMs recorded (list missing or empty). */
export const hasNoOems = (oems: readonly string[] | undefined | null): boolean =>
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
 * A bare Make name with no "kind:" prefix (the pre-group filter format) is accepted as a
 * Make selection.
 */
export const parseOemFilter = (encoded: string | undefined | null): OemFilterSelection | null => {
  if (!encoded) return null;
  const idx = encoded.indexOf(OEM_FILTER_SEPARATOR);
  if (idx <= 0) {
    const make = findMake(encoded);
    return make ? { kind: 'make', value: make } : null;
  }
  const kind = encoded.slice(0, idx);
  const value = encoded.slice(idx + 1);
  if (kind === 'group') {
    const group = findOemGroup(value);
    return group ? { kind, value: group } : null;
  }
  if (kind === 'make') {
    const make = findMake(value);
    return make ? { kind, value: make } : null;
  }
  return null;
};

/**
 * Whether a dealership's OEM list satisfies an OEM filter.
 *  - A group selection matches when any of the dealership's Makes belongs to that OEM Group
 *    (e.g. "group:GM" matches a dealership with GMC).
 *  - A make selection matches only the exact Make (e.g. "make:Lexus" does NOT match a
 *    dealership that only has Toyota).
 * An empty or unparseable filter matches everything (i.e. the filter is inactive).
 */
export const matchesOemFilter = (
  oems: readonly string[] | undefined | null,
  filter: string | OemFilterSelection | undefined | null
): boolean => {
  const selection = typeof filter === 'string' ? parseOemFilter(filter) : filter ?? null;
  if (!selection) return true;
  const makes = normalizeOems(oems);
  if (selection.kind === 'group') {
    return makes.some(make => MAKE_TO_GROUP.get(make) === selection.value);
  }
  return makes.includes(selection.value);
};
