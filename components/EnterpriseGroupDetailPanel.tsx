
import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight, Edit3, Trash2, Save, RefreshCw } from 'lucide-react';
import { EnterpriseGroup, Dealership, DealershipStatus } from '../types';
import { useOrders } from '../hooks';

interface EnterpriseGroupDetailPanelProps {
  group: EnterpriseGroup;
  dealerships: Dealership[];
  onClose: () => void;
  onUpdate: (data: Partial<EnterpriseGroup>) => void;
  onDelete: () => void;
  onViewDealer: (id: string) => void;
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
  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">
    {children}
  </label>
);

const EnterpriseGroupDetailPanel: React.FC<EnterpriseGroupDetailPanelProps> = ({ 
  group, 
  dealerships, 
  onClose,
  onUpdate,
  onDelete,
  onViewDealer
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EnterpriseGroup>(group);
  
  // Fetch orders for revenue calculation and product count
  const { orders } = useOrders();

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

  const monthlyRevenue = useMemo(() => {
    const activeDealerIds = new Set(
      dealerships
        .filter(d => d.status === DealershipStatus.LIVE || d.status === DealershipStatus.LEGACY)
        .map(d => d.id)
    );
    return orders
      .filter(o => activeDealerIds.has(o.dealership_id))
      .reduce((sum, order) => {
        const orderTotal = order.products?.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) || 0;
        return sum + orderTotal;
      }, 0);
  }, [dealerships, orders]);

  const totalProductsCount = useMemo(() => {
    const groupDealerIds = new Set(dealerships.map(d => d.id));
    return orders
      .filter(o => groupDealerIds.has(o.dealership_id))
      .reduce((total, order) => total + (order.products?.length || 0), 0);
  }, [dealerships, orders]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-colors">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 sticky top-0 z-30 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
                GROUP HIERARCHY
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter">GRP_{group.id.slice(0, 8).toUpperCase()}</span>
            </div>
            {isEditing ? (
               <input 
                 value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none w-full border-b border-indigo-200 dark:border-indigo-800 outline-none focus:border-indigo-500 bg-transparent pb-1"
                 placeholder="Group Name"
               />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{group.name}</h2>
            )}
          </div>
          <div className="flex gap-2 ml-6">
            {isEditing ? (
              <>
                 <button 
                  onClick={handleSave}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
                  title="Save Changes"
                >
                  <Save size={16} /> <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Save</span>
                </button>
                <button 
                  onClick={handleCancel}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title="Cancel Editing"
                >
                  <RefreshCw size={16} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Edit Group"
              >
                <Edit3 size={20} />
              </button>
            )}
            {!isEditing && (
              <>
                <button 
                  onClick={onDelete} 
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all" 
                  title="Delete Group"
                >
                  <Trash2 size={20} />
                </button>
                <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900 custom-scrollbar transition-colors">
          <div className="animate-in fade-in duration-500 space-y-8">
            
            {/* IDs Section */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label>PP Sys ID</Label>
                  {isEditing ? (
                     <input 
                       value={formData.pp_sys_id || ''} 
                       onChange={(e) => setFormData({...formData, pp_sys_id: e.target.value})}
                       className="w-full px-2 py-1 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal font-mono"
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
                       className="w-full px-2 py-1 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal font-mono"
                       placeholder="ERA-###"
                     />
                  ) : (
                     <div className="text-base font-medium text-slate-800 dark:text-slate-200 font-mono">{group.era_system_id || '---'}</div>
                  )}
               </div>
            </div>

            {/* Stats Compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <Label>Dealerships</Label>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{dealerships.length}</div>
              </div>
              <div>
                <Label>Asset Inventory</Label>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{totalProductsCount}</div>
              </div>
              <div>
                <Label>Portfolio Health</Label>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                  {dealerships.length > 0 
                    ? `${Math.round((dealerships.filter(d => d.status === DealershipStatus.LIVE || d.status === DealershipStatus.LEGACY).length / dealerships.length) * 100)}%` 
                    : '0%'}
                </div>
              </div>
              <div>
                <Label>Monthly Revenue</Label>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(monthlyRevenue)}</div>
              </div>
            </div>

            {/* Entities List */}
            <div>
              <Label>Associated Dealerships</Label>
              <div className="mt-2">
                {dealerships.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-dashed rounded-xl">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-[0.1em]">No dealerships assigned</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dealerships.map((dealer) => {
                      const dealerOrders = orders.filter(o => o.dealership_id === dealer.id);
                      const hasProducts = dealerOrders.some(o => o.products && o.products.length > 0);

                      return (
                      <div 
                        key={dealer.id} 
                        className="flex flex-col p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() => onViewDealer(dealer.id)}
                      >
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{dealer.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{dealer.cif_number || 'NO CIF'}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tighter">
                                    {dealer.store_number || '--'} / {dealer.branch_number || '--'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md border ${statusColors[dealer.status]}`}>
                                    {dealer.status}
                                </span>
                                <ArrowRight size={16} className="text-slate-200 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>

                        {hasProducts && (
                            <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                                <div className="space-y-1.5">
                                    {dealerOrders.map(order => (
                                        order.products?.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-[10px]">
                                                <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-indigo-300 dark:bg-indigo-600"></span>
                                                    {p.product_code}
                                                </span>
                                                <span className="font-mono text-slate-400 dark:text-slate-500">${Number(p.amount).toLocaleString()}</span>
                                            </div>
                                        ))
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
