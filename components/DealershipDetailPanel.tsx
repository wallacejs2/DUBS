

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, Plus, Minus, Check, ArrowLeft, FileSpreadsheet, Star, ChevronDown, ExternalLink
} from 'lucide-react';
import { 
  DealershipWithRelations, 
  DealershipStatus, EnterpriseGroup, CRMProvider, ProductCode, OrderStatus, Order, TeamRole,
  ProviderProductCategory, ProviderType
} from '../types';
import { db } from '../db';
import { useTeamMembers, useProvidersProducts } from '../hooks';

interface DealershipDetailPanelProps {
  dealership: DealershipWithRelations;
  groups: EnterpriseGroup[];
  onClose: () => void;
  onUpdate: (data: Partial<DealershipWithRelations>) => void;
  onDelete: () => void;
  onBack?: () => void;
  onToggleFavorite?: () => void;
  onViewEnterpriseGroup?: (id: string) => void;
  onViewProviderProduct?: (id: string) => void;
  onViewTeamMember?: (id: string) => void;
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

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

const DataValue = ({ value, mono = false, children, onClick, interactive = false }: { value?: any, mono?: boolean, children?: React.ReactNode, onClick?: () => void, interactive?: boolean }) => {
  const content = children || value || '---';
  const baseClasses = `text-[12px] font-normal leading-tight min-h-[1.2em] ${mono ? 'font-mono' : ''}`;
  
  if (onClick || interactive) {
    return (
      <button 
        onClick={onClick}
        disabled={!onClick}
        className={`${baseClasses} text-indigo-600 dark:text-indigo-400 hover:underline text-left group flex items-center gap-1 transition-colors`}
      >
        {content}
        {onClick && <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} text-slate-700 dark:text-slate-300`}>
      {content}
    </div>
  );
};

const Input = ({ value, onChange, type = "text", className = "", placeholder="", disabled = false, required = false, onBlur }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string, disabled?: boolean, required?: boolean, onBlur?: (e: any) => void }) => (
  <input 
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
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

const DealershipDetailPanel: React.FC<DealershipDetailPanelProps> = ({ 
  dealership, groups: initialGroups, onClose, onUpdate, onDelete, onBack, onToggleFavorite,
  onViewEnterpriseGroup, onViewProviderProduct, onViewTeamMember
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DealershipWithRelations>(dealership);
  const [groups, setGroups] = useState(initialGroups);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPP, setNewGroupPP] = useState('');
  const [newGroupERA, setNewGroupERA] = useState('');

  const { members: teamMembers } = useTeamMembers();
  const { items: providerProducts } = useProvidersProducts();

  // Find IDs helpers
  const findProviderId = (name?: string) => providerProducts.find(p => p.name === name)?.id;
  const findMemberId = (name?: string) => teamMembers.find(m => m.name === name)?.id;

  // Filter provider lists
  const crmProviders = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PROVIDER && i.provider_type === ProviderType.CRM), [providerProducts]);
  const websiteProviders = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PROVIDER && i.provider_type === ProviderType.WEBSITE), [providerProducts]);
  const inventoryProviders = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PROVIDER && i.provider_type === ProviderType.INVENTORY), [providerProducts]);
  const availableProducts = useMemo(() => providerProducts.filter(i => i.category === ProviderProductCategory.PRODUCT), [providerProducts]);

  const salesMembers = teamMembers.filter(m => m.role === TeamRole.SALES);
  const enrollmentMembers = teamMembers.filter(m => m.role === TeamRole.ENROLLMENT);
  const csmMembers = teamMembers.filter(m => m.role === TeamRole.CSM);

  useEffect(() => {
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
      orders: initialOrders,
      products: dealership.products || []
    });
  }, [dealership]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
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
      orders: initialOrders,
      products: dealership.products || []
    });
    setIsEditing(false);
  };

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
         description: 'Added via Detail Panel',
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

  const handleCopyCSV = () => {
    // ... same logic ...
    const d = formData;
    const groupName = groups.find(g => g.id === d.enterprise_group_id)?.name || 'Independent';
    const productCodes = Object.values(ProductCode);
    const flatData: any[] = [];
    const baseInfo: any = {
         Status: d.status,
         Hold_Reason: d.hold_reason || '',
         CIF: d.cif_number || '',
         Name: d.name,
         Group: groupName,
         Store: d.store_number || '',
         Branch: d.branch_number || '',
         PP_ID: d.pp_sys_id || '',
         ERA_ID: d.era_system_id || '',
         BU_ID: d.bu_id || '',
         Address: d.address_line1 || '',
         State: d.state || '',
         CRM: d.crm_provider,
         Sales_Contact: d.contacts?.sales_contact_name || '',
         Enrollment_Contact: d.contacts?.enrollment_contact_name || '',
         CSM: d.contacts?.assigned_specialist_name || '',
         POC_Name: d.contacts?.poc_name || '',
         POC_Email: d.contacts?.poc_email || '',
         POC_Phone: d.contacts?.poc_phone || '',
         Onboarding_Date: d.onboarding_date || '',
         Go_Live_Date: d.go_live_date || '',
         Term_Date: d.term_date || '',
    };
    const links = d.website_links || [];
    for (let i = 0; i < 4; i++) {
        const link = links[i];
        baseInfo[`clientID${i+1}`] = link ? link.client_id || '' : '';
        baseInfo[`websiteLink${i+1}`] = link ? link.primary_url || '' : '';
    }
    if (d.orders && d.orders.length > 0) {
        const sortedOrders = [...d.orders].sort((a,b) => (a.received_date || '').localeCompare(b.received_date || ''));
        sortedOrders.forEach(o => {
            const row: any = {
                ...baseInfo,
                Received_Date: o.received_date,
                Order_Number: o.order_number,
            };
            productCodes.forEach(code => row[code] = '');
            if (o.products && o.products.length > 0) {
                o.products.forEach(p => {
                    if (productCodes.includes(p.product_code)) {
                        row[p.product_code] = p.amount;
                    }
                });
            }
            flatData.push(row);
        });
    } else {
        const row: any = {
            ...baseInfo,
            Received_Date: '',
            Order_Number: '',
        };
        productCodes.forEach(code => row[code] = '');
        flatData.push(row);
    }
    const columns = [
      'Status', 'Hold_Reason', 'CIF', 'Name', 'Group', 'Store', 'Branch', 
      'PP_ID', 'ERA_ID', 'BU_ID', 'Address', 'State', 'CRM', 
      'Sales_Contact', 'Enrollment_Contact', 'CSM', 'POC_Name', 'POC_Email', 'POC_Phone', 
      'Received_Date', 'Order_Number', 'Onboarding_Date', 'Go_Live_Date', 'Term_Date',
      ...productCodes,
      'clientID1', 'websiteLink1', 'clientID2', 'websiteLink2', 
      'clientID3', 'websiteLink3', 'clientID4', 'websiteLink4'
    ];
    const csvContent = flatData.map(row => columns.map(col => {
          const val = row[col];
          const stringVal = String(val === undefined || val === null ? '' : val);
          if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
              return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
      }).join(',')).join('\n');
    navigator.clipboard.writeText(csvContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
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
    if (!dateStr) return null;
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
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

  const isOnboardingUnlocked = (status: DealershipStatus) => [DealershipStatus.ONBOARDING, DealershipStatus.LIVE, DealershipStatus.LEGACY, DealershipStatus.CANCELLED].includes(status);
  const isGoLiveUnlocked = (status: DealershipStatus) => [DealershipStatus.LIVE, DealershipStatus.LEGACY, DealershipStatus.CANCELLED].includes(status);
  const isTermUnlocked = (status: DealershipStatus) => status === DealershipStatus.CANCELLED;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-colors">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="p-4 flex justify-between items-center gap-2">
             <div className="flex items-center gap-2">
               {onBack && (
                  <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-all mr-2">
                    <ArrowLeft size={20} />
                  </button>
               )}
               {isEditing && (
                 <div className="flex flex-col">
                   <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Dealership</h2>
                   <p className="text-xs text-slate-500">Update details for {dealership.name}</p>
                 </div>
               )}
             </div>

             <div className="flex items-center gap-2">
               {isEditing ? (
                 <>
                   <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-1">
                     <Save size={14} /> Save
                   </button>
                   <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><RefreshCw size={16} /></button>
                 </>
               ) : (
                 <>
                   {onToggleFavorite && (
                      <button 
                        onClick={onToggleFavorite}
                        className={`p-1.5 rounded-lg mr-1 transition-all ${dealership.is_favorite ? 'text-amber-400 hover:text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        title={dealership.is_favorite ? "Unfavorite" : "Favorite"}
                      >
                         <Star size={16} fill={dealership.is_favorite ? "currentColor" : "none"} />
                      </button>
                   )}
                   <button 
                     onClick={handleCopyCSV} 
                     className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg mr-1" 
                     title="Copy CSV Row"
                   >
                     {isCopied ? <Check size={16} className="text-emerald-500" /> : <FileSpreadsheet size={16} />}
                   </button>
                   <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1">
                      <Edit3 size={14} /> Edit
                   </button>
                 </>
               )}
               {!isEditing && (
                 <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16} /></button>
               )}
               <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20} /></button>
             </div>
          </div>

          {!isEditing && (
            <div className="px-8 pb-6 space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{dealership.name}</h2>
                <div className="text-[12px] font-mono text-slate-500 dark:text-slate-400">{dealership.cif_number || '---'}</div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white dark:bg-slate-900 pb-20 custom-scrollbar transition-colors">
          <div className="animate-in fade-in duration-500 space-y-8">
            
            {/* Core Info */}
            <div className="space-y-6">
                <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Core Information</h3>
                
                {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Dealership Name</Label>
                            <Input 
                                value={formData.name} 
                                onChange={(v) => updateField('name', v)} 
                                placeholder="Dealership Name"
                                required
                            />
                        </div>
                        <div>
                            <Label>CIF Number</Label>
                            <Input 
                                value={formData.cif_number} 
                                onChange={(v) => updateField('cif_number', v)} 
                                placeholder="CIF Number"
                            />
                        </div>
                    </div>
                ) : null}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <Label>Onboarding</Label>
                        {isEditing ? (
                            <Input 
                                type="date"
                                value={formatDateInput(formData.onboarding_date)}
                                onChange={(v) => updateField('onboarding_date', v)}
                                disabled={!isOnboardingUnlocked(formData.status)}
                                className="dark:color-scheme-dark"
                            />
                        ) : (
                            <DataValue value={formatDate(dealership.onboarding_date) || 'Pending'} />
                        )}
                    </div>
                    <div>
                        <Label>Go-Live</Label>
                        {isEditing ? (
                            <Input 
                                type="date"
                                value={formatDateInput(formData.go_live_date)}
                                onChange={(v) => updateField('go_live_date', v)}
                                disabled={!isGoLiveUnlocked(formData.status)}
                                className="dark:color-scheme-dark"
                            />
                        ) : (
                            <DataValue value={formatDate(dealership.go_live_date) || 'Pending'} />
                        )}
                    </div>
                    <div>
                        <Label>Term Date</Label>
                        {isEditing ? (
                            <Input 
                                type="date"
                                value={formatDateInput(formData.term_date)}
                                onChange={(v) => updateField('term_date', v)}
                                disabled={!isTermUnlocked(formData.status)}
                                className="dark:color-scheme-dark"
                            />
                        ) : (
                            <DataValue value={dealership.status === DealershipStatus.CANCELLED ? (formatDate(dealership.term_date) || 'N/A') : 'N/A'} />
                        )}
                    </div>
                </div>

                {formData.status === DealershipStatus.HOLD && (
                    <div className="animate-in fade-in slide-in-from-top-1 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-900">
                        <Label>Reason for Hold</Label>
                        {isEditing ? (
                            <textarea
                                value={formData.hold_reason || ''}
                                onChange={(e) => updateField('hold_reason', e.target.value)}
                                className="w-full px-2 py-1.5 text-[12px] border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-slate-800 dark:text-orange-100 placeholder:text-orange-300 min-h-[80px] resize-none"
                                placeholder="Reason for hold..."
                            />
                        ) : (
                            <div className="text-[12px] text-slate-800 dark:text-orange-100 italic leading-relaxed">
                                {formData.hold_reason || 'No reason specified'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Enterprise & IDs */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Enterprise & Identifiers</h3>
                    {isEditing && !isAddingGroup && (
                        <button type="button" onClick={() => setIsAddingGroup(true)} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">+ New Group</button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isAddingGroup ? (
                        <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Create New Enterprise Group</span>
                                <button type="button" onClick={() => setIsAddingGroup(false)} className="text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"><X size={14} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-3">
                                    <Label>Group Name</Label>
                                    <Input value={newGroupName} onChange={(v) => setNewGroupName(v)} placeholder="Name" />
                                </div>
                                <div>
                                    <Label>PP Sys ID</Label>
                                    <Input value={newGroupPP} onChange={(v) => setNewGroupPP(v)} placeholder="PP ID" />
                                </div>
                                <div>
                                    <Label>ERA ID</Label>
                                    <Input value={newGroupERA} onChange={(v) => setNewGroupERA(v)} placeholder="ERA ID" />
                                </div>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddGroup} className="h-[26px] w-full bg-indigo-600 text-white rounded-lg font-bold text-[10px] hover:bg-indigo-700 transition-all shadow-md">
                                        Create & Select
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Label>Enterprise Group</Label>
                            {isEditing ? (
                                <Select 
                                    value={formData.enterprise_group_id}
                                    onChange={(v) => handleGroupSelect(v)}
                                    options={[
                                        { label: 'Single (Independent)', value: '' },
                                        ...groups.map(g => ({ label: g.name, value: g.id }))
                                    ]}
                                />
                            ) : (
                                <DataValue 
                                    value={dealership.enterprise_group?.name || 'Single (Independent)'} 
                                    onClick={dealership.enterprise_group_id && onViewEnterpriseGroup ? () => onViewEnterpriseGroup(dealership.enterprise_group_id!) : undefined}
                                />
                            )}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Store #</Label>
                            {isEditing ? (
                                <Input value={formData.store_number} onChange={(v) => updateField('store_number', v)} placeholder="#" />
                            ) : (
                                <DataValue mono value={dealership.store_number} />
                            )}
                        </div>
                        <div>
                            <Label>Branch #</Label>
                            {isEditing ? (
                                <Input value={formData.branch_number} onChange={(v) => updateField('branch_number', v)} placeholder="#" />
                            ) : (
                                <DataValue mono value={dealership.branch_number} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label>PP Sys ID</Label>
                        {isEditing ? <Input value={formData.pp_sys_id} onChange={(v) => updateField('pp_sys_id', v)} placeholder="PP-###" /> : <DataValue mono value={dealership.pp_sys_id} />}
                    </div>
                    <div>
                        <Label>ERA ID</Label>
                        {isEditing ? <Input value={formData.era_system_id} onChange={(v) => updateField('era_system_id', v)} placeholder="ERA-###" /> : <DataValue mono value={dealership.era_system_id} />}
                    </div>
                    <div>
                        <Label>BU ID</Label>
                        {isEditing ? <Input value={formData.bu_id} onChange={(v) => updateField('bu_id', v)} placeholder="BU-###" /> : <DataValue mono value={dealership.bu_id} />}
                    </div>
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Location & Providers */}
            <div className="space-y-6">
                <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Location & Providers</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <Label>Address</Label>
                        {isEditing ? (
                            <Input value={formData.address_line1} onChange={(v) => updateField('address_line1', v)} placeholder="Street Address" required />
                        ) : (
                            <DataValue value={dealership.address_line1} />
                        )}
                    </div>
                    <div>
                        <Label>State</Label>
                        {isEditing ? (
                            <Select 
                                value={formData.state} 
                                onChange={(v) => updateField('state', v)}
                                options={STATES.map(s => ({ label: s, value: s }))}
                            />
                        ) : (
                            <DataValue value={dealership.state} />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>CRM Provider</Label>
                        {isEditing ? (
                            <Select 
                                value={formData.crm_provider}
                                onChange={(v) => updateField('crm_provider', v)}
                                options={crmProviders.map(i => ({ label: i.name, value: i.name }))}
                            />
                        ) : (
                            <DataValue 
                                value={dealership.crm_provider} 
                                onClick={() => {
                                    const id = findProviderId(dealership.crm_provider);
                                    if (id && onViewProviderProduct) onViewProviderProduct(id);
                                }}
                            />
                        )}
                    </div>
                    <div>
                        <Label>Website Provider</Label>
                        {isEditing ? (
                            <Select 
                                value={formData.website_provider}
                                onChange={(v) => updateField('website_provider', v)}
                                options={websiteProviders.map(i => ({ label: i.name, value: i.name }))}
                            />
                        ) : (
                            <DataValue 
                                value={dealership.website_provider} 
                                onClick={() => {
                                    const id = findProviderId(dealership.website_provider);
                                    if (id && onViewProviderProduct) onViewProviderProduct(id);
                                }}
                            />
                        )}
                    </div>
                    <div>
                        <Label>Inventory Provider</Label>
                        {isEditing ? (
                            <Select 
                                value={formData.inventory_provider}
                                onChange={(v) => updateField('inventory_provider', v)}
                                options={inventoryProviders.map(i => ({ label: i.name, value: i.name }))}
                            />
                        ) : (
                            <DataValue 
                                value={dealership.inventory_provider} 
                                onClick={() => {
                                    const id = findProviderId(dealership.inventory_provider);
                                    if (id && onViewProviderProduct) onViewProviderProduct(id);
                                }}
                            />
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <input 
                        type="checkbox" 
                        id="sms_active"
                        checked={!!formData.sms_activated} 
                        onChange={(e) => updateField('sms_activated', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="sms_active" className="text-[12px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            SMS Services Activated
                        </label>
                    </div>
                ) : (
                    <div>
                        <Label>SMS Activated</Label>
                        <DataValue value={dealership.sms_activated ? 'Yes' : 'No'} />
                    </div>
                )}

                <div>
                    <Label>Internal Products</Label>
                    {isEditing ? (
                        <MultiSelect 
                            options={availableProducts}
                            selected={formData.products || []}
                            onToggle={toggleProduct}
                            placeholder="Internal Products"
                        />
                    ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {(dealership.products || []).length === 0 ? (
                                <DataValue value="No products selected" />
                            ) : (
                                dealership.products?.map((p, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => {
                                        const id = findProviderId(p);
                                        if (id && onViewProviderProduct) onViewProviderProduct(id);
                                    }}
                                    className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors flex items-center gap-1"
                                >
                                    {p}
                                    <ExternalLink size={8} />
                                </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Websites */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Websites</h3>
                    {isEditing && (
                        <button type="button" onClick={addWebsite} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                            <Plus size={12} /> Add URL
                        </button>
                    )}
                </div>
                
                {(isEditing ? (formData.website_links || []) : (dealership.website_links || [])).map((link, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div>
                            <Label>Primary URL</Label>
                            {isEditing ? (
                                <Input value={link.primary_url} onChange={(v) => updateWebsite(idx, 'primary_url', v)} placeholder="https://..." />
                            ) : (
                                <a href={link.primary_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline truncate block">{link.primary_url}</a>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label>Client ID</Label>
                                {isEditing ? (
                                    <Input value={link.client_id} onChange={(v) => updateWebsite(idx, 'client_id', v)} placeholder="ID" />
                                ) : (
                                    <div className="text-[12px] font-mono text-slate-500 dark:text-slate-400">{link.client_id || '---'}</div>
                                )}
                            </div>
                            {isEditing && formData.website_links!.length > 1 && (
                               <button type="button" onClick={() => removeWebsite(idx)} className="mt-4 text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Contacts */}
            <div className="space-y-6">
                <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Team Assignment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Sales Rep</Label>
                        {isEditing ? (
                            <Select 
                                value={formData.contacts?.sales_contact_name}
                                onChange={(v) => updateContact('sales_contact_name', v)}
                                options={[{ label: 'Select', value: '' }, ...salesMembers.map(m => ({ label: m.name, value: m.name }))]}
                            />
                        ) : (
                            <DataValue 
                                value={dealership.contacts?.sales_contact_name} 
                                onClick={() => {
                                const id = findMemberId(dealership.contacts?.sales_contact_name);
                                if (id && onViewTeamMember) onViewTeamMember(id);
                                }}
                            />
                        )}
                    </div>
                    <div>
                        <Label>Enrollment Specialist</Label>
                        {isEditing ? (
                            <Select 
                                value={formData.contacts?.enrollment_contact_name}
                                onChange={(v) => updateContact('enrollment_contact_name', v)}
                                options={[{ label: 'Select', value: '' }, ...enrollmentMembers.map(m => ({ label: m.name, value: m.name }))]}
                            />
                        ) : (
                            <DataValue 
                                value={dealership.contacts?.enrollment_contact_name} 
                                onClick={() => {
                                const id = findMemberId(dealership.contacts?.enrollment_contact_name);
                                if (id && onViewTeamMember) onViewTeamMember(id);
                                }}
                            />
                        )}
                    </div>
                    <div>
                        <Label>CSM Specialist</Label>
                        {isEditing ? (
                            <Select 
                                value={formData.contacts?.assigned_specialist_name}
                                onChange={(v) => updateContact('assigned_specialist_name', v)}
                                options={[{ label: 'Select', value: '' }, ...csmMembers.map(m => ({ label: m.name, value: m.name }))]}
                            />
                        ) : (
                            <DataValue 
                                value={dealership.contacts?.assigned_specialist_name} 
                                onClick={() => {
                                const id = findMemberId(dealership.contacts?.assigned_specialist_name);
                                if (id && onViewTeamMember) onViewTeamMember(id);
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Point of Contact (Dealership Side)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>POC Name</Label>
                            {isEditing ? <Input value={formData.contacts?.poc_name} onChange={(v) => updateContact('poc_name', v)} /> : <DataValue value={dealership.contacts?.poc_name} />}
                        </div>
                        <div>
                            <Label>POC Email</Label>
                            {isEditing ? <Input value={formData.contacts?.poc_email} onChange={(v) => updateContact('poc_email', v)} type="email" /> : <a href={`mailto:${dealership.contacts?.poc_email}`} className="text-[12px] text-indigo-600 dark:text-indigo-400 underline truncate block">{dealership.contacts?.poc_email || '---'}</a>}
                        </div>
                        <div>
                            <Label>POC Phone</Label>
                            {isEditing ? (
                                <Input 
                                    value={formData.contacts?.poc_phone} 
                                    onChange={(v) => updateContact('poc_phone', v)}
                                    onBlur={(e) => updateContact('poc_phone', formatPhone(e.target.value))}
                                    type="tel"
                                    placeholder="(###) ###-####"
                                />
                            ) : (
                                <DataValue value={dealership.contacts?.poc_phone} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* DMT Orders */}
            <div className="space-y-6">
               <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">DMT Orders</h3>
               
               {(isEditing ? (formData.orders || []) : (dealership.orders || [])).map((order, orderIdx) => (
                  <div key={orderIdx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Received Date</Label>
                            {isEditing ? (
                                <Input 
                                    type="date" 
                                    value={formatDateInput(order.received_date)} 
                                    onChange={(v) => updateOrder(orderIdx, 'received_date', v)} 
                                    className="dark:color-scheme-dark"
                                />
                            ) : (
                                <DataValue value={formatDate(order.received_date)} />
                            )}
                        </div>
                        <div>
                            <Label>Order Number</Label>
                            {isEditing ? (
                                <Input 
                                    value={order.order_number} 
                                    onChange={(v) => updateOrder(orderIdx, 'order_number', v)} 
                                />
                            ) : (
                                <DataValue mono value={order.order_number} />
                            )}
                        </div>
                     </div>

                     <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Line Items</span>
                           {isEditing && (
                               <button type="button" onClick={() => addProductToOrder(orderIdx)} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                 <Plus size={10} /> Add Product
                               </button>
                           )}
                        </div>
                        
                        {isEditing && (
                            <div className="grid grid-cols-[1fr_120px_auto] gap-3 mb-1 px-1">
                                <Label>Product</Label>
                                <Label>Price ($)</Label>
                            </div>
                        )}

                        {order.products?.map((product, prodIdx) => (
                           <div key={prodIdx} className={`grid ${isEditing ? 'grid-cols-[1fr_120px_auto]' : 'grid-cols-[1fr_auto]'} gap-3 items-center`}>
                              {isEditing ? (
                                <>
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
                                  <button type="button" onClick={() => removeProductFromOrder(orderIdx, prodIdx)} className="text-slate-300 hover:text-red-500 p-1"><Minus size={14} /></button>
                                </>
                              ) : (
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 w-full col-span-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{product.product_code}</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">${Number(product.amount).toLocaleString()}</span>
                                </div>
                              )}
                           </div>
                        ))}
                        {(!order.products || order.products.length === 0) && (
                            <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">No products added to this order.</div>
                        )}
                     </div>
                  </div>
               ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipDetailPanel;
