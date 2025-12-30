
import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, Plus, Minus, Check, ArrowLeft
} from 'lucide-react';
import { 
  DealershipWithRelations, 
  DealershipStatus, EnterpriseGroup, CRMProvider, ProductCode, OrderStatus, Order
} from '../types';
import { db } from '../db';

interface DealershipDetailPanelProps {
  dealership: DealershipWithRelations;
  groups: EnterpriseGroup[];
  onClose: () => void;
  onUpdate: (data: Partial<DealershipWithRelations>) => void;
  onDelete: () => void;
  onBack?: () => void;
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const statusColors: Record<DealershipStatus, string> = {
  [DealershipStatus.DMT_PENDING]: 'bg-slate-100 text-slate-600 border-slate-200',
  [DealershipStatus.DMT_APPROVED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [DealershipStatus.HOLD]: 'bg-orange-50 text-orange-700 border-orange-200',
  [DealershipStatus.ONBOARDING]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [DealershipStatus.LIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [DealershipStatus.LEGACY]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [DealershipStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200',
};

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
    {children}
  </label>
);

const DataValue = ({ value, mono = false }: { value?: any, mono?: boolean }) => (
  <div className={`text-[12px] font-normal text-slate-700 leading-tight min-h-[1.2em] ${mono ? 'font-mono' : ''}`}>
    {value || '---'}
  </div>
);

const Input = ({ value, onChange, type = "text", className = "", placeholder="" }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string }) => (
  <input 
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-2 py-1 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal ${className}`}
  />
);

const Select = ({ value, onChange, options, className = "" }: { value: any, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string }) => (
  <select 
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-2 py-1 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal ${className}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const DealershipDetailPanel: React.FC<DealershipDetailPanelProps> = ({ 
  dealership, groups: initialGroups, onClose, onUpdate, onDelete, onBack
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DealershipWithRelations>(dealership);
  const [groups, setGroups] = useState(initialGroups);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  
  // New Group Inline State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPP, setNewGroupPP] = useState('');
  const [newGroupERA, setNewGroupERA] = useState('');

  useEffect(() => {
    // When dealership changes, update form data.
    // If no orders exist, initialize one so it's ready for editing.
    const initialOrders = dealership.orders && dealership.orders.length > 0 
      ? dealership.orders 
      : [{
          id: crypto.randomUUID(),
          dealership_id: dealership.id,
          received_date: new Date().toISOString().split('T')[0],
          order_number: '',
          status: OrderStatus.PENDING,
          products: []
        }];

    setFormData({
      ...dealership,
      orders: initialOrders
    });
  }, [dealership]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original dealership data, but ensure single order stub exists if needed
    const initialOrders = dealership.orders && dealership.orders.length > 0 
      ? dealership.orders 
      : [{
          id: crypto.randomUUID(),
          dealership_id: dealership.id,
          received_date: new Date().toISOString().split('T')[0],
          order_number: '',
          status: OrderStatus.PENDING,
          products: []
        }];

    setFormData({
      ...dealership,
      orders: initialOrders
    });
    setIsEditing(false);
  };

  const updateField = (field: keyof DealershipWithRelations, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: { ...prev.contacts!, [field]: value } as any
    }));
  };

  const updateWebsite = (idx: number, field: string, val: string) => {
    const links = [...(formData.website_links || [])];
    if (links[idx]) {
      (links[idx] as any)[field] = val;
      updateField('website_links', links);
    }
  };

  const addWebsite = () => {
    const links = [...(formData.website_links || [])];
    links.push({ id: crypto.randomUUID(), dealership_id: formData.id, primary_url: '', client_id: '' });
    updateField('website_links', links);
  };

  const removeWebsite = (idx: number) => {
    const links = [...(formData.website_links || [])];
    links.splice(idx, 1);
    updateField('website_links', links);
  };

  // --- Order Logic for Nested Structure ---
  const updateOrder = (idx: number, field: keyof Order, val: any) => {
    const orders = [...(formData.orders || [])];
    (orders[idx] as any)[field] = val;
    updateField('orders', orders);
  };

  const addProductToOrder = (orderIdx: number) => {
     const orders = [...(formData.orders || [])];
     orders[orderIdx].products.push({
        id: crypto.randomUUID(),
        product_code: ProductCode.P15391_SE,
        amount: 0
     });
     updateField('orders', orders);
  };

  const removeProductFromOrder = (orderIdx: number, productIdx: number) => {
     const orders = [...(formData.orders || [])];
     orders[orderIdx].products.splice(productIdx, 1);
     updateField('orders', orders);
  };

  const updateProductInOrder = (orderIdx: number, productIdx: number, field: string, val: any) => {
     const orders = [...(formData.orders || [])];
     (orders[orderIdx].products[productIdx] as any)[field] = val;
     updateField('orders', orders);
  };
  // ------------------------------------------

  const handleGroupSelect = (val: string) => {
     updateField('enterprise_group_id', val);
     if (val) {
        const selectedGroup = groups.find(g => g.id === val);
        if (selectedGroup) {
           setFormData(prev => ({
              ...prev,
              pp_sys_id: selectedGroup.pp_sys_id || prev.pp_sys_id,
              era_system_id: selectedGroup.era_system_id || prev.era_system_id
           }));
        }
     }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const newGroupData = {
         name: newGroupName,
         description: 'Added via Detail Panel',
         pp_sys_id: newGroupPP,
         era_system_id: newGroupERA
      };
      
      const id = db.upsertEnterpriseGroup(newGroupData);
      
      const newGroup = {
         id,
         ...newGroupData,
         created_at: new Date().toISOString()
      };
      
      setGroups([...groups, newGroup]);
      updateField('enterprise_group_id', id);
      
      setFormData(prev => ({
         ...prev,
         pp_sys_id: newGroupPP || prev.pp_sys_id,
         era_system_id: newGroupERA || prev.era_system_id
      }));

      setNewGroupName('');
      setNewGroupPP('');
      setNewGroupERA('');
      setIsAddingGroup(false);
    }
  };

  const formatPhone = (val: string) => {
    const cleaned = ('' + val).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return val;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    // Fix: Parse YYYY-MM-DD explicitly to avoid timezone offset issues (e.g. showing previous day)
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create local date (month is 0-indexed)
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateInput = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const isLockedStatus = (status: DealershipStatus) => {
     return [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED, DealershipStatus.HOLD].includes(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Sticky Header */}
        <div className="bg-white sticky top-0 z-30 border-b border-slate-100 shadow-sm">
          <div className="p-4 flex justify-between items-center gap-2">
             <div className="flex items-center gap-2">
               {onBack && (
                  <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all mr-2">
                    <ArrowLeft size={20} />
                  </button>
               )}
             </div>

             <div className="flex items-center gap-2">
               {isEditing ? (
                 <>
                   <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-1">
                     <Save size={14} /> Save
                   </button>
                   <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><RefreshCw size={16} /></button>
                 </>
               ) : (
                 <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-1">
                    <Edit3 size={14} /> Edit
                 </button>
               )}
               <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
               <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
             </div>
          </div>

          <div className="px-8 pb-6 space-y-3">
             <div>
               {isEditing ? (
                  <input 
                    value={formData.name} 
                    onChange={(e) => updateField('name', e.target.value)} 
                    className="w-full text-xl font-bold py-2 border-b border-indigo-200 outline-none focus:border-indigo-500 bg-transparent text-slate-900" 
                    placeholder="Dealership Name" 
                  />
               ) : (
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{dealership.name}</h2>
               )}
             </div>

             <div>
               {isEditing ? (
                  <Input value={formData.cif_number} onChange={(v) => updateField('cif_number', v)} className="font-mono text-[12px]" placeholder="CIF Number" />
               ) : (
                  <div className="text-[12px] font-mono text-slate-500">{dealership.cif_number || '---'}</div>
               )}
             </div>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-white pb-20 custom-scrollbar">
          <div className="animate-in fade-in duration-500 space-y-6">
            
            <div className="grid grid-cols-3 gap-6">
               <div>
                  <Label>Status</Label>
                  {isEditing ? (
                    <Select 
                       value={formData.status}
                       onChange={(v) => updateField('status', v)}
                       options={Object.values(DealershipStatus).map(s => ({ label: s, value: s }))}
                    />
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${statusColors[dealership.status]}`}>
                      {dealership.status}
                    </span>
                  )}
               </div>
               <div>
                  <Label>Go-Live Date</Label>
                  {isEditing ? (
                     isLockedStatus(formData.status) ? (
                        <div className="w-full px-2 py-1 text-[12px] border border-slate-100 bg-slate-50 text-slate-400 rounded-lg italic cursor-not-allowed">
                          Pending Status
                        </div>
                     ) : (
                        <Input type="date" value={formatDateInput(formData.go_live_date)} onChange={(v) => updateField('go_live_date', v)} />
                     )
                  ) : (
                     <DataValue value={isLockedStatus(dealership.status) ? 'Pending' : formatDate(dealership.go_live_date)} />
                  )}
               </div>
               <div>
                  {(formData.status === DealershipStatus.CANCELLED) && (
                     <>
                       <Label>Term Date</Label>
                       {isEditing ? (
                          <Input type="date" value={formatDateInput(formData.term_date)} onChange={(v) => updateField('term_date', v)} />
                       ) : (
                          <DataValue value={formatDate(dealership.term_date)} />
                       )}
                     </>
                  )}
               </div>
            </div>

            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mt-6">Account Details</h3>

            <div className="grid grid-cols-3 gap-6">
               <div className="min-w-0">
                  <Label>Enterprise Group</Label>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                       {!isAddingGroup ? (
                         <>
                           <Select 
                              value={formData.enterprise_group_id}
                              onChange={handleGroupSelect}
                              options={[
                                { label: 'Single (Independent)', value: '' },
                                ...groups.map(g => ({ label: g.name, value: g.id }))
                              ]}
                            />
                            <button onClick={() => setIsAddingGroup(true)} className="text-[9px] font-bold text-indigo-600 text-left hover:underline">+ Add New Group</button>
                         </>
                       ) : (
                         <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-[9px] font-bold text-indigo-800">New Group</span>
                               <button onClick={() => setIsAddingGroup(false)} className="text-indigo-400 hover:text-indigo-800"><X size={12} /></button>
                            </div>
                            <div className="space-y-1">
                               <Input value={newGroupName} onChange={(v) => setNewGroupName(v)} placeholder="Name" />
                               <div className="grid grid-cols-2 gap-1">
                                  <Input value={newGroupPP} onChange={(v) => setNewGroupPP(v)} placeholder="PP ID" className="font-mono text-[10px]" />
                                  <Input value={newGroupERA} onChange={(v) => setNewGroupERA(v)} placeholder="ERA ID" className="font-mono text-[10px]" />
                               </div>
                               <button onClick={handleAddGroup} className="w-full text-[9px] bg-indigo-600 text-white rounded py-1 mt-1 font-bold">Create</button>
                            </div>
                         </div>
                       )}
                    </div>
                  ) : (
                     <DataValue value={dealership.enterprise_group?.name || 'Single (Independent)'} />
                  )}
               </div>
               <div>
                  <Label>CRM Provider</Label>
                  {isEditing ? (
                     <Select 
                        value={formData.crm_provider}
                        onChange={(v) => updateField('crm_provider', v)}
                        options={Object.values(CRMProvider).map(c => ({ label: c, value: c }))}
                     />
                  ) : (
                     <DataValue value={dealership.crm_provider} />
                  )}
               </div>
               <div>
                  <Label>Store / Branch</Label>
                  {isEditing ? (
                    <div className="flex gap-1">
                       <Input value={formData.store_number} onChange={(v) => updateField('store_number', v)} placeholder="#" />
                       <Input value={formData.branch_number} onChange={(v) => updateField('branch_number', v)} placeholder="#" />
                    </div>
                  ) : (
                    <div className="font-mono text-[12px]">{dealership.store_number || '--'} / {dealership.branch_number || '--'}</div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div>
                  <Label>PP Sys ID</Label>
                  {isEditing ? <Input value={formData.pp_sys_id} onChange={(v) => updateField('pp_sys_id', v)} /> : <DataValue mono value={dealership.pp_sys_id} />}
               </div>
               <div>
                  <Label>ERA ID</Label>
                  {isEditing ? <Input value={formData.era_system_id} onChange={(v) => updateField('era_system_id', v)} /> : <DataValue mono value={dealership.era_system_id} />}
               </div>
               <div>
                  <Label>BU ID</Label>
                  {isEditing ? <Input value={formData.bu_id} onChange={(v) => updateField('bu_id', v)} /> : <DataValue mono value={dealership.bu_id} />}
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="col-span-2">
                  <Label>Address</Label>
                  {isEditing ? (
                     <div className="flex gap-2">
                        <Input value={formData.address_line1} onChange={(v) => updateField('address_line1', v)} placeholder="Street Address" className="w-full" />
                     </div>
                  ) : (
                     <DataValue value={`${dealership.address_line1}`} />
                  )}
               </div>
               <div>
                  <Label>State</Label>
                  {isEditing ? (
                     <Select 
                        value={formData.state} 
                        onChange={(v) => updateField('state', v)}
                        options={[{ label: 'Select', value: '' }, ...STATES.map(s => ({ label: s, value: s }))]}
                     />
                  ) : (
                     <DataValue value={dealership.state} />
                  )}
               </div>
            </div>

            <hr className="border-slate-100 my-4" />
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Website Links</h3>
            
            <div className="space-y-2">
               {(isEditing ? (formData.website_links || []) : (dealership.website_links || [])).map((link, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                     <div>
                        <Label>Primary URL</Label>
                        {isEditing ? (
                           <Input value={link.primary_url} onChange={(v) => updateWebsite(idx, 'primary_url', v)} />
                        ) : (
                           <a href={link.primary_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-indigo-600 hover:underline truncate block">{link.primary_url}</a>
                        )}
                     </div>
                     <div className="flex gap-2">
                        <div className="flex-1">
                           <Label>Client ID</Label>
                           {isEditing ? (
                              <Input value={link.client_id} onChange={(v) => updateWebsite(idx, 'client_id', v)} />
                           ) : (
                              <div className="text-[12px] font-mono text-slate-500">{link.client_id || '---'}</div>
                           )}
                        </div>
                        {isEditing && formData.website_links!.length > 1 && (
                           <button onClick={() => removeWebsite(idx)} className="mt-4 text-slate-400 hover:text-red-500"><Minus size={14} /></button>
                        )}
                     </div>
                  </div>
               ))}
               {isEditing && (
                  <button onClick={addWebsite} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 uppercase tracking-wider bg-indigo-50 px-3 py-2 rounded-lg w-fit">
                    <Plus size={12} /> Add New Website
                  </button>
               )}
            </div>

            <hr className="border-slate-100 my-4" />
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Contacts</h3>

            <div className="grid grid-cols-3 gap-4">
               <div>
                  <Label>Sales Associate</Label>
                  {isEditing ? <Input value={formData.contacts?.sales_contact_name} onChange={(v) => updateContact('sales_contact_name', v)} /> : <DataValue value={dealership.contacts?.sales_contact_name} />}
               </div>
               <div>
                  <Label>Enrollment Specialist</Label>
                  {isEditing ? <Input value={formData.contacts?.enrollment_contact_name} onChange={(v) => updateContact('enrollment_contact_name', v)} /> : <DataValue value={dealership.contacts?.enrollment_contact_name} />}
               </div>
               <div>
                  <Label>CSM Specialist</Label>
                  {isEditing ? <Input value={formData.contacts?.assigned_specialist_name} onChange={(v) => updateContact('assigned_specialist_name', v)} /> : <DataValue value={dealership.contacts?.assigned_specialist_name} />}
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div>
                  <Label>POC Name</Label>
                  {isEditing ? <Input value={formData.contacts?.poc_name} onChange={(v) => updateContact('poc_name', v)} /> : <DataValue value={dealership.contacts?.poc_name} />}
               </div>
               <div>
                  <Label>POC Email</Label>
                  {isEditing ? <Input value={formData.contacts?.poc_email} onChange={(v) => updateContact('poc_email', v)} /> : <a href={`mailto:${dealership.contacts?.poc_email}`} className="text-[12px] text-indigo-600 underline truncate block">{dealership.contacts?.poc_email || '---'}</a>}
               </div>
               <div>
                  <Label>POC Phone</Label>
                  {isEditing ? (
                     <input 
                       value={formData.contacts?.poc_phone || ''}
                       onChange={(e) => updateContact('poc_phone', e.target.value)}
                       onBlur={(e) => updateContact('poc_phone', formatPhone(e.target.value))}
                       placeholder="(###) ###-####"
                       className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal"
                     />
                  ) : <DataValue value={dealership.contacts?.poc_phone} />}
               </div>
            </div>

            <hr className="border-slate-100 my-4" />
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">DMT Order Section</h3>

            {/* New Nested Order Section */}
            <div className="space-y-6">
               {(isEditing ? (formData.orders || []) : (dealership.orders || [])).map((order, orderIdx) => (
                  <div key={orderIdx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 relative">
                     
                     <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                           <Label>Received Date</Label>
                           {isEditing ? <Input type="date" value={formatDateInput(order.received_date)} onChange={(v) => updateOrder(orderIdx, 'received_date', v)} /> : <DataValue value={formatDate(order.received_date)} />}
                        </div>
                        <div>
                           <Label>Order Number</Label>
                           {isEditing ? <Input value={order.order_number} onChange={(v) => updateOrder(orderIdx, 'order_number', v)} className="font-bold font-mono" /> : <DataValue mono value={order.order_number} />}
                        </div>
                     </div>

                     <div className="space-y-3">
                       {isEditing ? (
                         <>
                           <div className="grid grid-cols-[1fr_120px_auto] gap-3 mb-1 px-1">
                              <Label>Product</Label>
                              <Label>Price ($)</Label>
                           </div>
                           {order.products?.map((product, prodIdx) => (
                              <div key={prodIdx} className="grid grid-cols-[1fr_120px_auto] gap-3 items-center">
                                 <Select 
                                   value={product.product_code} 
                                   onChange={(v) => updateProductInOrder(orderIdx, prodIdx, 'product_code', v)} 
                                   options={Object.values(ProductCode).map(p => ({ label: p, value: p }))}
                                 />
                                 <Input 
                                   type="number" 
                                   value={product.amount} 
                                   onChange={(v) => updateProductInOrder(orderIdx, prodIdx, 'amount', parseFloat(v))} 
                                   placeholder="0.00"
                                 />
                                 <button onClick={() => removeProductFromOrder(orderIdx, prodIdx)} className="text-slate-300 hover:text-red-500"><Minus size={14} /></button>
                              </div>
                           ))}
                           <button onClick={() => addProductToOrder(orderIdx)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 uppercase tracking-wider mt-2">
                             <Plus size={12} /> Add New Product
                           </button>
                         </>
                       ) : (
                         <>
                           <Label>Line Items</Label>
                           {order.products?.map((product, prodIdx) => (
                              <div key={prodIdx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                                 <div className="flex-1">
                                   <DataValue value={product.product_code} />
                                 </div>
                                 <div className="w-20 text-right">
                                   <DataValue value={product.amount ? `$${product.amount.toLocaleString()}` : '$0'} />
                                 </div>
                              </div>
                           ))}
                         </>
                       )}
                     </div>
                  </div>
               ))}
               {!isEditing && (!dealership.orders || dealership.orders.length === 0) && (
                  <div className="text-[11px] text-slate-400 italic">No orders recorded.</div>
               )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipDetailPanel;