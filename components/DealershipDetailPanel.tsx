
import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, Edit3, Save, Info, Package, StickyNote, Plus, MapPin, Globe, CreditCard
} from 'lucide-react';
import { 
  DealershipWithRelations, OrderStatus, 
  ProductCode, DealershipStatus, EnterpriseGroup, CRMProvider
} from '../types';
import { useOrders } from '../hooks';

interface DealershipDetailPanelProps {
  dealership: DealershipWithRelations;
  groups: EnterpriseGroup[];
  onClose: () => void;
  onUpdate: (data: Partial<DealershipWithRelations>) => void;
  onDelete: () => void;
}

type Tab = 'overview' | 'orders' | 'notes';

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="mt-8 mb-4 flex items-center gap-2">
    <Icon size={14} className="text-slate-400" />
    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-1 flex-1">
      {title}
    </h3>
  </div>
);

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
    {children}
  </label>
);

const EditableInput = ({ 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  isEditing 
}: { 
  value?: any; 
  onChange?: any; 
  placeholder?: string; 
  type?: string; 
  isEditing: boolean 
}) => (
  isEditing ? (
    <input 
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-700"
    />
  ) : (
    <div className="w-full px-0 py-1.5 text-[12px] font-medium text-slate-900 truncate">
      {value || '---'}
    </div>
  )
);

const DealershipDetailPanel: React.FC<DealershipDetailPanelProps> = ({ 
  dealership, groups, onClose, onUpdate, onDelete 
}) => {
  const { orders, upsert: upsertOrder, remove: removeOrder } = useOrders(dealership.id);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<DealershipWithRelations>(dealership);

  useEffect(() => {
    setLocalData(dealership);
  }, [dealership]);

  const handleSave = () => {
    onUpdate(localData);
    setIsEditing(false);
  };

  const updateField = (field: keyof DealershipWithRelations, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const updateContact = (field: string, value: string) => {
    setLocalData(prev => ({
      ...prev,
      contacts: { ...prev.contacts!, [field]: value } as any
    }));
  };

  const updateReynolds = (value: string) => {
    setLocalData(prev => ({
      ...prev,
      reynolds_solution: { ...(prev.reynolds_solution || { id: '', dealership_id: dealership.id }), solution_details: value } as any
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-white">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-sm">
                SYSTEM ID: {dealership.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                dealership.status === DealershipStatus.LIVE ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
              }`}>
                {dealership.status}
              </span>
            </div>
            {isEditing ? (
              <input 
                value={localData.name}
                onChange={e => updateField('name', e.target.value)}
                className="text-2xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 w-full outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{dealership.name}</h2>
            )}
          </div>
          <div className="flex gap-2 ml-6">
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`p-2.5 rounded-xl transition-all ${isEditing ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
              title="Edit Details"
            >
              {isEditing ? <X size={20} /> : <Edit3 size={20} />}
            </button>
            {!isEditing && (
              <button onClick={onDelete} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Dealership">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 border-b border-slate-100 flex gap-8">
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'notes', label: 'Reynolds & Notes', icon: StickyNote },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`py-4 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${
                activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.id === 'orders' && <span className="ml-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[9px]">{orders.length}</span>}
            </button>
          ))}
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-white pb-32">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <Label>Contract Value (Annual)</Label>
                  {isEditing ? (
                    <input 
                      type="number"
                      value={localData.contract_value}
                      onChange={e => updateField('contract_value', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] outline-none"
                    />
                  ) : (
                    <div className="text-lg font-bold text-emerald-600 tracking-tight">
                      ${dealership.contract_value.toLocaleString()}
                    </div>
                  )}
                </div>
                <div>
                  <Label>CRM Provider</Label>
                  {isEditing ? (
                    <select
                      value={localData.crm_provider}
                      onChange={e => updateField('crm_provider', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] outline-none"
                    >
                      {Object.values(CRMProvider).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <div className="text-lg font-bold text-slate-800 tracking-tight">
                      {dealership.crm_provider}
                    </div>
                  )}
                </div>
              </div>

              <SectionHeader title="Account Governance" icon={Info} />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Enterprise Group</Label>
                  {isEditing ? (
                    <select
                      value={localData.enterprise_group_id || ''}
                      onChange={e => updateField('enterprise_group_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] outline-none"
                    >
                      <option value="">Independent</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  ) : (
                    <div className="text-[12px] font-bold text-slate-900">{dealership.enterprise_group?.name || 'INDEPENDENT'}</div>
                  )}
                </div>
                <div>
                  <Label>Go-Live Date</Label>
                  {isEditing ? (
                    <input type="date" value={localData.go_live_date || ''} onChange={e => updateField('go_live_date', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] outline-none" />
                  ) : (
                    <div className="text-[12px] font-bold text-slate-900">{dealership.go_live_date || 'N/A'}</div>
                  )}
                </div>
              </div>

              <SectionHeader title="System Identifiers" icon={CreditCard} />
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Store #</Label><EditableInput isEditing={isEditing} value={localData.store_number} onChange={(v: string) => updateField('store_number', v)} /></div>
                <div><Label>Branch #</Label><EditableInput isEditing={isEditing} value={localData.branch_number} onChange={(v: string) => updateField('branch_number', v)} /></div>
                <div><Label>CIF #</Label><EditableInput isEditing={isEditing} value={localData.cif_number} onChange={(v: string) => updateField('cif_number', v)} /></div>
              </div>

              <SectionHeader title="Contact Personnel" icon={Globe} />
              <div className="grid grid-cols-2 gap-6">
                <div><Label>POC Name</Label><EditableInput isEditing={isEditing} value={localData.contacts?.poc_name} onChange={(v: string) => updateContact('poc_name', v)} /></div>
                <div><Label>POC Email</Label><EditableInput isEditing={isEditing} value={localData.contacts?.poc_email} onChange={(v: string) => updateContact('poc_email', v)} /></div>
                <div><Label>POC Phone</Label><EditableInput isEditing={isEditing} value={localData.contacts?.poc_phone} onChange={(v: string) => updateContact('poc_phone', v)} /></div>
                <div><Label>Assigned Specialist</Label><EditableInput isEditing={isEditing} value={localData.contacts?.assigned_specialist_name} onChange={(v: string) => updateContact('assigned_specialist_name', v)} /></div>
              </div>

              <SectionHeader title="Location" icon={MapPin} />
              <div className="space-y-4">
                <div><Label>Address</Label><EditableInput isEditing={isEditing} value={localData.address_line1} onChange={(v: string) => updateField('address_line1', v)} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>City</Label><EditableInput isEditing={isEditing} value={localData.city} onChange={(v: string) => updateField('city', v)} /></div>
                  <div><Label>State</Label><EditableInput isEditing={isEditing} value={localData.state} onChange={(v: string) => updateField('state', v)} /></div>
                  <div><Label>Zip</Label><EditableInput isEditing={isEditing} value={localData.zip_code} onChange={(v: string) => updateField('zip_code', v)} /></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-bold text-slate-800">Order Ledger</h3>
                 <button onClick={() => setShowOrderForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all">
                    <Plus size={14} /> Add Transaction
                 </button>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">No order history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all flex items-center justify-between group">
                      <div>
                        <p className="text-[12px] font-bold text-slate-900">{order.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{order.order_number}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[12px] font-bold text-indigo-600">${order.amount.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">{order.status}</p>
                        </div>
                        <button onClick={() => removeOrder(order.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
               <div>
                  <SectionHeader title="Reynolds Solution Details" icon={Package} />
                  {isEditing ? (
                    <textarea 
                      value={localData.reynolds_solution?.solution_details || ''}
                      onChange={e => updateReynolds(e.target.value)}
                      placeholder="Enter solution details here..."
                      className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700 resize-none"
                    />
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-6 text-[12px] text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-wrap">
                      {dealership.reynolds_solution?.solution_details || 'No solution details documented.'}
                    </div>
                  )}
               </div>

               <div>
                  <SectionHeader title="General Administrative Notes" icon={StickyNote} />
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                     <p className="text-[11px] text-amber-800 italic">
                        "High priority dealership for Q3 renewal. Ensure specialist contact monthly."
                     </p>
                     <p className="text-[9px] text-amber-500 font-bold uppercase mt-2 tracking-widest">— Internal Memo</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Floating Save Button when editing */}
        {isEditing && (
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-white border-t border-slate-200 flex gap-4 z-20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            <button 
              onClick={() => { setIsEditing(false); setLocalData(dealership); }}
              className="flex-1 py-3 text-slate-500 font-bold text-[11px] uppercase tracking-widest border border-slate-200 bg-white hover:bg-slate-50 transition-all rounded-xl"
            >
              Cancel Changes
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] py-3 bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all rounded-xl flex items-center justify-center gap-3"
            >
              <Save size={16} /> Save New Version
            </button>
          </div>
        )}
      </div>

      {/* Simplified Order Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm">
            <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-8 border-b border-slate-100 pb-4">New Transaction</h3>
            <div className="space-y-6">
              <div>
                <Label>Transaction ID</Label>
                <input id="onum" className="w-full px-3 py-2 text-[11px] rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500" defaultValue={`ORD-${Math.floor(Math.random()*10000)}`} />
              </div>
              <div>
                <Label>Product Allocation</Label>
                <input id="pname" className="w-full px-3 py-2 text-[11px] rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Managed SEO Level 2" />
              </div>
              <div>
                <Label>Ledger Amount ($)</Label>
                <input id="amt" type="number" className="w-full px-3 py-2 text-[11px] rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="2500" />
              </div>
              <div className="flex gap-4 mt-10 pt-4">
                <button onClick={() => setShowOrderForm(false)} className="flex-1 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600">Discard</button>
                <button 
                  onClick={() => {
                    const p = document.getElementById('pname') as HTMLInputElement;
                    const a = document.getElementById('amt') as HTMLInputElement;
                    const o = document.getElementById('onum') as HTMLInputElement;
                    if (p.value && a.value) {
                      upsertOrder({
                        dealership_id: dealership.id,
                        order_number: o.value,
                        product_name: p.value,
                        amount: parseInt(a.value),
                        product_code: ProductCode.P15391SE,
                        order_date: new Date().toISOString(),
                        status: OrderStatus.PENDING
                      });
                      setShowOrderForm(false);
                    }
                  }}
                  className="flex-[2] py-3 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Create Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealershipDetailPanel;
