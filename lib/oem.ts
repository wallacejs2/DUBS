/**
 * The single source of truth for the vehicle Makes a dealership can represent.
 *
 * OEMs are stored at the dealership level as a flat, alphabetised list of Make names
 * (e.g. ["Acura", "Volkswagen"]). There is no OEM Group / parent-company layer: the Make
 * itself is the value used for selection, display, validation, filtering and export.
 */

const sortMakes = (makes: readonly string[]): string[] =>
  [...makes].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

/** Every selectable Make, always in alphabetical order. */
export const OEM_MAKES: readonly string[] = sortMakes([
  'Acura',
  'Alfa Romeo',
  'Aston Martin',
  'Audi',
  'Bentley',
  'BMW',
  'Bugatti',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ferrari',
  'FIAT',
  'Ford',
  'Genesis',
  'GMC',
  'Honda',
  'Hyundai',
  'INEOS',
  'Infiniti',
  'Jaguar',
  'Jeep',
  'Karma',
  'Kia',
  'Koenigsegg',
  'Lamborghini',
  'Land Rover',
  'Lexus',
  'Lincoln',
  'Lotus',
  'Lucid',
  'Maserati',
  'Mazda',
  'McLaren',
  'Mercedes-Benz',
  'MINI',
  'Mitsubishi',
  'Nissan',
  'Pagani',
  'Polestar',
  'Porsche',
  'Ram',
  'Rivian',
  'Rolls-Royce',
  'Subaru',
  'Tesla',
  'Toyota',
  'VinFast',
  'Volkswagen',
  'Volvo',
]);

/** Case-insensitive lookup from any spelling of a Make to its canonical name. */
const CANONICAL_MAKE: ReadonlyMap<string, string> = new Map(OEM_MAKES.map(m => [m.toLowerCase(), m]));

/** The canonical Make name for a value, or undefined if it is not a known Make. */
export const findMake = (value: unknown): string | undefined =>
  typeof value === 'string' ? CANONICAL_MAKE.get(value.trim().toLowerCase()) : undefined;

/** Whether a value names a known Make. */
export const isKnownMake = (value: unknown): boolean => findMake(value) !== undefined;

/** Alphabetise a list of Makes (never mutates the input). */
export const sortOems = (makes: readonly string[] | undefined | null): string[] =>
  sortMakes(Array.isArray(makes) ? makes : []);

/**
 * Sanitise a stored/incoming OEM list into a clean, alphabetised list of Make names.
 *  - Accepts plain Make strings, and legacy `{ make }` objects from the old
 *    OEM Group -> Make model (only the Make is kept; the group is discarded).
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

/**
 * Export value for a dealership's OEMs: the selected Makes, alphabetised and joined with
 * commas into a single cell, e.g. "Buick, Chevrolet, GMC".
 */
export const formatOemsForExport = (oems: readonly string[] | undefined | null): string =>
  normalizeOems(oems).join(', ');

/** Whether a dealership has no OEMs recorded (list missing or empty). */
export const hasNoOems = (oems: readonly string[] | undefined | null): boolean =>
  !Array.isArray(oems) || oems.length === 0;

/**
 * Whether a dealership's OEM list satisfies a Make filter. The filter is a Make name;
 * an empty or unknown value matches everything (i.e. the filter is inactive).
 */
export const matchesOemFilter = (
  oems: readonly string[] | undefined | null,
  make: string | undefined | null
): boolean => {
  const wanted = findMake(make);
  if (!wanted) return true;
  return normalizeOems(oems).includes(wanted);
};
