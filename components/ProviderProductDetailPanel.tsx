
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, 
  Package, Mail, Phone, Hash, Building2, Globe, ArrowRight, ExternalLink, ArrowLeft
} from 'lucide-react';
import { 
  ProviderProduct, ProviderProductCategory, ProviderType, 
  DealershipStatus, Dealership 
} from '../types';
import { useDealerships, useOrders } from '../hooks';

interface ProviderProductDetailPanelProps {
  item: Partial<ProviderProduct>;
  onClose: () => void;
  onUpdate: (data: Partial<ProviderProduct>) => void;
  onDelete: () => void;
  onBack?: () => void;
}

const categoryColors: Record<ProviderProductCategory, string> = {
  [ProviderProductCategory.PROVIDER]: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [ProviderProductCategory.PRODUCT]: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
};

const statusColors: Record<DealershipStatus, string> = {
  [DealershipStatus.DMT_PENDING]: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  [DealershipStatus.DMT_APPROVED]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [DealershipStatus.HOLD]: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [DealershipStatus.ONBOARDING]: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  [DealershipStatus.LIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  [DealershipStatus.LEGACY]: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  [DealershipStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

const Label = ({ children, icon: Icon }: { children?: React.ReactNode, icon?: any }) => (
  <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
    {Icon && <Icon size={10} />}
    {children}
  </label>
);

const DataValue = ({ value, mono = false, children }: { value?: any, mono?: boolean, children?: React.ReactNode }) => (
  <div className={`text-[12px] font-normal text-slate-700 dark:text-slate-300 leading-tight min-h-[1.5em] flex items-center ${mono ? 'font-mono' : ''}`}>
    {children || value || '---'}
  </div>
);

const Input = ({ value, onChange, type = "text", className = "", placeholder="" }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string }) => (
  <input 
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${className}`}
  />
);

const Select = ({ value, onChange, options, className = "" }: { value: any, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string }) => (
  <select 
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal transition-all ${className}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const ProviderProductDetailPanel: React.FC<ProviderProductDetailPanelProps> = ({ 
  item, onClose, onUpdate, onDelete, onBack
}) => {
  const isNew = !item.id;
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState<Partial<ProviderProduct>>(item);
  
  const { dealerships } = useDealerships();
  const { orders } = useOrders();

  // Find linked dealerships, including CANCELLED for history
  const linkedDealerships = useMemo(() => {
    if (!item.name || isNew) return [];
    
    if (item.category === ProviderProductCategory.PROVIDER) {
        return dealerships.filter(d => {
            if (item.provider_type === ProviderType.CRM) return d.crm_provider === item.name;
            if (item.provider_type === ProviderType.WEBSITE) return d.website_provider === item.name;
            if (item.provider_type === ProviderType.INVENTORY) return d.inventory_provider === item.name;
            return d.crm_provider === item.name || d.website_provider === item.name || d.inventory_provider === item.name;
        });
    } else {
        // Product matching: check BOTH selected internal products array AND orders
        return dealerships.filter(d => {
            // 1. Check if selected in Dealership Details Panel
            const isSelectedInDetails = d.products?.includes(item.name as string);
            
            // 2. Check if present in any of their orders
            const isPresentInOrders = orders.some(o => 
                o.dealership_id === d.id && 
                o.products?.some(p => p.product_code === item.name)
            );
            
            return isSelectedInDetails || isPresentInOrders;
        });
    }
  }, [dealerships, orders, item.name, item.category, item.provider_type, isNew]);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleSave = () => {
    onUpdate(formData);
    if (isNew) {
      onClose();
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (isNew) {
      onClose();
    } else {
      setFormData(item);
      setIsEditing(false);
    }
  };

  const updateField = (field: keyof ProviderProduct, value: any) => {
    if (field === 'category') {
      if (value === ProviderProductCategory.PRODUCT) {
        // Clear provider type when switching to Product
        setFormData(prev => ({ ...prev, category: value as ProviderProductCategory, provider_type: undefined }));
      } else if (value === ProviderProductCategory.PROVIDER) {
        // Default to CRM if none selected when switching back to Provider
        setFormData(prev => ({ ...prev, category: value as ProviderProductCategory, provider_type: prev.provider_type || ProviderType.CRM }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const formatPhone = (val?: string) => {
    if (!val) return '';
    const cleaned = ('' + val).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return val;
  };

  const isProvider = (formData.category || item.category) === ProviderProductCategory.PROVIDER;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing && isNew ? undefined : onClose}></div>
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-colors">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="p-4 flex justify-between items-center gap-4">
             <div className="flex items-center gap-3">
               {onBack && (
                  <button 
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-all"
                    title="Go Back"
                  >
                    <ArrowLeft size={20} />
                  </button>
               )}
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isNew ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                 <Package size={20} />
               </div>
               <div>
                 {isEditing ? (
                   <div className="w-full">
                     <Input 
                       value={formData.name} 
                       onChange={(v) => updateField('name', v)} 
                       placeholder="Item Name (CDK, FOCUS, etc)" 
                       className="font-bold text-lg" 
                     />
                   </div>
                 ) : (
                   <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formData.name}</h2>
                 )}
                 {!isEditing && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formData.category}</p>}
               </div>
             </div>

             <div className="flex items-center gap-2">
               {isEditing ? (
                 <>
                   <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-100 flex items-center gap-2 transition-all">
                     <Save size={14} /> Save
                   </button>
                   <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"><RefreshCw size={16} /></button>
                 </>
               ) : (
                 <button onClick={() => setIsEditing(true)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all">
                    <Edit3 size={14} /> Edit
                 </button>
               )}
               {!isNew && (
                 <button onClick={onDelete} className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 size={18} /></button>
               )}
               <button onClick={onClose} className="p-2 text-slate-300 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"><X size={20} /></button>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900 custom-scrollbar transition-colors">
          <div className="space-y-6">
            
            {/* Category & Type Section */}
            <div className={`grid ${isProvider ? 'grid-cols-2' : 'grid-cols-1'} gap-4 transition-all duration-200`}>
               <div>
                  <Label>Category</Label>
                  {isEditing ? (
                    <Select 
                       value={formData.category || ProviderProductCategory.PROVIDER}
                       onChange={(v) => updateField('category', v as ProviderProductCategory)}
                       options={Object.values(ProviderProductCategory).map(s => ({ label: s, value: s }))}
                    />
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${categoryColors[formData.category || ProviderProductCategory.PROVIDER]}`}>
                      {formData.category}
                    </span>
                  )}
               </div>
               
               {isProvider && (
                   <div className="animate-in fade-in zoom-in-95 duration-200">
                    <Label>Provider Type</Label>
                    {isEditing ? (
                        <Select 
                        value={formData.provider_type || ProviderType.CRM}
                        onChange={(v) => updateField('provider_type', v as ProviderType)}
                        options={Object.values(ProviderType).map(s => ({ label: s, value: s }))}
                        />
                    ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                        {formData.provider_type || 'Multiple/Other'}
                        </span>
                    )}
                   </div>
               )}
            </div>

            {/* Support Info */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3">Support Information</h3>
              <div className="space-y-4">
                <div>
                  <Label icon={Mail}>Support Email</Label>
                  {isEditing ? (
                    <Input type="email" value={formData.support_email} onChange={(v) => updateField('support_email', v)} placeholder="support@company.com" />
                  ) : (
                    <DataValue>
                      <a href={`mailto:${formData.support_email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{formData.support_email}</a>
                    </DataValue>
                  )}
                </div>
                <div>
                  <Label icon={Phone}>Support Phone</Label>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={formData.support_phone || ''}
                      onChange={(e) => updateField('support_phone', e.target.value)}
                      onBlur={(e) => updateField('support_phone', formatPhone(e.target.value))}
                      placeholder="(###) ###-####"
                      className="w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal transition-all"
                    />
                  ) : (
                    <DataValue value={formatPhone(formData.support_phone)} />
                  )}
                </div>
                <div>
                  <Label icon={Globe}>Support Portal / Link</Label>
                  {isEditing ? (
                    <Input value={formData.support_link} onChange={(v) => updateField('support_link', v)} placeholder="https://..." />
                  ) : (
                    <DataValue>
                      {formData.support_link ? (
                        <a href={formData.support_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                          {formData.support_link} <ExternalLink size={12} />
                        </a>
                      ) : '---'}
                    </DataValue>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               <Label>Notes / Internal Documentation</Label>
               {isEditing ? (
                   <textarea 
                     value={formData.notes || ''}
                     onChange={(e) => updateField('notes', e.target.value)}
                     className="w-full px-3 py-2 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal min-h-[80px]"
                     placeholder="Add any internal context..."
                   />
               ) : (
                   <div className="text-[12px] text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                       {formData.notes || 'No internal notes added.'}
                   </div>
               )}
            </div>

            {/* Linked Dealerships */}
            {!isNew && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Linked Dealerships</h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{linkedDealerships.length}</span>
                    </div>
                    
                    {linkedDealerships.length === 0 ? (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic p-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center">
                            No dealerships currently linked to this {formData.category?.toLowerCase()}.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {linkedDealerships.map(d => (
                                <div key={d.id} className={`flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border ${d.status === DealershipStatus.CANCELLED ? 'border-red-100 dark:border-red-900/30 bg-red-50/10 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-700'}`}>
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
                                            <Building2 size={12} />
                                        </div>
                                        <div>
                                            <div className={`text-[11px] font-bold truncate ${d.status === DealershipStatus.CANCELLED ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {d.name}
                                            </div>
                                            <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{d.pp_sys_id || 'NO ID'}</div>
                                        </div>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${statusColors[d.status]}`}>
                                        {d.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Timestamps */}
            {!isNew && (
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex gap-6 text-[10px] text-slate-400 dark:text-slate-500">
                <span>Created: {new Date(formData.created_at || '').toLocaleDateString()}</span>
                <span>ID: {formData.id}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProductDetailPanel;
