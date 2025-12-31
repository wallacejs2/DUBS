
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, 
  User, Shield, Mail, Phone, Building2, Check, Hash, Link, ExternalLink
} from 'lucide-react';
import { Shopper, ShopperStatus, ShopperPriority, DealershipStatus } from '../types';
import { useDealerships, useEnterpriseGroups } from '../hooks';

interface ShopperDetailPanelProps {
  shopper: Partial<Shopper>;
  onClose: () => void;
  onUpdate: (data: Partial<Shopper>) => void;
  onDelete: () => void;
}

const statusColors: Record<ShopperStatus, string> = {
  [ShopperStatus.ACTIVE]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  [ShopperStatus.TESTING]: 'bg-blue-50 text-blue-700 border-blue-100',
  [ShopperStatus.REVIEW]: 'bg-amber-50 text-amber-700 border-amber-100',
  [ShopperStatus.RESOLVED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const priorityColors: Record<ShopperPriority, string> = {
  [ShopperPriority.HIGH]: 'bg-rose-50 text-rose-600 border-rose-100',
  [ShopperPriority.MEDIUM]: 'bg-amber-50 text-amber-600 border-amber-100',
  [ShopperPriority.LOW]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const Label = ({ children, icon: Icon }: { children?: React.ReactNode, icon?: any }) => (
  <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
    {Icon && <Icon size={10} />}
    {children}
  </label>
);

const DataValue = ({ value, mono = false, children }: { value?: any, mono?: boolean, children?: React.ReactNode }) => (
  <div className={`text-[12px] font-normal text-slate-700 leading-tight min-h-[1.5em] flex items-center ${mono ? 'font-mono' : ''}`}>
    {children || value || '---'}
  </div>
);

const Input = ({ value, onChange, type = "text", className = "", placeholder="" }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string }) => (
  <input 
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal transition-all ${className}`}
  />
);

const Select = ({ value, onChange, options, className = "" }: { value: any, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string }) => (
  <select 
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal transition-all ${className}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const ShopperDetailPanel: React.FC<ShopperDetailPanelProps> = ({ 
  shopper, onClose, onUpdate, onDelete
}) => {
  const isNew = !shopper.id;
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState<Partial<Shopper>>(shopper);
  const [fullName, setFullName] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { dealerships } = useDealerships();
  const { groups } = useEnterpriseGroups();

  const eligibleDealerships = useMemo(() => dealerships.filter(d => 
    [DealershipStatus.LIVE, DealershipStatus.LEGACY, DealershipStatus.ONBOARDING].includes(d.status)
  ).sort((a, b) => a.name.localeCompare(b.name)), [dealerships]);

  const selectedDealership = useMemo(() => 
    dealerships.find(d => d.id === formData.dealership_id), 
    [dealerships, formData.dealership_id]
  );

  const selectedGroup = useMemo(() => 
    groups.find(g => g.id === selectedDealership?.enterprise_group_id),
    [groups, selectedDealership]
  );

  useEffect(() => {
    setFormData(shopper);
    setFullName(`${shopper.first_name || ''} ${shopper.last_name || ''}`.trim());
  }, [shopper]);

  const handleSave = () => {
    onUpdate(formData);
    if (isNew) {
      onClose(); // Close if it was a new creation
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (isNew) {
      onClose();
    } else {
      setFormData(shopper);
      setFullName(`${shopper.first_name || ''} ${shopper.last_name || ''}`.trim());
      setIsEditing(false);
    }
  };

  const updateField = (field: keyof Shopper, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (val: string) => {
    setFullName(val);
    const trimmed = val.trimStart();
    const firstSpaceIndex = trimmed.indexOf(' ');
    
    if (firstSpaceIndex === -1) {
      updateField('first_name', trimmed);
      updateField('last_name', '');
    } else {
      updateField('first_name', trimmed.substring(0, firstSpaceIndex));
      updateField('last_name', trimmed.substring(firstSpaceIndex + 1));
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing && isNew ? undefined : onClose}></div>
      {/* Changed max-w-2xl to max-w-4xl to widen the panel */}
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Sticky Header */}
        <div className="bg-white sticky top-0 z-30 border-b border-slate-100 shadow-sm">
          <div className="p-4 flex justify-between items-center gap-4">
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isNew ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                 {isNew ? <User size={20} /> : (formData.first_name?.[0] || '') + (formData.last_name?.[0] || '')}
               </div>
               <div>
                 {isEditing ? (
                   <div className="w-full">
                     <Input 
                       value={fullName} 
                       onChange={handleNameChange} 
                       placeholder="Full Name" 
                       className="font-bold text-lg" 
                     />
                   </div>
                 ) : (
                   <h2 className="text-xl font-bold text-slate-900 tracking-tight">{formData.first_name} {formData.last_name}</h2>
                 )}
                 {!isEditing && <p className="text-xs text-slate-500 font-medium">{formData.email}</p>}
               </div>
             </div>

             <div className="flex items-center gap-2">
               {isEditing ? (
                 <>
                   <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-100 flex items-center gap-2 transition-all">
                     <Save size={14} /> Save
                   </button>
                   <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"><RefreshCw size={16} /></button>
                 </>
               ) : (
                 <button onClick={() => setIsEditing(true)} className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 transition-all">
                    <Edit3 size={14} /> Edit
                 </button>
               )}
               {!isNew && (
                 <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
               )}
               <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><X size={20} /></button>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          {/* Removed max-w-xl constraint to allow full width usage */}
          <div className="space-y-6 mx-auto">
            
            {/* Status Section */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
               <div>
                  <Label icon={Shield}>Status</Label>
                  {isEditing ? (
                    <Select 
                       value={formData.status}
                       onChange={(v) => updateField('status', v)}
                       options={Object.values(ShopperStatus).map(s => ({ label: s, value: s }))}
                    />
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[formData.status || ShopperStatus.ACTIVE]}`}>
                      {formData.status}
                    </span>
                  )}
               </div>
               <div>
                  <Label icon={Shield}>Audit Priority</Label>
                  {isEditing ? (
                    <Select 
                       value={formData.priority}
                       onChange={(v) => updateField('priority', v)}
                       options={Object.values(ShopperPriority).map(p => ({ label: p, value: p }))}
                    />
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${priorityColors[formData.priority || ShopperPriority.MEDIUM]}`}>
                      {formData.priority}
                    </span>
                  )}
               </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Contact Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label icon={Mail}>Email Address</Label>
                  {isEditing ? (
                    <Input type="email" value={formData.email} onChange={(v) => updateField('email', v)} />
                  ) : (
                    <DataValue>
                      <a href={`mailto:${formData.email}`} className="text-indigo-600 hover:underline">{formData.email}</a>
                    </DataValue>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label icon={Phone}>Phone Number</Label>
                  {isEditing ? (
                    <Input value={formData.phone} onChange={(v) => updateField('phone', v)} placeholder="(###) ###-####" />
                  ) : (
                    <DataValue value={formData.phone} />
                  )}
                </div>
              </div>

              {/* New Identifiers Section */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-50">
                 <div>
                    <Label icon={Hash}>DMS ID</Label>
                    {isEditing ? (
                      <Input value={formData.dms_id} onChange={(v) => updateField('dms_id', v)} placeholder="DMS ID" />
                    ) : (
                      <DataValue value={formData.dms_id} mono />
                    )}
                 </div>
                 <div>
                    <Label icon={Hash}>Curator ID</Label>
                    {isEditing ? (
                      <Input value={formData.curator_id} onChange={(v) => updateField('curator_id', v)} placeholder="Curator ID" />
                    ) : (
                      <DataValue value={formData.curator_id} mono />
                    )}
                 </div>
                 <div>
                    <Label icon={Link}>Curator Link</Label>
                    {isEditing ? (
                      <Input value={formData.curator_link} onChange={(v) => updateField('curator_link', v)} placeholder="https://..." />
                    ) : (
                       <DataValue>
                          {formData.curator_link ? (
                            <a href={formData.curator_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate flex items-center gap-1" title={formData.curator_link}>
                              Open Link <ExternalLink size={10} />
                            </a>
                          ) : '---'}
                       </DataValue>
                    )}
                 </div>
              </div>
            </div>

            {/* Dealership Assignment */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Dealership Assignment</h3>
                 {selectedDealership && (
                   <div className="flex items-center gap-1">
                      <button 
                        onClick={() => copyToClipboard(selectedDealership.pp_sys_id || '', 'pp')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Copy PP Sys ID"
                      >
                        {copiedField === 'pp' ? <Check size={14} className="text-emerald-500" /> : <Hash size={14} />}
                      </button>
                      <button 
                        onClick={() => {
                           const combo = `${selectedDealership.pp_sys_id || ''}_${selectedDealership.store_number || ''}_${selectedDealership.branch_number || ''}`;
                           copyToClipboard(combo, 'combo');
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Copy PP_Store_Branch"
                      >
                        {copiedField === 'combo' ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
                      </button>
                   </div>
                 )}
              </div>
              
              <div className="space-y-3">
                 <div className="w-full">
                    <Label icon={Building2}>Assigned Dealership</Label>
                    {isEditing ? (
                       <select 
                          value={formData.dealership_id || ''} 
                          onChange={(e) => updateField('dealership_id', e.target.value)}
                          className="w-full px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal transition-all"
                       >
                          <option value="">-- No Dealership Assigned --</option>
                          {eligibleDealerships.map(d => (
                             <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                          ))}
                       </select>
                    ) : (
                       <DataValue value={selectedDealership?.name || 'Unassigned'} />
                    )}
                 </div>

                 {selectedDealership && (
                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <div className="min-w-0">
                          <Label>Enterprise Group</Label>
                          <div className="truncate" title={selectedGroup?.name || 'Single (Independent)'}>
                             <DataValue value={selectedGroup?.name || 'Single (Independent)'} />
                          </div>
                       </div>
                       <div>
                          <Label>PP Sys ID</Label>
                          <DataValue mono value={selectedDealership.pp_sys_id} />
                       </div>
                       <div>
                          <Label>Store / Branch</Label>
                          <DataValue mono value={`${selectedDealership.store_number || '-'}/${selectedDealership.branch_number || '-'}`} />
                       </div>
                    </div>
                 )}
              </div>
            </div>

            {/* Timestamps */}
            {!isNew && (
              <div className="pt-4 mt-4 border-t border-slate-100 flex gap-6 text-[10px] text-slate-400">
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

export default ShopperDetailPanel;
