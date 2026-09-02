
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Package, Mail, Building2, Trash2, Edit3, Globe, DollarSign, Check, X } from 'lucide-react';
import { useProvidersProducts, useDealerships, useOrders, useProductPricing } from '../hooks';
import { ProviderProduct, ProviderProductCategory, ProviderType, DealershipStatus, ProductPricing } from '../types';
import { getActiveOrders } from '../lib/orderPricing';
import FilterBar from '../components/FilterBar';
import ProviderProductDetailPanel from '../components/ProviderProductDetailPanel';

// Editable table of default (fallback) prices per DMT product code.
// A default is used as an *estimated* price wherever an order line item has no amount.
// Products can be added to or removed from the list here; the list drives the product
// dropdown on DMT order line items and the product columns in CSV exports.
const DefaultPricingPanel: React.FC<{
  productCodes: string[];
  pricing: ProductPricing;
  setPrice: (code: string, amount: number | null) => void;
  addProductCode: (code: string, defaultPrice?: number | null) => boolean;
  removeProductCode: (code: string) => void;
  unpricedCounts: Map<string, number>;
  usageCounts: Map<string, number>;
}> = ({ productCodes, pricing, setPrice, addProductCode, removeProductCode, unpricedCounts, usageCounts }) => {
  const toDraft = (codes: string[], p: ProductPricing) => {
    const d: Record<string, string> = {};
    for (const code of codes) {
      const v = p[code];
      d[code] = v === null || v === undefined ? '' : String(v);
    }
    return d;
  };
  const [draft, setDraft] = useState<Record<string, string>>(() => toDraft(productCodes, pricing));
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => { setDraft(toDraft(productCodes, pricing)); }, [productCodes, pricing]);

  const commit = (code: string) => {
    const raw = (draft[code] ?? '').trim();
    if (raw === '') {
      if (pricing[code] !== null && pricing[code] !== undefined) setPrice(code, null);
      return;
    }
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed < 0) {
      setDraft(prev => ({ ...prev, [code]: toDraft(productCodes, pricing)[code] }));
      return;
    }
    if (pricing[code] !== parsed) setPrice(code, parsed);
  };

  const resetAddForm = () => {
    setNewCode('');
    setNewPrice('');
    setAddError(null);
    setIsAdding(false);
  };

  const handleAdd = () => {
    const code = newCode.trim();
    if (!code) {
      setAddError('Enter a product code or name.');
      return;
    }
    if (productCodes.some(c => c.toLowerCase() === code.toLowerCase())) {
      setAddError('That product already exists.');
      return;
    }
    let price: number | null = null;
    if (newPrice.trim() !== '') {
      const parsed = parseFloat(newPrice);
      if (Number.isNaN(parsed) || parsed < 0) {
        setAddError('Default price must be a positive number or left blank.');
        return;
      }
      price = parsed;
    }
    if (!addProductCode(code, price)) {
      setAddError('That product could not be added.');
      return;
    }
    resetAddForm();
  };

  const handleRemove = (code: string) => {
    const inUse = usageCounts.get(code) ?? 0;
    const message = inUse > 0
      ? `Remove "${code}" from the product list?\n\nIt is used on ${inUse} order line item${inUse === 1 ? '' : 's'}. Those line items will keep the code, but it will no longer be selectable for new line items and its default price will be cleared.`
      : `Remove "${code}" from the product list? Its default price will be cleared.`;
    if (window.confirm(message)) removeProductCode(code);
  };

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] border border-slate-200/60 dark:border-[#38383A] p-4 mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <DollarSign size={15} className="text-emerald-500" /> Default Product Pricing
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Used as an estimated price when a DMT order line item has no amount. Estimated values are marked "est." throughout the app. Leave blank for no default. Products listed here are the options available on DMT order line items.
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
          >
            <Plus size={14} /> Add Product
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-2 items-end">
            <div>
              <label htmlFor="new-product-code" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Product code / name</label>
              <input
                id="new-product-code"
                type="text"
                autoFocus
                value={newCode}
                onChange={(e) => { setNewCode(e.target.value); setAddError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') resetAddForm(); }}
                placeholder="e.g. 15400 - New Product"
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-xl focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label htmlFor="new-product-price" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Default price (optional)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">$</span>
                <input
                  id="new-product-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => { setNewPrice(e.target.value); setAddError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') resetAddForm(); }}
                  placeholder="Not set"
                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-xl focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-sans"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
              >
                <Check size={14} /> Add
              </button>
              <button
                type="button"
                onClick={resetAddForm}
                aria-label="Cancel adding product"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          {addError && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{addError}</p>}
        </div>
      )}

      {productCodes.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">No products yet. Add a product to make it available on DMT order line items.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {productCodes.map(code => {
            const unpriced = unpricedCounts.get(code) ?? 0;
            const inUse = usageCounts.get(code) ?? 0;
            const hasDefault = pricing[code] !== null && pricing[code] !== undefined;
            return (
              <div key={code} className="group/card p-3 rounded-xl bg-slate-50/80 dark:bg-[#1C1C1E] border border-slate-100/60 dark:border-[#38383A]">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <label htmlFor={`default-price-${code}`} className="block text-xs font-semibold text-slate-500 dark:text-slate-400 truncate" title={code}>{code}</label>
                  <button
                    type="button"
                    onClick={() => handleRemove(code)}
                    aria-label={`Remove product ${code}`}
                    title={inUse > 0 ? `Remove product (used on ${inUse} line item${inUse === 1 ? '' : 's'})` : 'Remove product'}
                    className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">$</span>
                  <input
                    id={`default-price-${code}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft[code] ?? ''}
                    onChange={(e) => setDraft(prev => ({ ...prev, [code]: e.target.value }))}
                    onBlur={() => commit(code)}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder="Not set"
                    aria-label={`Default price for ${code}`}
                    className="w-full pl-6 pr-2 py-1.5 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-xl focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-sans"
                  />
                </div>
                <div className={`mt-1 text-[11px] ${unpriced > 0 ? (hasDefault ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400') : 'text-slate-400 dark:text-slate-500'}`}>
                  {unpriced === 0
                    ? 'No unpriced line items'
                    : `${unpriced} unpriced line item${unpriced === 1 ? '' : 's'} ${hasDefault ? 'using this default' : '(no default → $0)'}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ProvidersProductsPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', category: '', provider_type: '' });
  const { items, loading, upsert, remove } = useProvidersProducts(filters);
  const { dealerships, getDetails } = useDealerships();
  const { orders } = useOrders();
  const { pricing, productCodes, setPrice, addProductCode, removeProductCode } = useProductPricing();

  // Count line items with no amount per product code, across each dealership's
  // ACTIVE DMT order only (previous orders do not affect any totals)
  const unpricedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of getActiveOrders(orders)) {
      for (const p of o.products ?? []) {
        if (p.amount == null) counts.set(p.product_code, (counts.get(p.product_code) ?? 0) + 1);
      }
    }
    return counts;
  }, [orders]);

  // Count every line item (active AND previous orders) per product code, so removing a
  // product can warn about any historical usage
  const usageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) {
      for (const p of o.products ?? []) {
        counts.set(p.product_code, (counts.get(p.product_code) ?? 0) + 1);
      }
    }
    return counts;
  }, [orders]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Helper to count linked dealerships for a provider or product, excluding cancelled
  const getLinkedCount = (item: ProviderProduct) => {
    if (!item.name) return 0;

    if (item.category === ProviderProductCategory.PROVIDER) {
        return dealerships.filter(d => {
            if (d.status === DealershipStatus.CANCELLED) return false;

            if (item.provider_type === ProviderType.CRM) return d.crm_provider === item.name;
            if (item.provider_type === ProviderType.WEBSITE) return d.website_provider === item.name;
            if (item.provider_type === ProviderType.INVENTORY) return d.inventory_provider === item.name;
            return d.crm_provider === item.name || d.website_provider === item.name || d.inventory_provider === item.name;
        }).length;
    } else {
        // Product matching: check BOTH selected internal products AND orders
        return dealerships.filter(d => {
            if (d.status === DealershipStatus.CANCELLED) return false;

            const isSelectedInDetails = d.products?.includes(item.name);
            const isPresentInOrders = orders.some(o =>
                o.dealership_id === d.id &&
                o.products?.some(p => p.product_code === item.name)
            );
            return isSelectedInDetails || isPresentInOrders;
        }).length;
    }
  };

  const activeItem = useMemo(() => {
    if (isCreating) {
      return {
        name: '',
        category: ProviderProductCategory.PROVIDER,
        provider_type: ProviderType.CRM,
        support_email: '',
        support_phone: '',
        support_link: '',
        created_at: new Date().toISOString()
      } as Partial<ProviderProduct>;
    }
    if (selectedItemId) {
      return items.find(i => i.id === selectedItemId);
    }
    return null;
  }, [isCreating, selectedItemId, items]);

  const categoryColors: Record<ProviderProductCategory, string> = {
    [ProviderProductCategory.PROVIDER]: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    [ProviderProductCategory.PRODUCT]: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  };

  const typeColors: Record<string, string> = {
    [ProviderType.CRM]: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    [ProviderType.WEBSITE]: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    [ProviderType.INVENTORY]: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  };

  const handleRowClick = (id: string) => {
    setSelectedItemId(id);
    setIsCreating(false);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => { setSelectedItemId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
        >
          <Plus size={16} /> New Provider/Product
        </button>
      </div>

      <DefaultPricingPanel
        productCodes={productCodes}
        pricing={pricing}
        setPrice={setPrice}
        addProductCode={addProductCode}
        removeProductCode={removeProductCode}
        unpricedCounts={unpricedCounts}
        usageCounts={usageCounts}
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({...filters, search: v})}
        searchPlaceholder="Search by name, notes..."
        filters={[
          {
            label: 'Category',
            value: filters.category,
            onChange: (v) => setFilters({...filters, category: v, provider_type: ''}),
            options: Object.values(ProviderProductCategory).map(c => ({ label: c, value: c }))
          },
          ...(filters.category === ProviderProductCategory.PROVIDER ? [{
            label: 'Provider Type',
            value: filters.provider_type,
            onChange: (v) => setFilters({...filters, provider_type: v}),
            options: Object.values(ProviderType).map(t => ({ label: t, value: t }))
          }] : [])
        ]}
      />

      {loading ? (
        <div className="rounded-2xl overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="h-16 ios-shimmer"></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Package size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Items Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start by adding your external providers or internal products.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A]">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => handleRowClick(item.id)}
              className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
            >
               <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-base flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                     <Package size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">{item.name}</h3>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${categoryColors[item.category]}`}>
                           {item.category}
                        </span>
                        {item.provider_type && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${typeColors[item.provider_type]}`}>
                                {item.provider_type}
                            </span>
                        )}
                     </div>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.support_email && (
                           <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-400" />
                              <span className="truncate">{item.support_email}</span>
                           </div>
                        )}
                        {item.support_link && (
                           <div className="flex items-center gap-1.5">
                              <Globe size={12} className="text-slate-400" />
                              <span className="truncate">{item.support_link.replace(/^https?:\/\//, '')}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100/60 dark:border-[#38383A]">
                     <Building2 size={14} className="text-slate-400" />
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase leading-none">Dealers</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-none">{getLinkedCount(item)}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRowClick(item.id); }}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete item?')) remove(item.id); }}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {activeItem && (
        <ProviderProductDetailPanel
          item={activeItem}
          onClose={() => { setSelectedItemId(null); setIsCreating(false); }}
          onUpdate={(data) => upsert(data)}
          onDelete={() => {
            if (activeItem.id && window.confirm('Are you sure you want to delete this?')) {
              remove(activeItem.id);
              setSelectedItemId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProvidersProductsPage;
