
import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, Calendar, Filter, X } from 'lucide-react';
import { useDealerships, useOrders } from '../hooks';
import { DealershipStatus, ProductCode } from '../types';

const DashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Fetch all data
  const { dealerships } = useDealerships();
  const { orders } = useOrders();

  // Filter Logic
  const filteredData = useMemo(() => {
    let filteredOrders = orders;

    // 1. Filter Orders by Date
    if (dateRange.start) {
      filteredOrders = filteredOrders.filter(o => o.received_date >= dateRange.start);
    }
    if (dateRange.end) {
      filteredOrders = filteredOrders.filter(o => o.received_date <= dateRange.end);
    }

    // 2. Identify Dealerships involved in these orders
    // If no dates are selected, we show all dealerships.
    // If dates ARE selected, we only show dealerships that have orders in that range.
    let relevantDealerships = dealerships;
    
    if (dateRange.start || dateRange.end) {
      const activeDealerIds = new Set(filteredOrders.map(o => o.dealership_id));
      relevantDealerships = dealerships.filter(d => activeDealerIds.has(d.id));
    }

    return { 
      orders: filteredOrders, 
      dealerships: relevantDealerships,
      isFiltered: !!(dateRange.start || dateRange.end)
    };
  }, [orders, dealerships, dateRange]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const { orders: activeOrders, dealerships: activeDealerships } = filteredData;

    // 1. Total Dealerships in Scope
    const total = activeDealerships.length;

    // 2. Status Counts (of the dealerships in scope)
    const counts = activeDealerships.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<DealershipStatus, number>);

    // 3. Revenue
    // Calculate sum of products in the *filtered orders*.
    const revenue = activeOrders.reduce((sum, order) => {
       // Optional: Only count revenue if dealer is LIVE? 
       // For a "Sales/Order" dashboard view restricted by date, usually we want total order value booked in that period.
       const orderTotal = order.products?.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) || 0;
       return sum + orderTotal;
    }, 0);

    // 4. Product Counts (from filtered orders)
    const productCounts = activeOrders.reduce((acc, order) => {
        order.products?.forEach(p => {
            if (p.product_code) {
                acc[p.product_code] = (acc[p.product_code] || 0) + 1;
            }
        });
        return acc;
    }, {} as Record<string, number>);

    return { total, counts, revenue, productCounts };
  }, [filteredData]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Overview of dealership performance and order metrics.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 px-2 border-r border-slate-100">
             <Calendar size={16} className="text-slate-400" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Date Range</span>
           </div>
           <div className="flex items-center gap-2">
             <input 
               type="date" 
               value={dateRange.start} 
               onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
               className="text-xs border-none outline-none bg-transparent text-slate-600 font-medium"
             />
             <span className="text-slate-300">-</span>
             <input 
               type="date" 
               value={dateRange.end} 
               onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
               className="text-xs border-none outline-none bg-transparent text-slate-600 font-medium"
             />
           </div>
           {(dateRange.start || dateRange.end) && (
             <button 
               onClick={() => setDateRange({ start: '', end: '' })}
               className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
             >
               <X size={14} />
             </button>
           )}
        </div>
      </div>

      {/* Main Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3 mb-3">
        {/* Total Card */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Building2 size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dealerships</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">
            {metrics.total}
            {filteredData.isFiltered && <span className="text-xs font-normal text-slate-400 ml-2">in range</span>}
          </div>
        </div>

        {/* Revenue Card */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Booked</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{formatCurrency(metrics.revenue)}</div>
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
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6">Product Breakdown</h3>
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
    </div>
  );
};

export default DashboardPage;
