import { FeeType, Order, OrderProduct, ProductPricing } from '../types';

/**
 * Single source of truth for DMT order pricing math.
 *
 * - A line item with an explicit `amount` is a confirmed price.
 * - A line item with `amount == null` is *estimated*: it resolves to the
 *   product code's default price from `ProductPricing`, or 0 when no
 *   default is set (in which case it is also flagged *unpriced*).
 * - Every line item carries a fee type; legacy records without one are
 *   treated as monthly recurring.
 */

export interface ResolvedLine {
  amount: number;
  isEstimated: boolean;
  isUnpriced: boolean;
  feeType: FeeType;
}

export interface OrderSummary {
  monthly: number;
  oneTime: number;
  total: number;
  confirmedTotal: number;
  estimatedTotal: number;
  hasEstimated: boolean;
  hasUnpriced: boolean;
  hasOneTime: boolean;
  lineCount: number;
}

export interface ProductSalesEntry {
  count: number;
  monthly: number;
  oneTime: number;
  total: number;
  estimatedCount: number;
}

export const EST_MARKER = 'est.';

export const FEE_TYPE_OPTIONS: { label: string; value: FeeType }[] = [
  { label: 'Monthly', value: FeeType.MONTHLY },
  { label: 'One-Time', value: FeeType.ONE_TIME },
];

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  [FeeType.MONTHLY]: 'Monthly',
  [FeeType.ONE_TIME]: 'One-Time',
};

/**
 * Dropdown options for a line item's product code. The editable product list drives the
 * options; a line item whose code was since removed from the list keeps showing its own code.
 */
export function productCodeOptions(productCodes: string[], current?: string): { label: string; value: string }[] {
  const codes = current && !productCodes.includes(current) ? [...productCodes, current] : productCodes;
  return codes.map(c => ({
    label: current === c && !productCodes.includes(c) ? `${c} (removed)` : c,
    value: c,
  }));
}

/** Product codes in the editable list plus any code still referenced by an order (list order first). */
export function allProductCodes(productCodes: string[], orders: Order[] | undefined): string[] {
  const seen = new Set(productCodes);
  const extra: string[] = [];
  for (const o of orders ?? []) {
    for (const p of o.products ?? []) {
      if (!seen.has(p.product_code)) { seen.add(p.product_code); extra.push(p.product_code); }
    }
  }
  return [...productCodes, ...extra];
}

export const getFeeType = (p: OrderProduct): FeeType => p.fee_type ?? FeeType.MONTHLY;

export const isOneTime = (p: OrderProduct): boolean => getFeeType(p) === FeeType.ONE_TIME;

export function resolveLineAmount(p: OrderProduct, pricing: ProductPricing): ResolvedLine {
  const feeType = getFeeType(p);
  if (p.amount !== null && p.amount !== undefined && !Number.isNaN(Number(p.amount))) {
    return { amount: Number(p.amount), isEstimated: false, isUnpriced: false, feeType };
  }
  const fallback = pricing[p.product_code];
  if (fallback !== null && fallback !== undefined && !Number.isNaN(Number(fallback))) {
    return { amount: Number(fallback), isEstimated: true, isUnpriced: false, feeType };
  }
  return { amount: 0, isEstimated: true, isUnpriced: true, feeType };
}

const emptySummary = (): OrderSummary => ({
  monthly: 0, oneTime: 0, total: 0, confirmedTotal: 0, estimatedTotal: 0,
  hasEstimated: false, hasUnpriced: false, hasOneTime: false, lineCount: 0,
});

export function summarizeProducts(products: OrderProduct[] | undefined, pricing: ProductPricing): OrderSummary {
  const sum = emptySummary();
  for (const p of products ?? []) {
    const line = resolveLineAmount(p, pricing);
    sum.lineCount += 1;
    sum.total += line.amount;
    if (line.feeType === FeeType.ONE_TIME) {
      sum.oneTime += line.amount;
      sum.hasOneTime = true;
    } else {
      sum.monthly += line.amount;
    }
    if (line.isEstimated) {
      sum.estimatedTotal += line.amount;
      sum.hasEstimated = true;
    } else {
      sum.confirmedTotal += line.amount;
    }
    if (line.isUnpriced) sum.hasUnpriced = true;
  }
  return sum;
}

export function summarizeOrders(orders: Order[] | undefined, pricing: ProductPricing): OrderSummary {
  const products: OrderProduct[] = [];
  for (const o of orders ?? []) {
    if (o.products) products.push(...o.products);
  }
  return summarizeProducts(products, pricing);
}

export function summarizeByProduct(orders: Order[] | undefined, pricing: ProductPricing): Map<string, ProductSalesEntry> {
  const map = new Map<string, ProductSalesEntry>();
  for (const o of orders ?? []) {
    for (const p of o.products ?? []) {
      const line = resolveLineAmount(p, pricing);
      const cur = map.get(p.product_code) ?? { count: 0, monthly: 0, oneTime: 0, total: 0, estimatedCount: 0 };
      cur.count += 1;
      cur.total += line.amount;
      if (line.feeType === FeeType.ONE_TIME) cur.oneTime += line.amount;
      else cur.monthly += line.amount;
      if (line.isEstimated) cur.estimatedCount += 1;
      map.set(p.product_code, cur);
    }
  }
  return map;
}

export const hasOneTimeLine = (orders: Order[] | undefined): boolean =>
  (orders ?? []).some(o => (o.products ?? []).some(p => isOneTime(p)));

export const hasUnpricedLine = (orders: Order[] | undefined): boolean =>
  (orders ?? []).some(o => (o.products ?? []).some(p => p.amount == null));

export const formatLineAmount = (line: ResolvedLine): string =>
  `$${line.amount.toLocaleString()}${line.isEstimated ? ` ${EST_MARKER}` : ''}`;

// ─── Active vs previous orders ────────────────────────────────────────────────
//
// A dealership may hold several DMT orders over time (e.g. an upgrade that
// re-orders the same products). Only ONE order is "active" at a time: the most
// recently received order dated on or before today. Every other order is
// "previous" and is excluded from revenue, badges and filters so products are
// never counted twice. If no order is dated on or before today (all
// future-dated), the most recent order overall is treated as active.

export interface OrderPartition {
  active: Order | null;
  previous: Order[];
}

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dateKey = (o: Order): string => (o.received_date || '').slice(0, 10);

export function partitionOrders(orders: Order[] | undefined, today: string = todayKey()): OrderPartition {
  const list = orders ?? [];
  if (list.length === 0) return { active: null, previous: [] };
  if (list.length === 1) return { active: list[0], previous: [] };

  // Most recent first; ties broken by array position (later entry wins)
  const byRecency = list
    .map((o, idx) => ({ o, idx, key: dateKey(o) }))
    .sort((a, b) => (a.key === b.key ? b.idx - a.idx : b.key.localeCompare(a.key)));

  const onOrBeforeToday = byRecency.filter(x => x.key && x.key <= today);
  const active = (onOrBeforeToday[0] ?? byRecency[0]).o;
  return { active, previous: list.filter(o => o !== active) };
}

export const getActiveOrder = (orders: Order[] | undefined, today?: string): Order | null =>
  partitionOrders(orders, today).active;

export const isActiveOrder = (order: Order, orders: Order[] | undefined, today?: string): boolean =>
  partitionOrders(orders, today).active === order;

/** Reduce a cross-dealership order list to one active order per dealership. */
export function getActiveOrders(orders: Order[] | undefined, today: string = todayKey()): Order[] {
  const byDealer = new Map<string, Order[]>();
  for (const o of orders ?? []) {
    const list = byDealer.get(o.dealership_id) ?? [];
    list.push(o);
    byDealer.set(o.dealership_id, list);
  }
  const result: Order[] = [];
  for (const list of byDealer.values()) {
    const active = partitionOrders(list, today).active;
    if (active) result.push(active);
  }
  return result;
}

/** Orders sorted most recent first (active order first when it is the most recent). */
export function sortOrdersByRecency(orders: Order[] | undefined): Order[] {
  return [...(orders ?? [])]
    .map((o, idx) => ({ o, idx, key: dateKey(o) }))
    .sort((a, b) => (a.key === b.key ? b.idx - a.idx : b.key.localeCompare(a.key)))
    .map(x => x.o);
}

/** The active order as a list (empty when there are no orders), for helpers that take order lists. */
export const activeOrderList = (orders: Order[] | undefined, today?: string): Order[] => {
  const active = getActiveOrder(orders, today);
  return active ? [active] : [];
};
