
import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, Calendar, X } from 'lucide-react';
import { useDealerships, useOrders } from '../hooks';
import { DealershipStatus, ProductCode } from '../types';

const DashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  // Default: Cancelled is excluded
  const [excludedStatuses, setExcludedStatuses] = useState<DealershipStatus[]>([DealershipStatus.CANCELLED]);
  
  // Fetch all data
  const { dealerships } = useDealerships();
  const { orders } = useOrders();

  // Metrics Calculation
  const dashboardMetrics = useMemo(() => {
    // 1. Status Counts (Universe) - Used for the toggle buttons
    // This counts ALL dealerships in the DB regardless of filters, so the buttons show accurate "Total" counts available.
    const statusCounts = dealerships.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<DealershipStatus, number>);

    // 2. Filter Dealerships by Status (The "Active" set for the dashboard view)
    const activeDealerships = dealerships.filter(d => !excludedStatuses.includes(d.status));
    const activeDealershipIds = new Set(activeDealerships.map(d => d.id));

    // 3. Filter Orders (by Date AND by Active Dealerships)
    // We only count revenue/products from dealerships that are currently "visible" (not excluded).
    let filteredOrders = orders.filter(o => activeDealershipIds.has(o.dealership_id));

    if (dateRange.start) {
        filteredOrders = filteredOrders.filter(o => o.received_date >= dateRange.start);
    }
    if (dateRange.end) {
        filteredOrders = filteredOrders.filter(o => o.received_date <= dateRange.end);
    }

    // 4. Calculate Aggregate Metrics
    
    // Total Dealerships: Represents the "Portfolio Size" currently viewed.
    // We do NOT filter this by date, because "Total Dealerships" usually means "Current Active Accounts".
    const totalDealershipsCount = activeDealerships.length;
    
    // Revenue: Represents "Sales Volume" or "Booked Revenue" from the filtered orders.
    const totalRevenue = filteredOrders.reduce((sum, order) => {
        const orderTotal = order.products?.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) || 0;
        return sum + orderTotal;
    }, 0);

    // Product Breakdown: Counts number of products sold/active in the filtered orders.
    const productBreakdown = filteredOrders.reduce((acc, order) => {
        order.products?.forEach(p => {
             if (p.product_code) {
                 acc[p.product_code] = (acc[p.product_code] || 0) + 1;
             }
        });
        return acc;
    }, {} as Record<string, number>);

    return {
        statusCounts,
        totalDealershipsCount,
        totalRevenue,
        productBreakdown,
        isDateFiltered: !!(dateRange.start || dateRange.end)
    };
  }, [dealerships, orders, excludedStatuses, dateRange]);

  const toggleStatus = (statuses: DealershipStatus[]) => {
    setExcludedStatuses(prev => {
        const isAllExcluded = statuses.every(s => prev.includes(s));
        if (isAllExcluded) {
            // Include them (remove from excluded list)
            return prev.filter(s => !statuses.includes(s));
        } else {
            // Exclude them (add to excluded list, avoiding duplicates)
            const newExcluded = [...prev];
            statuses.forEach(s => {
                if (!newExcluded.includes(s)) newExcluded.push(s);
            });
            return newExcluded;
        }
    });
  };

  const isExcluded = (statuses: DealershipStatus[]) => statuses.every(s => excludedStatuses.includes(s));

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Status Groups for the UI Cards
  const statusGroups = [
    { 
        label: 'Live', 
        statuses: [DealershipStatus.LIVE, DealershipStatus.LEGACY], 
        color: 'text-emerald-600 dark:text-emerald-400', 
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-800' 
    },
    { 
        label: 'Onboarding', 
        statuses: [DealershipStatus.ONBOARDING], 
        color: 'text-indigo-600 dark:text-indigo-400', 
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-800'
    },
    { 
        label: 'Pending', 
        statuses: [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED], 
        color: 'text-slate-600 dark:text-slate-400', 
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-800'
    },
    { 
        label: 'Hold', 
        statuses: [DealershipStatus.HOLD], 
        color: 'text-orange-600 dark:text-orange-400', 
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-800'
    },
    { 
        label: 'Cancelled', 
        statuses: [DealershipStatus.CANCELLED], 
        color: 'text-red-600 dark:text-red-400', 
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-800'
    },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* Header & Filter */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Overview of dealership performance and order metrics.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mr-2 hidden md:block">
                Filters:
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-2 px-2 border-r border-slate-100 dark:border-slate-800">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Range</span>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="text-xs border-none outline-none bg-transparent text-slate-600 dark:text-slate-300 font-medium dark:color-scheme-dark"
                    />
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                    <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="text-xs border-none outline-none bg-transparent text-slate-600 dark:text-slate-300 font-medium dark:color-scheme-dark"
                    />
                </div>
                {(dateRange.start || dateRange.end) && (
                    <button 
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="ml-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                    <X size={12} /> Clear
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Main Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3 mb-3">
        {/* Total Card */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"><Building2 size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dealerships</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            {dashboardMetrics.totalDealershipsCount}
          </div>
        </div>

        {/* Revenue Card */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><DollarSign size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revenue Booked</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{formatCurrency(dashboardMetrics.totalRevenue)}</div>
        </div>

        {/* Interactive Status Cards */}
        {statusGroups.map((group) => {
            const excluded = isExcluded(group.statuses);
            // Sum up counts for statuses in this group
            const count = group.statuses.reduce((sum, s) => sum + (dashboardMetrics.statusCounts[s] || 0), 0);
            
            return (
                <button 
                    key={group.label}
                    onClick={() => toggleStatus(group.statuses)}
                    className={`col-span-1 p-3 rounded-xl border shadow-sm flex flex-col justify-center h-24 transition-all duration-200 text-left relative overflow-hidden group
                        ${group.bg} ${group.border}
                        ${excluded ? 'opacity-40 grayscale hover:opacity-60' : 'hover:-translate-y-1 hover:shadow-md ring-1 ring-transparent hover:ring-indigo-100 dark:hover:ring-indigo-900'}
                    `}
                >
                    <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{group.label}</span>
                        {excluded && <span className="text-[8px] font-bold text-red-400 uppercase bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">Excluded</span>}
                    </div>
                    <span className={`text-xl font-bold ${group.color}`}>
                        {count}
                    </span>
                    {!excluded && (
                        <div className={`absolute bottom-0 left-0 h-1 bg-current opacity-20 w-full ${group.color.replace('text-', 'bg-')}`}></div>
                    )}
                </button>
            );
        })}
      </div>

      {/* Product Metrics Section */}
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6">
        Product Breakdown 
        {dashboardMetrics.isDateFiltered && <span className="font-normal text-slate-300 dark:text-slate-600 ml-2">(In Date Range)</span>}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        {Object.values(ProductCode).map((code) => {
            const count = dashboardMetrics.productBreakdown[code] || 0;
            return (
              <div key={code} className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center transition-colors">
                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 break-words w-full">
                    {code.replace(/^\d+\s*-?\s*/, '')}
                  </span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{count}</span>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
