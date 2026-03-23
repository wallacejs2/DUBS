
import React, { useState, useMemo } from 'react';
import { Plus, Package, Mail, Phone, Hash, Building2, Trash2, Edit3, Globe } from 'lucide-react';
import { useProvidersProducts, useDealerships, useOrders } from '../hooks';
import { ProviderProduct, ProviderProductCategory, ProviderType, DealershipStatus } from '../types';
import FilterBar from '../components/FilterBar';
import ProviderProductDetailPanel from '../components/ProviderProductDetailPanel';

const ProvidersProductsPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', category: '', provider_type: '' });
  const { items, loading, upsert, remove } = useProvidersProducts(filters);
  const { dealerships, getDetails } = useDealerships();
  const { orders } = useOrders();

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
