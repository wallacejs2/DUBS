
import React, { useState, useMemo } from 'react';
import { Plus, FileSpreadsheet, DollarSign, Building2, TrendingUp, Users, AlertCircle, Package } from 'lucide-react';
import { useDealerships, useEnterpriseGroups, useOrders } from '../hooks';
import { DealershipWithRelations, DealershipStatus, ProductCode } from '../types';
import DealershipCard from '../components/DealershipCard';
import DealershipForm from '../components/DealershipForm';
import DealershipDetailPanel from '../components/DealershipDetailPanel';
import FilterBar from '../components/FilterBar';

const DealershipsPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', status: '', group: '' });
  
  // Data for List (Filtered)
  const { dealerships, loading, upsert, remove, getDetails } = useDealerships(filters);
  
  // Data for Metrics (All)
  const { dealerships: allDealerships } = useDealerships(); 
  const { groups } = useEnterpriseGroups();
  const { orders } = useOrders();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [editingDealer, setEditingDealer] = useState<DealershipWithRelations | null>(null);

  const selectedDealerDetails = selectedDealerId ? getDetails(selectedDealerId) : null;

  // --- Metrics Calculation ---
  const metrics = useMemo(() => {
    const total = allDealerships.length;
    
    const counts = allDealerships.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<DealershipStatus, number>);

    // Calculate Revenue for Live Dealerships
    const liveDealerIds = new Set(allDealerships.filter(d => d.status === DealershipStatus.LIVE).map(d => d.id));
    const monthlyRevenue = orders
      .filter(o => liveDealerIds.has(o.dealership_id))
      .reduce((sum, order) => {
        const orderTotal = order.products?.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) || 0;
        return sum + orderTotal;
      }, 0);

    // Calculate Product Counts for Non-Cancelled Dealerships
    const activeDealerIds = new Set(allDealerships.filter(d => d.status !== DealershipStatus.CANCELLED).map(d => d.id));
    const productCounts = orders
        .filter(o => activeDealerIds.has(o.dealership_id))
        .reduce((acc, order) => {
            order.products?.forEach(p => {
                if (p.product_code) {
                    acc[p.product_code] = (acc[p.product_code] || 0) + 1;
                }
            });
            return acc;
        }, {} as Record<string, number>);

    return { total, counts, monthlyRevenue, productCounts };
  }, [allDealerships, orders]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const handleCreate = (data: Partial<DealershipWithRelations>) => {
    upsert(data);
    setIsFormOpen(false);
    setEditingDealer(null);
  };

  const handleDelete = () => {
    if (selectedDealerId && window.confirm('Are you sure you want to delete this dealership? This will also remove all related orders and data.')) {
      remove(selectedDealerId);
      setSelectedDealerId(null);
    }
  };

  const checkIsManaged = (dealerId: string) => {
    return orders.some(o => 
      o.dealership_id === dealerId && 
      o.products.some(p => p.product_code === ProductCode.P15392_MANAGED)
    );
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dealerships</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track your curator dealership network.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-[11px] hover:bg-slate-50 shadow-sm transition-all">
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button 
            onClick={() => { setEditingDealer(null); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} /> New Dealership
          </button>
        </div>
      </div>

      {/* Main Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3 mb-3">
        {/* Total Card */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Building2 size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dealerships</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{metrics.total}</div>
        </div>

        {/* Revenue Card */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue (Live)</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{formatCurrency(metrics.monthlyRevenue)}</div>
        </div>

        {/* Status Counts */}
        <div className="col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-24">
             <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Live</span>
             <span className="text-xl font-bold text-emerald-600">{metrics.counts[DealershipStatus.LIVE] || 0}</span>
        </div>
        <div className="col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-24">
             <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Onboarding</span>
             <span className="text-xl font-bold text-indigo-600">{metrics.counts[DealershipStatus.ONBOARDING] || 0}</span>
        </div>
        <div className="col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-24">
             <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Pending</span>
             <span className="text-xl font-bold text-slate-600">{(metrics.counts[DealershipStatus.DMT_PENDING] || 0) + (metrics.counts[DealershipStatus.DMT_APPROVED] || 0)}</span>
        </div>
        <div className="col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-24">
             <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Hold</span>
             <span className="text-xl font-bold text-orange-600">{metrics.counts[DealershipStatus.HOLD] || 0}</span>
        </div>
        <div className="col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-24">
             <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cancelled</span>
             <span className="text-xl font-bold text-red-600">{metrics.counts[DealershipStatus.CANCELLED] || 0}</span>
        </div>
      </div>

      {/* Product Metrics Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        {Object.values(ProductCode).map((code) => (
            <div key={code} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1 break-words w-full">
                  {code.replace(/^\d+\s*-?\s*/, '')}
                </span>
                <span className="text-lg font-bold text-slate-700">{metrics.productCounts[code] || 0}</span>
            </div>
        ))}
      </div>

      <FilterBar 
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({ ...filters, search: v })}
        filters={[
          { 
            label: 'Status', 
            value: filters.status, 
            onChange: (v) => setFilters({ ...filters, status: v }),
            options: Object.values(DealershipStatus).map(s => ({ label: s, value: s }))
          },
          {
            label: 'Group',
            value: filters.group,
            onChange: (v) => setFilters({ ...filters, group: v }),
            options: groups.map(g => ({ label: g.name, value: g.id }))
          }
        ]}
        onClear={() => setFilters({ search: '', status: '', group: '' })}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl h-24 border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : dealerships.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Plus size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No dealerships found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Try adjusting your filters or create a new dealership to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dealerships.map(dealer => (
            <DealershipCard 
              key={dealer.id} 
              dealership={dealer} 
              groupName={groups.find(g => g.id === dealer.enterprise_group_id)?.name}
              isManaged={checkIsManaged(dealer.id)}
              onClick={() => setSelectedDealerId(dealer.id)}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <DealershipForm 
          groups={groups}
          initialData={editingDealer || undefined}
          onSubmit={handleCreate}
          onCancel={() => { setIsFormOpen(false); setEditingDealer(null); }}
        />
      )}

      {selectedDealerId && selectedDealerDetails && (
        <DealershipDetailPanel 
          dealership={selectedDealerDetails}
          groups={groups}
          onClose={() => setSelectedDealerId(null)}
          onUpdate={(data) => upsert(data)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default DealershipsPage;
