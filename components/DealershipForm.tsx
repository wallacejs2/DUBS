
import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Check, Minus } from 'lucide-react';
import { 
  DealershipWithRelations, DealershipStatus, CRMProvider, 
  EnterpriseGroup, ProductCode, OrderStatus, Order
} from '../types';
import { db } from '../db';

interface DealershipFormProps {
  initialData?: Partial<DealershipWithRelations>;
  onSubmit: (data: Partial<DealershipWithRelations>) => void;
  onCancel: () => void;
  groups: EnterpriseGroup[];
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const DealershipForm: React.FC<DealershipFormProps> = ({ initialData, onSubmit, onCancel, groups: initialGroups }) => {
  const [groups, setGroups] = useState(initialGroups);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  
  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPP, setNewGroupPP] = useState('');
  const [newGroupERA, setNewGroupERA] = useState('');

  const [formData, setFormData] = useState<Partial<DealershipWithRelations>>(initialData || {
    status: DealershipStatus.DMT_PENDING,
    crm_provider: CRMProvider.FOCUS,
    enterprise_group_id: '',
    website_links: [{ id: crypto.randomUUID(), dealership_id: '', primary_url: '', client_id: '' }],
    contacts: {
      id: '', dealership_id: '', sales_contact_name: '', enrollment_contact_name: '', 
      assigned_specialist_name: '', poc_name: '', poc_phone: '', poc_email: ''
    },
    orders: [{
      id: crypto.randomUUID(),
      dealership_id: '',
      received_date: new Date().toISOString().split('T')[0],
      order_number: '',
      status: OrderStatus.PENDING,
      products: []
    }]
  });

  // Ensure if initialData was provided but had empty orders, we add one
  if (initialData && (!initialData.orders || initialData.orders.length === 0)) {
     if (!formData.orders || formData.orders.length === 0) {
       setFormData(prev => ({
         ...prev,
         orders: [{
            id: crypto.randomUUID(),
            dealership_id: initialData.id || '',
            received_date: new Date().toISOString().split('T')[0],
            order_number: '',
            status: OrderStatus.PENDING,
            products: []
         }]
       }));
     }
  }

  const updateField = (field: keyof DealershipWithRelations, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: { ...prev.contacts!, [field]: value } as any
    }));
  };

  // Website Links Logic
  const addWebsite = () => {
    const links = [...(formData.website_links || [])];
    links.push({ id: crypto.randomUUID(), dealership_id: formData.id || '', primary_url: '', client_id: '' });
    updateField('website_links', links);
  };

  const removeWebsite = (idx: number) => {
    const links = [...(formData.website_links || [])];
    links.splice(idx, 1);
    updateField('website_links', links);
  };

  const updateWebsite = (idx: number, field: string, val: string) => {
    const links = [...(formData.website_links || [])];
    (links[idx] as any)[field] = val;
    updateField('website_links', links);
  };

  // Order Logic
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

  // Group Logic
  const handleGroupSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value;
    updateField('enterprise_group_id', groupId);
    
    // Auto-populate IDs from the selected group
    if (groupId) {
      const selectedGroup = groups.find(g => g.id === groupId);
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
         description: 'Created via Dealership Form',
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
      
      // Auto-populate dealership fields with the new group values
      setFormData(prev => ({
         ...prev,
         pp_sys_id: newGroupPP || prev.pp_sys_id,
         era_system_id: newGroupERA || prev.era_system_id
      }));

      // Reset
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isLockedStatus = (status?: DealershipStatus) => {
    return [DealershipStatus.DMT_PENDING, DealershipStatus.DMT_APPROVED, DealershipStatus.HOLD].includes(status || DealershipStatus.DMT_PENDING);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden transition-colors">
        
        {/* Fixed Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col z-10 relative shadow-sm transition-colors">
            <div className="p-4 flex justify-end items-center gap-2">
              {initialData?.id && (
                 <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-auto pl-4">Editing Mode</span>
              )}
              <button 
                type="submit"
                form="dealer-form"
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
              >
                <Save size={14} /> Save
              </button>
              <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"><X size={20} /></button>
            </div>

            <div className="px-8 pb-6 space-y-4">
               <div>
                 <input 
                    required
                    value={formData.name || ''} 
                    onChange={e => updateField('name', e.target.value)}
                    className="w-full px-3 py-3 text-2xl font-bold text-slate-800 dark:text-slate-100 rounded-xl border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none transition-all bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="Enter Dealership Name"
                  />
               </div>
               <div>
                  <input 
                    value={formData.cif_number || ''} 
                    onChange={e => updateField('cif_number', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="CIF-#####"
                  />
               </div>
            </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900 custom-scrollbar transition-colors">
          <form id="dealer-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Status & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={formData.status || DealershipStatus.DMT_PENDING} 
                  onChange={e => updateField('status', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal"
                >
                  {Object.values(DealershipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Go-Live Date</label>
                {isLockedStatus(formData.status) ? (
                  <div className="w-full px-3 py-2 text-xs rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 italic">
                    Pending Status
                  </div>
                ) : (
                  <input 
                    type="date"
                    value={formData.go_live_date ? formData.go_live_date.split('T')[0] : ''} 
                    onChange={e => updateField('go_live_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal dark:color-scheme-dark"
                  />
                )}
              </div>
              <div className="space-y-1">
                 {formData.status === DealershipStatus.CANCELLED && (
                   <>
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Term Date</label>
                    <input 
                      type="date"
                      value={formData.term_date ? formData.term_date.split('T')[0] : ''} 
                      onChange={e => updateField('term_date', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal dark:color-scheme-dark"
                    />
                   </>
                 )}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Account Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Enterprise Group</label>
                <div className="flex gap-2 items-start">
                  {!isAddingGroup ? (
                    <>
                       <select 
                        value={formData.enterprise_group_id || ''} 
                        onChange={handleGroupSelect}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal"
                      >
                        <option value="">Single (Independent)</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingGroup(true)}
                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 whitespace-nowrap border border-indigo-100 dark:border-indigo-800"
                      >
                        + New
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300">New Group</span>
                          <button type="button" onClick={() => setIsAddingGroup(false)} className="text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"><X size={14}/></button>
                       </div>
                       <div className="space-y-2">
                          <input 
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            placeholder="Group Name"
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                            autoFocus
                          />
                          <div className="grid grid-cols-2 gap-2">
                             <input 
                                value={newGroupPP}
                                onChange={e => setNewGroupPP(e.target.value)}
                                placeholder="PP ID"
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
                             />
                             <input 
                                value={newGroupERA}
                                onChange={e => setNewGroupERA(e.target.value)}
                                placeholder="ERA ID"
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono"
                             />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleAddGroup} 
                            className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold mt-1 hover:bg-indigo-700"
                          >
                            Create & Select
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">CRM Provider</label>
                <select 
                  value={formData.crm_provider || CRMProvider.FOCUS} 
                  onChange={e => updateField('crm_provider', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none font-normal"
                >
                  {Object.values(CRMProvider).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Store / Branch</label>
                <div className="flex gap-2">
                    <input value={formData.store_number || ''} onChange={e => updateField('store_number', e.target.value)} className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="Store #" />
                    <input value={formData.branch_number || ''} onChange={e => updateField('branch_number', e.target.value)} className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="Branch #" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">PP Sys ID</label>
                <input value={formData.pp_sys_id || ''} onChange={e => updateField('pp_sys_id', e.target.value)} className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600" />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">ERA ID</label>
                 <input value={formData.era_system_id || ''} onChange={e => updateField('era_system_id', e.target.value)} className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600" />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">BU ID</label>
                 <input value={formData.bu_id || ''} onChange={e => updateField('bu_id', e.target.value)} className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Address</label>
                <input required value={formData.address_line1 || ''} onChange={e => updateField('address_line1', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="Street Address" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">State</label>
                <select 
                  required 
                  value={formData.state || ''} 
                  onChange={e => updateField('state', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal"
                >
                  <option value="">Select State</option>
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Website Links</h3>

            <div className="space-y-3">
              {formData.website_links?.map((link, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Primary URL</label>
                      <input value={link.primary_url} onChange={e => updateWebsite(idx, 'primary_url', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                   </div>
                   <div className="flex gap-2">
                     <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Client ID</label>
                        <input value={link.client_id || ''} onChange={e => updateWebsite(idx, 'client_id', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                     </div>
                     {formData.website_links!.length > 1 && (
                       <button type="button" onClick={() => removeWebsite(idx)} className="mb-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16} /></button>
                     )}
                   </div>
                </div>
              ))}
              <button type="button" onClick={addWebsite} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 w-fit border border-indigo-100 dark:border-indigo-800">
                + Add New Website
              </button>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Contacts</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Sales Associate</label>
                  <input value={formData.contacts?.sales_contact_name || ''} onChange={e => updateContact('sales_contact_name', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Enrollment Specialist</label>
                  <input value={formData.contacts?.enrollment_contact_name || ''} onChange={e => updateContact('enrollment_contact_name', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">CSM Specialist</label>
                  <input value={formData.contacts?.assigned_specialist_name || ''} onChange={e => updateContact('assigned_specialist_name', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">POC Name</label>
                  <input value={formData.contacts?.poc_name || ''} onChange={e => updateContact('poc_name', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">POC Email</label>
                  <input type="email" value={formData.contacts?.poc_email || ''} onChange={e => updateContact('poc_email', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">POC Phone</label>
                  <input 
                    value={formData.contacts?.poc_phone || ''} 
                    onChange={e => updateContact('poc_phone', e.target.value)} 
                    onBlur={e => updateContact('poc_phone', formatPhone(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                    placeholder="(###) ###-####"
                  />
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">DMT Order Section</h3>

            <div className="space-y-6">
               {formData.orders?.map((order, orderIdx) => (
                 <div key={orderIdx} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 relative">
                    {/* Header: Date & Order # */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Received Date</label>
                           <input type="date" value={order.received_date ? order.received_date.split('T')[0] : ''} onChange={e => updateOrder(orderIdx, 'received_date', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal dark:color-scheme-dark" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Order Number</label>
                           <input value={order.order_number} onChange={e => updateOrder(orderIdx, 'order_number', e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none font-mono font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="ORD-#####" />
                        </div>
                    </div>

                    {/* Products List */}
                    <div>
                       <div className="grid grid-cols-[1fr_120px_auto] gap-3 mb-2 px-1">
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product</label>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price ($)</label>
                       </div>
                       <div className="space-y-2">
                          {order.products?.map((product, prodIdx) => (
                              <div key={prodIdx} className="grid grid-cols-[1fr_120px_auto] gap-3 items-center">
                                 <select 
                                   value={product.product_code} 
                                   onChange={e => updateProductInOrder(orderIdx, prodIdx, 'product_code', e.target.value)} 
                                   className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal"
                                  >
                                   {Object.values(ProductCode).map(p => <option key={p} value={p}>{p}</option>)}
                                 </select>
                                 <input 
                                   type="number" 
                                   value={product.amount} 
                                   onChange={e => updateProductInOrder(orderIdx, prodIdx, 'amount', parseFloat(e.target.value))} 
                                   className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                                   placeholder="0.00"
                                  />
                                 <button type="button" onClick={() => removeProductFromOrder(orderIdx, prodIdx)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Minus size={14} /></button>
                              </div>
                           ))}
                       </div>
                       <button type="button" onClick={() => addProductToOrder(orderIdx)} className="mt-3 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                         <Plus size={12} /> Add New Product
                       </button>
                    </div>
                 </div>
               ))}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default DealershipForm;
