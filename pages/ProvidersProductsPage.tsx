
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Providers & Products</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage external providers and internal system products.</p>
        </div>
        <button 
          onClick={() => { setSelectedItemId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
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
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Items Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start by adding your external providers or internal products.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div 
              key={item.id} 
              onClick={() => handleRowClick(item.id)}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
               <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-base flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     <Package size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">{item.name}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${categoryColors[item.category]}`}>
                           {item.category}
                        </span>
                        {item.provider_type && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${typeColors[item.provider_type]}`}>
                                {item.provider_type}
                            </span>
                        )}
                     </div>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
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

               <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                     <Building2 size={14} className="text-slate-400" />
                     <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Dealers</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-none">{getLinkedCount(item)}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRowClick(item.id); }}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete item?')) remove(item.id); }}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
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
