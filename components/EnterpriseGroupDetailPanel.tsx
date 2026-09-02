
import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight, Edit3, Trash2, Save, RefreshCw, ArrowLeft } from 'lucide-react';
import { EnterpriseGroup, Dealership, DealershipStatus } from '../types';
import { useOrders, useProductPricing } from '../hooks';
import { summarizeOrders, resolveLineAmount, formatLineAmount, isOneTime, getActiveOrders, partitionOrders } from '../lib/orderPricing';

interface EnterpriseGroupDetailPanelProps {
  group: EnterpriseGroup;
  dealerships: Dealership[];
  onClose: () => void;
  onUpdate: (data: Partial<EnterpriseGroup>) => void;
  onDelete: () => void;
  onViewDealer: (id: string) => void;
  onBack?: () => void;
}

const statusColors: Record<DealershipStatus, string> = {
  [DealershipStatus.DMT_PENDING]: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  [DealershipStatus.DMT_APPROVED]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [DealershipStatus.HOLD]: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [DealershipStatus.ONBOARDING]: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  [DealershipStatus.LIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  [DealershipStatus.LEGACY]: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  [DealershipStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 block">
    {children}
  </label>
);

const EnterpriseGroupDetailPanel: React.FC<EnterpriseGroupDetailPanelProps> = ({ 
  group, 
  dealerships, 
  onClose,
  onUpdate,
  onDelete,
  onViewDealer,
  onBack
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EnterpriseGroup>(group);
  
  // Fetch orders for revenue calculation and product count
  const { orders } = useOrders();
  const { pricing } = useProductPricing();

  useEffect(() => {
    setFormData(group);
  }, [group]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(group);
    setIsEditing(false);
  };

  // Filter out CANCELLED dealerships for calculations
  const activeDealerships = useMemo(() => {
    return dealerships.filter(d => d.status !== DealershipStatus.CANCELLED);
  }, [dealerships]);

  // Only each dealership's ACTIVE DMT order (most recent on or before today)
  // counts; previous orders are excluded so products are never double counted.
  const activeOrders = useMemo(() => getActiveOrders(orders), [orders]);

  // Revenue from Live/Legacy dealerships only, split into monthly recurring vs one-time fees.
  // Unpriced line items fall back to the product default price and are flagged as estimated.
  const revenue = useMemo(() => {
    const revenueDealerIds = new Set(
      dealerships
        .filter(d => d.status === DealershipStatus.LIVE || d.status === DealershipStatus.LEGACY)
        .map(d => d.id)
    );
    return summarizeOrders(activeOrders.filter(o => revenueDealerIds.has(o.dealership_id)), pricing);
  }, [dealerships, activeOrders, pricing]);

  const totalProductsCount = useMemo(() => {
    // Only count products from non-cancelled dealerships (active order only)
    const groupDealerIds = new Set(activeDealerships.map(d => d.id));
    return activeOrders
      .filter(o => groupDealerIds.has(o.dealership_id))
      .reduce((total, order) => total + (order.products?.length || 0), 0);
  }, [activeDealerships, activeOrders]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={isEditing ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl h-full flex flex-col animate-in slide-in-from-right duration-300 rounded-l-2xl transition-colors">
        {/* Grabber pill */}
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-9 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="sticky top-0 z-30 px-4 py-3 border-b border-slate-200/60 dark:border-[#38383A] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            {onBack && (
               <button 
                onClick={onBack}
                className="p-2 -ml-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 leading-none mb-1">Group Detail</span>
              {isEditing ? (
                <input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 bg-slate-100/50 dark:bg-[#2C2C2E] border border-slate-200/60 dark:border-[#38383A] rounded-xl px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 min-w-[200px]"
                  placeholder="Group name"
                />
              ) : (
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{group.name}</h2>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Save size={14} /> Save
                </button>
                <button 
                  onClick={handleCancel}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                  title="Cancel"
                >
                  <RefreshCw size={16} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-[#38383A] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-sm font-semibold flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
              >
                <Edit3 size={14} /> Edit
              </button>
            )}
            {!isEditing && (
              <>
                <button 
                  onClick={onDelete} 
                  className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" 
                  title="Delete Group"
                >
                  <Trash2 size={18} />
                </button>
                <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none">
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white/95 dark:bg-[#1C1C1E]/95 custom-scrollbar transition-colors">
          <div className="animate-in fade-in duration-500 space-y-8">
            
            {/* IDs Section */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label>PP Sys ID</Label>
                  {isEditing ? (
                     <input 
                       value={formData.pp_sys_id || ''} 
                       onChange={(e) => setFormData({...formData, pp_sys_id: e.target.value})}
                       className="w-full px-2 py-1 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-xl focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal font-mono focus-visible:ring-2 focus-visible:ring-blue-500/50"
                       placeholder="PP-###"
                     />
                  ) : (
                     <div className="text-base font-medium text-slate-800 dark:text-slate-200 font-mono">{group.pp_sys_id || '---'}</div>
                  )}
               </div>
               <div>
                  <Label>ERA ID</Label>
                  {isEditing ? (
                     <input 
                       value={formData.era_system_id || ''} 
                       onChange={(e) => setFormData({...formData, era_system_id: e.target.value})}
                       className="w-full px-2 py-1 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-xl focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal font-mono focus-visible:ring-2 focus-visible:ring-blue-500/50"
                       placeholder="ERA-###"
                     />
                  ) : (
                     <div className="text-base font-medium text-slate-800 dark:text-slate-200 font-mono">{group.era_system_id || '---'}</div>
                  )}
               </div>
            </div>

            {/* Stats Compact */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-100/60 dark:border-[#38383A]">
              <div>
                <Label>Dealerships</Label>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{activeDealerships.length}</div>
              </div>
              <div>
                <Label>Asset Inventory</Label>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{totalProductsCount}</div>
              </div>
              <div>
                <Label>Portfolio Health</Label>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                  {activeDealerships.length > 0 
                    ? `${Math.round((activeDealerships.filter(d => d.status === DealershipStatus.LIVE || d.status === DealershipStatus.LEGACY).length / activeDealerships.length) * 100)}%` 
                    : '0%'}
                </div>
              </div>
              <div>
                <Label>Monthly Revenue</Label>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
                  {formatCurrency(revenue.monthly)}
                  {revenue.hasEstimated && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" title="Includes estimated default pricing for unpriced line items">est.</span>
                  )}
                </div>
              </div>
              <div>
                <Label>One-Time Fees</Label>
                <div className="text-xl font-bold text-violet-600 dark:text-violet-400 tracking-tight">{formatCurrency(revenue.oneTime)}</div>
              </div>
            </div>

            {/* Entities List */}
            <div>
              <Label>Associated Dealerships</Label>
              <div className="mt-2">
                {dealerships.length === 0 ? (
                  <div className="text-center py-10 bg-white/95 dark:bg-[#1C1C1E]/95 border border-slate-100/60 dark:border-[#38383A] border-dashed rounded-xl">
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">No dealerships assigned</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dealerships.map((dealer) => {
                      const { active: activeOrder, previous: previousOrders } = partitionOrders(orders.filter(o => o.dealership_id === dealer.id));
                      const dealerOrders = activeOrder ? [activeOrder] : [];
                      const hasProducts = dealerOrders.some(o => o.products && o.products.length > 0);
                      const previousCount = previousOrders.length;

                      return (
                      <div 
                        key={dealer.id} 
                        className={`flex flex-col p-4 bg-white/95 dark:bg-[#1C1C1E]/95 border rounded-xl hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all cursor-pointer group ${dealer.status === DealershipStatus.CANCELLED ? 'border-red-100 dark:border-red-900/30 opacity-70 grayscale-[0.5]' : 'border-slate-100/60 dark:border-[#38383A]'}`}
                        onClick={() => onViewDealer(dealer.id)}
                      >
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className={`text-sm font-bold truncate tracking-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 ${dealer.status === DealershipStatus.CANCELLED ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {dealer.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{dealer.cif_number || 'NO CIF'}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-tighter">
                                    {dealer.store_number || '--'} / {dealer.branch_number || '--'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-widest rounded-md border ${statusColors[dealer.status]}`}>
                                    {dealer.status}
                                </span>
                                <ArrowRight size={16} className="text-slate-200 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                        </div>

                        {(hasProducts || previousCount > 0) && (
                            <div className="mt-3 pt-3 border-t border-slate-100/60 dark:border-[#38383A]">
                                {previousCount > 0 && (
                                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                                        <span className="font-bold uppercase tracking-wide">Active DMT Order{activeOrder?.order_number ? ` · ${activeOrder.order_number}` : ''}</span>
                                        <span>{previousCount} previous order{previousCount === 1 ? '' : 's'} not counted</span>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    {dealerOrders.map(order => (
                                        order.products?.map(p => {
                                            const line = resolveLineAmount(p, pricing);
                                            return (
                                            <div key={p.id} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                                    <span className={`w-1 h-1 rounded-full ${isOneTime(p) ? 'bg-violet-300 dark:bg-violet-600' : 'bg-blue-300 dark:bg-blue-600'}`}></span>
                                                    {p.product_code}
                                                    {isOneTime(p) && (
                                                        <span className="px-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800">One-Time</span>
                                                    )}
                                                </span>
                                                <span
                                                    className={`font-mono ${line.isEstimated ? 'text-amber-600 dark:text-amber-400 italic' : 'text-slate-400 dark:text-slate-500'}`}
                                                    title={line.isEstimated ? 'Estimated from the product default price' : undefined}
                                                >
                                                    {formatLineAmount(line)}
                                                </span>
                                            </div>
                                            );
                                        })
                                    ))}
                                </div>
                            </div>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseGroupDetailPanel;
