
import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, Plus, Minus, Check
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
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

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
    className={`w-full px-2 py-1 text-[11px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal ${className}`}
  />
);

const Select = ({ value, onChange, options, className = "" }: { value: any, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string }) => (
  <select 
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-2 py-1 text-[11px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal ${className}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const DealershipDetailPanel: React.FC<DealershipDetailPanelProps> = ({ 
  dealership, groups: initialGroups, onClose, onUpdate, onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DealershipWithRelations>(dealership);
  const [groups, setGroups] = useState(initialGroups);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    setFormData(dealership);
  }, [dealership]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(dealership);
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
  const addOrder = () => {
    const orders = [...(formData.orders || [])];
    orders.push({
      id: crypto.randomUUID(),
      dealership_id: formData.id,
      received_date: new Date().toISOString().split('T')[0],
      order_number: '',
      status: OrderStatus.PENDING,
      products: []
    });
    updateField('orders', orders);
  };

  const removeOrder = (idx: number) => {
    const orders = [...(formData.orders || [])];
    orders.splice(idx, 1);
    updateField('orders', orders);
  };

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

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const id = db.upsertEnterpriseGroup({ name: newGroupName, description: 'Added via Detail Panel' });
      setGroups([...groups, { id, name: newGroupName, description: '', created_at: new Date().toISOString() }]);
      updateField('enterprise_group_id', id);
      setNewGroupName('');
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateInput = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Sticky Header */}
        <div className="bg-white sticky top-0 z-30 border-b border-slate-100 shadow-sm">
          <div className="p-4 flex justify-end items-center gap-2">
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

          <div className="px-8 pb-6 space-y-3">
             <div>
               {isEditing ? (
                  <Input value={formData.name} onChange={(v) => updateField('name', v)} className="text-xl font-bold py-2" placeholder="Dealership Name" />
               ) : (
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{dealership.name}</h2>
               )}
             </div>

             <div>
               {isEditing ? (
                  <Input value={formData.cif_number} onChange={(v) => updateField('cif_number', v)} className="font-mono text-sm" placeholder="CIF Number" />
               ) : (
                  <div className="text-sm font-mono text-slate-500">{dealership.cif_number || '---'}</div>
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
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      dealership.status === DealershipStatus.LIVE ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {dealership.status}
                    </span>
                  )}
               </div>
               <div>
                  <Label>Go-Live Date</Label>
                  {isEditing ? (
                     <Input type="date" value={formatDateInput(formData.go_live_date)} onChange={(v) => updateField('go_live_date', v)} />
                  ) : (
                     <DataValue value={formatDate(dealership.go_live_date)} />
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

            {/* Removed hr line here */}
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mt-6">Account Details</h3>

            <div className="grid grid-cols-3 gap-6">
               <div>
                  <Label>Enterprise Group</Label>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <Select 
                        value={formData.enterprise_group_id}
                        onChange={(v) => updateField('enterprise_group_id', v)}
                        options={[
                          { label: 'Single (Independent)', value: '' },
                          ...groups.map(g => ({ label: g.name, value: g.id }))
                        ]}
                      />
                      {isAddingGroup ? (
                        <div className="flex gap-1 animate-in slide-in-from-top">
                           <Input value={newGroupName} onChange={(v) => setNewGroupName(v)} placeholder="Group Name" />
                           <button onClick={handleAddGroup} className="p-1 bg-indigo-600 text-white rounded"><Check size={12} /></button>
                           <button onClick={() => setIsAddingGroup(false)} className="p-1 bg-slate-200 text-slate-500 rounded"><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setIsAddingGroup(true)} className="text-[9px] font-bold text-indigo-600 text-left hover:underline">+ Add New Group</button>
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
                    <div className="font-mono text-xs">{dealership.store_number || '--'} / {dealership.branch_number || '--'}</div>
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
               <div>
                  <Label>Address</Label>
                  {isEditing ? <Input value={formData.address_line1} onChange={(v) => updateField('address_line1', v)} /> : <DataValue value={dealership.address_line1} />}
               </div>
               <div>
                  <Label>City</Label>
                  {isEditing ? <Input value={formData.city} onChange={(v) => updateField('city', v)} /> : <DataValue value={dealership.city} />}
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
                           <a href={link.primary_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-600 hover:underline truncate block">{link.primary_url}</a>
                        )}
                     </div>
                     <div className="flex gap-2">
                        <div className="flex-1">
                           <Label>Client ID</Label>
                           {isEditing ? (
                              <Input value={link.client_id} onChange={(v) => updateWebsite(idx, 'client_id', v)} />
                           ) : (
                              <div className="text-[11px] font-mono text-slate-500">{link.client_id || '---'}</div>
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
                  {isEditing ? <Input value={formData.contacts?.poc_email} onChange={(v) => updateContact('poc_email', v)} /> : <a href={`mailto:${dealership.contacts?.poc_email}`} className="text-[11px] text-indigo-600 underline truncate block">{dealership.contacts?.poc_email || '---'}</a>}
               </div>
               <div>
                  <Label>POC Phone</Label>
                  {isEditing ? (
                     <input 
                       value={formData.contacts?.poc_phone || ''}
                       onChange={(e) => updateContact('poc_phone', e.target.value)}
                       onBlur={(e) => updateContact('poc_phone', formatPhone(e.target.value))}
                       placeholder="(###) ###-####"
                       className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal"
                     />
                  ) : <DataValue value={dealership.contacts?.poc_phone} />}
               </div>
            </div>

            <hr className="border-slate-100 my-4" />
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">DMT Order Section</h3>

            {/* New Nested Order Section */}
            <div className="space-y-6">
               {(isEditing ? (formData.orders || []) : (dealership.orders || [])).map((order, orderIdx) => (
                  <div key={orderIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                     {isEditing && (
                        <button onClick={() => removeOrder(orderIdx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 bg-white rounded-md p-0.5 border border-slate-100 shadow-sm"><X size={14} /></button>
                     )}
                     
                     <div className="grid grid-cols-2 gap-4 mb-4 border-b border-slate-200 pb-3">
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
                       <Label>Line Items</Label>
                       {order.products?.map((product, prodIdx) => (
                          <div key={prodIdx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                             <div className="flex-1">
                               {isEditing ? (
                                 <Select 
                                   value={product.product_code} 
                                   onChange={(v) => updateProductInOrder(orderIdx, prodIdx, 'product_code', v)} 
                                   options={Object.values(ProductCode).map(p => ({ label: p, value: p }))}
                                 />
                               ) : <DataValue value={product.product_code} />}
                             </div>
                             <div className="w-20">
                               {isEditing ? (
                                 <Input 
                                   type="number" 
                                   value={product.amount} 
                                   onChange={(v) => updateProductInOrder(orderIdx, prodIdx, 'amount', parseFloat(v))} 
                                   placeholder="$"
                                 />
                               ) : <DataValue value={product.amount ? `$${product.amount.toLocaleString()}` : '$0'} />}
                             </div>
                             {isEditing && (
                               <button onClick={() => removeProductFromOrder(orderIdx, prodIdx)} className="text-slate-300 hover:text-red-500"><Minus size={14} /></button>
                             )}
                          </div>
                       ))}
                       {isEditing && (
                         <button onClick={() => addProductToOrder(orderIdx)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 uppercase tracking-wider mt-2">
                           <Plus size={12} /> Add Product
                         </button>
                       )}
                     </div>
                  </div>
               ))}
               {isEditing && (
                  <button onClick={addOrder} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 uppercase tracking-wider bg-indigo-50 px-3 py-2 rounded-lg w-fit">
                    <Plus size={12} /> Add New Order
                  </button>
               )}
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
