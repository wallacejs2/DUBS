
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Save, Plus, Trash2, Check, Minus, RefreshCw, ChevronDown } from 'lucide-react';
import { 
  DealershipWithRelations, DealershipStatus, CRMProvider, 
  EnterpriseGroup, ProductCode, OrderStatus, Order, TeamRole,
  ProviderProductCategory, ProviderType
} from '../types';
import { db } from '../db';
import { useTeamMembers, useProvidersProducts } from '../hooks';

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

// Helper components for consistency
const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">
    {children}
  </label>
);

// Fix: Add required prop to Input helper component to resolve type error
const Input = ({ value, onChange, type = "text", className = "", placeholder="", disabled = false, required = false }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string, disabled?: boolean, required?: boolean }) => (
  <input 
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    required={required}
    className={`w-full px-2 py-1 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600 ${disabled ? 'opacity-50 bg-slate-50 dark:bg-slate-900 cursor-not-allowed border-slate-100 dark:border-slate-800' : ''} ${className}`}
  />
);

const Select = ({ value, onChange, options, className = "", disabled = false }: { value: any, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string, disabled?: boolean }) => (
  <select 
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`w-full px-2 py-1 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''} ${className}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// MultiSelect Dropdown Component
const MultiSelect = ({ options, selected, onToggle, placeholder = "Select products..." }: { options: { name: string, id: string }[], selected: string[], onToggle: (name: string) => void, placeholder?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal text-left min-h-[30px]"
      >
        <div className="flex flex-wrap gap-1 items-center flex-1">
          {selected.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-600">{placeholder}</span>
          ) : (
            selected.map(item => (
              <span key={item} className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold">
                {item}
                <X size={10} className="cursor-pointer hover:text-indigo-900" onClick={(e) => { e.stopPropagation(); onToggle(item); }} />
              </span>
            ))
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-1">
            {options.length === 0 ? (
              <div className="p-3 text-center text-slate-400 italic text-[11px]">No options found</div>
            ) : (
              options.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => onToggle(opt.name)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${selected.includes(opt.name) ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  <span className="text-[12px]">{opt.name}</span>
                  {selected.includes(opt.name) && <Check size={14} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DealershipForm: React.FC<DealershipFormProps> = ({ initialData, onSubmit, onCancel, groups: initialGroups }) => {
  const isNew = !initialData?.id;
  const [groups, setGroups] = useState(initialGroups);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPP, setNewGroupPP] = useState('');
  const [newGroupERA, setNewGroupERA] = useState('');

  const { members: teamMembers } = useTeamMembers();
  const { items: providerProducts } = useProvidersProducts();

  // Filter lists from DB
  const crmProviders = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PROVIDER && i.provider_type === ProviderType.CRM), [providerProducts]);
  const websiteProviders = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PROVIDER && i.provider_type === ProviderType.WEBSITE), [providerProducts]);
  const inventoryProviders = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PROVIDER && i.provider_type === ProviderType.INVENTORY), [providerProducts]);
  const availableProducts = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PRODUCT), [providerProducts]);

  const [formData, setFormData] = useState<Partial<DealershipWithRelations>>(initialData || {
    status: DealershipStatus.DMT_PENDING,
    crm_provider: 'FOCUS',
    enterprise_group_id: '',
    products: [],
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

  const toggleProduct = (productName: string) => {
    const current = formData.products || [];
    if (current.includes(productName)) {
      updateField('products', current.filter(p => p !== productName));
    } else {
      updateField('products', [...current, productName]);
    }
  };

  const updateContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: { ...prev.contacts!, [field]: value } as any
    }));
  };

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
         description: 'Created via Dealership Form',
         pp_sys_id: newGroupPP,
         era_system_id: newGroupERA
      };
      const id = db.upsertEnterpriseGroup(newGroupData);
      const newGroup = { id, ...newGroupData, created_at: new Date().toISOString() };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isOnboardingUnlocked = (status: DealershipStatus) => {
    return [DealershipStatus.ONBOARDING, DealershipStatus.LIVE, DealershipStatus.LEGACY, DealershipStatus.CANCELLED].includes(status);
  };
  const isGoLiveUnlocked = (status: DealershipStatus) => {
    return [DealershipStatus.LIVE, DealershipStatus.LEGACY, DealershipStatus.CANCELLED].includes(status);
  };
  const isTermUnlocked = (status: DealershipStatus) => {
    return status === DealershipStatus.CANCELLED;
  };

  const salesMembers = teamMembers.filter(m => m.role === TeamRole.SALES);
  const enrollmentMembers = teamMembers.filter(m => m.role === TeamRole.ENROLLMENT);
  const csmMembers = teamMembers.filter(m => m.role === TeamRole.CSM);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel}></div>
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-colors">
        
        {/* Sticky Header - Identical to Detail Panel */}
        <div className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="p-4 flex justify-end items-center gap-2">
             <button 
                type="submit" 
                form="dealer-form" 
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-1"
             >
                <Save size={14} /> Save
             </button>
             <button 
                type="button"
                onClick={() => setFormData(initialData || {})} 
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
             >
                <RefreshCw size={16} />
             </button>
             <button type="button" onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={20} />
             </button>
          </div>

          <div className="px-8 pb-6 space-y-3">
             <div>
               <input 
                 value={formData.name || ''} 
                 onChange={(e) => updateField('name', e.target.value)} 
                 className="w-full text-xl font-bold py-2 border-b border-indigo-200 dark:border-indigo-800 outline-none focus:border-indigo-500 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                 placeholder="Dealership Name" 
                 required
               />
               {!isNew && <div className="text-[10px] uppercase font-bold text-indigo-500 mt-1">Editing Mode</div>}
             </div>

             <div>
               <Input 
                 value={formData.cif_number} 
                 onChange={(v) => updateField('cif_number', v)} 
                 className="font-mono text-[12px]" 
                 placeholder="CIF Number (e.g. CIF-12345)" 
               />
             </div>
          </div>
        </div>

        {/* Form Body - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-white dark:bg-slate-900 pb-20 custom-scrollbar transition-colors">
          <form id="dealer-form" onSubmit={handleSubmit} className="animate-in fade-in duration-500 space-y-6">
            
            {/* Status & Dates Row */}
            <div className="grid grid-cols-4 gap-6">
               <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                     value={formData.status}
                     onChange={(v) => updateField('status', v)}
                     options={Object.values(DealershipStatus).map(s => ({ label: s, value: s }))}
                  />
               </div>

               <div>
                  <Label>Onboarding Date</Label>
                  <Input 
                      type="date" 
                      value={formData.onboarding_date ? formData.onboarding_date.split('T')[0] : ''} 
                      onChange={(v) => updateField('onboarding_date', v)} 
                      className="dark:color-scheme-dark" 
                      disabled={!isOnboardingUnlocked(formData.status || DealershipStatus.DMT_PENDING)}
                      placeholder="Pending"
                  />
               </div>

               <div>
                  <Label>Go-Live Date</Label>
                  <Input 
                      type="date" 
                      value={formData.go_live_date ? formData.go_live_date.split('T')[0] : ''} 
                      onChange={(v) => updateField('go_live_date', v)} 
                      className="dark:color-scheme-dark" 
                      disabled={!isGoLiveUnlocked(formData.status || DealershipStatus.DMT_PENDING)}
                      placeholder="Pending"
                  />
               </div>

               <div>
                  <Label>Term Date</Label>
                  <Input 
                      type="date" 
                      value={formData.term_date ? formData.term_date.split('T')[0] : ''} 
                      onChange={(v) => updateField('term_date', v)} 
                      className="dark:color-scheme-dark" 
                      disabled={!isTermUnlocked(formData.status || DealershipStatus.DMT_PENDING)}
                      placeholder="N/A"
                  />
               </div>
            </div>

            {/* Hold Reason - Full Width Row */}
            {formData.status === DealershipStatus.HOLD && (
                <div className="animate-in fade-in slide-in-from-top-1 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-900">
                    <Label>Hold Reason</Label>
                    <textarea
                        value={formData.hold_reason || ''}
                        onChange={(e) => updateField('hold_reason', e.target.value)}
                        className="w-full px-2 py-1.5 text-[12px] border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-slate-800 dark:text-orange-100 placeholder:text-orange-300 min-h-[80px] resize-none"
                        placeholder="Please provide a reason for placing this dealership on hold..."
                    />
                </div>
            )}

            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mt-6">Account Details</h3>

            <div className="grid grid-cols-3 gap-6">
               <div className="min-w-0 col-span-2">
                  <Label>Enterprise Group</Label>
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
                          <button type="button" onClick={() => setIsAddingGroup(true)} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 text-left hover:underline">+ Add New Group</button>
                       </>
                     ) : (
                       <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[9px] font-bold text-indigo-800 dark:text-indigo-300">New Group</span>
                             <button type="button" onClick={() => setIsAddingGroup(false)} className="text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"><X size={12} /></button>
                          </div>
                          <div className="space-y-1">
                             <Input value={newGroupName} onChange={(v) => setNewGroupName(v)} placeholder="Name" />
                             <div className="grid grid-cols-2 gap-1">
                                <Input value={newGroupPP} onChange={(v) => setNewGroupPP(v)} placeholder="PP ID" className="font-mono text-[10px]" />
                                <Input value={newGroupERA} onChange={(v) => setNewGroupERA(v)} placeholder="ERA ID" className="font-mono text-[10px]" />
                             </div>
                             <button type="button" onClick={handleAddGroup} className="w-full text-[9px] bg-indigo-600 text-white rounded py-1 mt-1 font-bold">Create & Select</button>
                          </div>
                       </div>
                     )}
                  </div>
               </div>
               <div>
                  <Label>Store / Branch</Label>
                  <div className="flex gap-1">
                     <Input value={formData.store_number} onChange={(v) => updateField('store_number', v)} placeholder="Store #" className="font-mono" />
                     <Input value={formData.branch_number} onChange={(v) => updateField('branch_number', v)} placeholder="Branch #" className="font-mono" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div>
                  <Label>PP Sys ID</Label>
                  <Input value={formData.pp_sys_id} onChange={(v) => updateField('pp_sys_id', v)} placeholder="PP-###" className="font-mono" />
               </div>
               <div>
                  <Label>ERA ID</Label>
                  <Input value={formData.era_system_id} onChange={(v) => updateField('era_system_id', v)} placeholder="ERA-###" className="font-mono" />
               </div>
               <div>
                  <Label>BU ID</Label>
                  <Input value={formData.bu_id} onChange={(v) => updateField('bu_id', v)} placeholder="BU-###" className="font-mono" />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={formData.address_line1} onChange={(v) => updateField('address_line1', v)} placeholder="Street Address" required />
               </div>
               <div>
                  <Label>State</Label>
                  <Select 
                      value={formData.state} 
                      onChange={(v) => updateField('state', v)}
                      options={[{ label: 'Select State', value: '' }, ...STATES.map(s => ({ label: s, value: s }))]}
                  />
               </div>
            </div>

            {/* Providers Row */}
            <div className="grid grid-cols-4 gap-4">
               <div className="col-span-1">
                  <Label>CRM Provider</Label>
                  <Select 
                      value={formData.crm_provider}
                      onChange={(v) => updateField('crm_provider', v)}
                      options={[{ label: 'Select CRM', value: '' }, ...crmProviders.map(i => ({ label: i.name, value: i.name }))]}
                  />
               </div>
               <div className="col-span-1">
                  <Label>Website Provider</Label>
                  <Select 
                      value={formData.website_provider}
                      onChange={(v) => updateField('website_provider', v)}
                      options={[{ label: 'Select Website', value: '' }, ...websiteProviders.map(i => ({ label: i.name, value: i.name }))]}
                  />
               </div>
               <div className="col-span-1">
                  <Label>Inventory Provider</Label>
                  <Select 
                      value={formData.inventory_provider}
                      onChange={(v) => updateField('inventory_provider', v)}
                      options={[{ label: 'Select Inventory', value: '' }, ...inventoryProviders.map(i => ({ label: i.name, value: i.name }))]}
                  />
               </div>
               <div className="col-span-1">
                  <Label>SMS Activated</Label>
                  <div className="flex items-center h-[26px]">
                    <input 
                      type="checkbox" 
                      checked={!!formData.sms_activated} 
                      onChange={(e) => updateField('sms_activated', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
               </div>
            </div>

            {/* Internal Products Row - MultiSelect Dropdown */}
            <div className="w-full">
               <Label>Internal Products</Label>
               <MultiSelect 
                 options={availableProducts}
                 selected={formData.products || []}
                 onToggle={toggleProduct}
                 placeholder="Search or select internal products..."
               />
            </div>

            <hr className="border-slate-100 dark:border-slate-800 my-4" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Website Links</h3>
            
            <div className="space-y-2">
               {(formData.website_links || []).map((link, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-4 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                     <div>
                        <Label>Primary URL</Label>
                        <Input value={link.primary_url} onChange={(v) => updateWebsite(idx, 'primary_url', v)} placeholder="https://..." />
                     </div>
                     <div className="flex gap-2">
                        <div className="flex-1">
                           <Label>Client ID</Label>
                           <Input value={link.client_id} onChange={(v) => updateWebsite(idx, 'client_id', v)} placeholder="ID" className="font-mono" />
                        </div>
                        {formData.website_links!.length > 1 && (
                           <button type="button" onClick={() => removeWebsite(idx)} className="mt-4 text-slate-400 hover:text-red-500"><Minus size={14} /></button>
                        )}
                     </div>
                  </div>
               ))}
               <button type="button" onClick={addWebsite} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg w-fit border border-indigo-100 dark:border-indigo-800">
                 <Plus size={12} /> Add New Website
               </button>
            </div>

            <hr className="border-slate-100 dark:border-slate-800 my-4" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Contacts</h3>

            <div className="grid grid-cols-3 gap-4">
               <div>
                  <Label>Sales Associate</Label>
                  <Select 
                      value={formData.contacts?.sales_contact_name || ''} 
                      onChange={(v) => updateContact('sales_contact_name', v)}
                      options={[{ label: 'Select Team Member', value: '' }, ...salesMembers.map(m => ({ label: m.name, value: m.name }))]}
                  />
               </div>
               <div>
                  <Label>Enrollment Specialist</Label>
                  <Select 
                      value={formData.contacts?.enrollment_contact_name || ''} 
                      onChange={(v) => updateContact('enrollment_contact_name', v)}
                      options={[{ label: 'Select Team Member', value: '' }, ...enrollmentMembers.map(m => ({ label: m.name, value: m.name }))]}
                  />
               </div>
               <div>
                  <Label>CSM Specialist</Label>
                  <Select 
                      value={formData.contacts?.assigned_specialist_name || ''} 
                      onChange={(v) => updateContact('assigned_specialist_name', v)}
                      options={[{ label: 'Select Team Member', value: '' }, ...csmMembers.map(m => ({ label: m.name, value: m.name }))]}
                  />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div>
                  <Label>POC Name</Label>
                  <Input value={formData.contacts?.poc_name} onChange={(v) => updateContact('poc_name', v)} placeholder="Contact Name" />
               </div>
               <div>
                  <Label>POC Email</Label>
                  <Input value={formData.contacts?.poc_email} onChange={(v) => updateContact('poc_email', v)} placeholder="email@domain.com" />
               </div>
               <div>
                  <Label>POC Phone</Label>
                  <input 
                    value={formData.contacts?.poc_phone || ''}
                    onChange={(e) => updateContact('poc_phone', e.target.value)}
                    onBlur={(e) => updateContact('poc_phone', formatPhone(e.target.value))}
                    placeholder="(###) ###-####"
                    className="w-full px-2 py-1 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal"
                  />
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800 my-4" />
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">DMT Order Section</h3>

            <div className="space-y-6">
               {formData.orders?.map((order, orderIdx) => (
                  <div key={orderIdx} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 relative">
                     <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                           <Label>Received Date</Label>
                           <Input type="date" value={order.received_date ? order.received_date.split('T')[0] : ''} onChange={(v) => updateOrder(orderIdx, 'received_date', v)} className="dark:color-scheme-dark" />
                        </div>
                        <div>
                           <Label>Order Number</Label>
                           <Input value={order.order_number} onChange={(v) => updateOrder(orderIdx, 'order_number', v)} placeholder="ORD-#####" className="font-bold font-mono" />
                        </div>
                     </div>

                     <div className="space-y-3">
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
                              <button type="button" onClick={() => removeProductFromOrder(orderIdx, prodIdx)} className="text-slate-300 hover:text-red-500"><Minus size={14} /></button>
                           </div>
                        ))}
                        <button type="button" onClick={() => addProductToOrder(orderIdx)} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider mt-2">
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
