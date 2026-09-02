import { FeeType, Order, OrderProduct, ProductCode, ProductPricing } from '../types';

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

export function summarizeByProduct(orders: Order[] | undefined, pricing: ProductPricing): Map<ProductCode, ProductSalesEntry> {
  const map = new Map<ProductCode, ProductSalesEntry>();
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
