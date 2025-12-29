import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Mail, Phone, Calendar, 
  Trash2, Edit3, Package, CheckCircle2,
  FileText, Link as LinkIcon, Hash, Info, Save
} from 'lucide-react';
import { 
  DealershipWithRelations, OrderStatus, 
  ProductCode, DealershipStatus, CRMProvider, EnterpriseGroup
} from '../types';
import { useOrders } from '../hooks';

interface DealershipDetailPanelProps {
  dealership: DealershipWithRelations;
  groups: EnterpriseGroup[];
  onClose: () => void;
  onUpdate: (data: Partial<DealershipWithRelations>) => void;
  onDelete: () => void;
}

const DealershipDetailPanel: React.FC<DealershipDetailPanelProps> = ({ 
  dealership, groups, onClose, onUpdate, onDelete 
}) => {
  const { orders, upsert: upsertOrder, remove: removeOrder } = useOrders(dealership.id);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<DealershipWithRelations>(dealership);

  // Sync local data if dealership changes from external update
  useEffect(() => {
    setLocalData(dealership);
  }, [dealership]);

  const totalRevenue = orders.reduce((acc, o) => acc + o.amount, 0);

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

  const updateWebsite = (id: string, value: string) => {
    setLocalData(prev => ({
      ...prev,
      website_links: prev.website_links.map(l => l.id === id ? { ...l, primary_url: value } : l)
    }));
  };

  const SectionHeader = ({ icon: Icon, title, action }: { icon: any, title: string, action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <Icon size={14} />
        </div>
        <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{title}</h3>
      </div>
      {action}
    </div>
  );

  const EditableInput = ({ value, onChange, placeholder, type = "text", className = "" }: any) => (
    isEditing ? (
      <input 
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${className}`}
      />
    ) : (
      <p className={`text-[11px] font-medium text-slate-700 truncate ${className}`}>{value || 'N/A'}</p>
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br from-white to-slate-50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              {isEditing ? (
                <select
                  value={localData.enterprise_group_id || ''}
                  onChange={e => updateField('enterprise_group_id', e.target.value)}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-indigo-200 bg-indigo-50 text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Independent / No Group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-indigo-200 bg-indigo-50 text-indigo-700`}>
                  {dealership.enterprise_group?.name || 'Independent'}
                </span>
              )}
              <span className="text-[9px] text-slate-400 font-mono">ID: {dealership.id.slice(0, 8)}</span>
            </div>
            {isEditing ? (
              <input 
                value={localData.name}
                onChange={e => updateField('name', e.target.value)}
                className="text-lg font-bold text-slate-800 leading-tight bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{dealership.name}</h2>
            )}
            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <Calendar size={12} />
              <span className="text-[10px]">Added {new Date(dealership.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-1 ml-4">
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              title={isEditing ? "Discard Changes" : "Edit Dealership"} 
              className={`p-2 rounded-xl transition-all ${isEditing ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              {isEditing ? <X size={16} /> : <Edit3 size={16} />}
            </button>
            {!isEditing && (
              <button onClick={onDelete} title="Delete Dealership" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/20 pb-24">
          
          {/* Quick Stats Summary */}
          <section className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              {isEditing ? (
                <select 
                  value={localData.status}
                  onChange={e => updateField('status', e.target.value)}
                  className="w-full bg-slate-50 text-[10px] font-bold border-none outline-none focus:ring-0 text-indigo-700"
                >
                  {Object.values(DealershipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <p className="text-xs font-bold text-indigo-700">{dealership.status}</p>
              )}
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract</p>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-600">$</span>
                  <input 
                    type="number"
                    value={localData.contract_value}
                    onChange={e => updateField('contract_value', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 text-xs font-bold border-none outline-none focus:ring-0 text-emerald-600 p-0"
                  />
                </div>
              ) : (
                <p className="text-xs font-bold text-emerald-600">${dealership.contract_value.toLocaleString()}</p>
              )}
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="text-xs font-bold text-amber-600">${totalRevenue.toLocaleString()}</p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <SectionHeader icon={Mail} title="Primary Contacts" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0"><Mail size={14} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mb-1">POC Email</p>
                  <EditableInput 
                    value={localData.contacts?.poc_email}
                    onChange={(val: string) => updateContact('poc_email', val)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0"><Phone size={14} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mb-1">POC Phone</p>
                  <EditableInput 
                    value={localData.contacts?.poc_phone}
                    onChange={(val: string) => updateContact('poc_phone', val)}
                    placeholder="555-555-5555"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0"><CheckCircle2 size={14} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mb-1">Assigned Specialist</p>
                  <EditableInput 
                    value={localData.contacts?.assigned_specialist_name}
                    onChange={(val: string) => updateContact('assigned_specialist_name', val)}
                    placeholder="Specialist Name"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* System Identifiers */}
          <section>
            <SectionHeader icon={Hash} title="System Identifiers" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'CIF #', field: 'cif_number' },
                { label: 'ERA ID', field: 'era_system_id' },
                { label: 'PP Sys', field: 'pp_sys_id' },
                { label: 'Store #', field: 'store_number' },
                { label: 'Branch #', field: 'branch_number' },
                { label: 'BU ID', field: 'bu_id' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[8px] font-bold text-slate-300 uppercase mb-0.5 tracking-tighter">{item.label}</p>
                  {isEditing ? (
                    <input 
                      value={(localData as any)[item.field] || ''}
                      onChange={e => updateField(item.field as any, e.target.value)}
                      className="w-full bg-slate-50 text-[10px] font-mono font-semibold border border-slate-200 rounded px-1 outline-none"
                    />
                  ) : (
                    <p className="text-[10px] font-mono font-semibold text-slate-700">{(localData as any)[item.field] || '---'}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Website Links */}
          <section>
            <SectionHeader icon={LinkIcon} title="Website Links" />
            <div className="grid grid-cols-1 gap-2">
              {localData.website_links.length > 0 ? (
                localData.website_links.map(link => (
                  <div key={link.id} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                      {isEditing ? (
                        <input 
                          value={link.primary_url}
                          onChange={e => updateWebsite(link.id, e.target.value)}
                          className="flex-1 text-[11px] font-medium text-slate-600 bg-transparent outline-none"
                        />
                      ) : (
                        <span className="text-[11px] font-medium text-slate-600 truncate">{link.primary_url}</span>
                      )}
                      {!isEditing && (
                        <a href={link.primary_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={12} className="text-slate-300 hover:text-indigo-600 transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic">No website links provided.</p>
              )}
            </div>
          </section>

          {/* Order History */}
          <section>
            <SectionHeader 
              icon={Package} 
              title="Order History" 
              action={
                <button 
                  onClick={() => setShowOrderForm(true)}
                  className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1"
                >
                  Create Order
                </button>
              }
            />
            
            {orders.length === 0 ? (
              <div className="text-center py-8 px-6 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                <Package className="mx-auto text-slate-200 mb-2" size={24} />
                <p className="text-slate-400 text-[10px]">No orders found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <Package size={14} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">{order.product_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{order.product_code}</span>
                          <span className="text-[8px] font-medium text-slate-300">|</span>
                          <span className="text-[8px] font-medium text-slate-400">{new Date(order.order_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">${order.amount.toLocaleString()}</p>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${
                          order.status === OrderStatus.COMPLETED ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <button onClick={() => removeOrder(order.id)} className="p-1 text-slate-200 hover:text-red-500 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Internal Notes */}
          <section className="pb-4">
            <SectionHeader icon={FileText} title="Internal Notes" />
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <textarea 
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-[11px] focus:ring-1 focus:ring-indigo-500 h-24 outline-none transition-all resize-none"
                placeholder="Type a new internal note here..."
              ></textarea>
              <div className="flex justify-end mt-2">
                <button className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all">
                  Post Note
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="flex gap-3 mb-4 last:mb-0">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-700">System Admin</span>
                      <span className="text-[8px] text-slate-400">2 days ago</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Initial setup completed and go-live date set for next quarter. Waiting on final CRM credentials from client.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Footer for Editing */}
        {isEditing && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3 z-20">
            <button 
              onClick={() => { setIsEditing(false); setLocalData(dealership); }}
              className="flex-1 py-2 text-slate-400 font-bold text-[11px] hover:text-slate-600"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-2 px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 text-[11px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Save size={14} /> Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Internal Order Creation Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[1.25rem] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 mb-4">New Order</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Order #</label>
                <input id="onum" className="w-full px-3 py-2 text-[11px] rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500" defaultValue={`ORD-${Math.floor(Math.random()*10000)}`} />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Product Name</label>
                <input id="pname" className="w-full px-3 py-2 text-[11px] rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g. SEO Managed" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Amount ($)</label>
                <input id="amt" type="number" className="w-full px-3 py-2 text-[11px] rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="1000" />
              </div>
              <div className="flex gap-3 mt-6 pt-2">
                <button onClick={() => setShowOrderForm(false)} className="flex-1 py-2 text-slate-400 font-bold text-[11px] hover:text-slate-600">Cancel</button>
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
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md shadow-indigo-100 text-[11px] hover:bg-indigo-700 transition-all"
                >
                  Create
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