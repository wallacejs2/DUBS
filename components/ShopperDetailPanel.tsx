
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Trash2, Edit3, Save, RefreshCw,
  User, Shield, Building2, Check, Hash, Link, ExternalLink, Plus, Copy,
  AlertTriangle
} from 'lucide-react';
import { Shopper, ShopperStatus, DealershipStatus, CdpId, CdpIdSystem, ShopperProfile, ShopperDealership } from '../types';
import { useDealerships, useEnterpriseGroups } from '../hooks';

interface ShopperDetailPanelProps {
  shopper: Partial<Shopper>;
  onClose: () => void;
  onUpdate: (data: Partial<Shopper>) => void;
  onDelete: () => void;
}

const statusColors: Record<ShopperStatus, string> = {
  [ShopperStatus.ACTIVE]: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  [ShopperStatus.TESTING]: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [ShopperStatus.REVIEW]: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  [ShopperStatus.RESOLVED]: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
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

// CDP ID Manager - simplified from old IdentityManager
interface CdpIdManagerProps {
  cdpIds: CdpId[];
  onChange: (ids: CdpId[]) => void;
  isEditing: boolean;
}

const CdpIdManager: React.FC<CdpIdManagerProps> = ({ cdpIds, onChange, isEditing }) => {
  const handleAdd = () => {
    const newId: CdpId = {
      id: crypto.randomUUID(),
      system: 'ucp',
      value: '',
      notes: '',
    };
    onChange([...cdpIds, newId]);
  };

  const handleRemove = (index: number) => {
    const newIds = [...cdpIds];
    newIds.splice(index, 1);
    onChange(newIds);
  };

  const updateCdpId = (index: number, field: keyof CdpId, value: any) => {
    const newIds = [...cdpIds];
    newIds[index] = { ...newIds[index], [field]: value };
    onChange(newIds);
  };

  const systemLabel = (sys: CdpIdSystem) => {
    if (sys === 'ucp') return 'UCP';
    if (sys === 'cdp_admin') return 'CDPAdmin';
    return 'CUR';
  };

  const systemBadgeClass = (sys: CdpIdSystem) => {
    if (sys === 'ucp') return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
    if (sys === 'cdp_admin') return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        <Hash size={10} /> CDP IDs
      </div>

      <div className="space-y-1.5">
        {cdpIds.length === 0 && !isEditing && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 italic p-1">No IDs</div>
        )}

        {cdpIds.map((cdpId, idx) => (
          <div key={cdpId.id || idx}>
            {/* Main row: system dropdown + value + delete */}
            <div className="flex gap-2 items-center">
              {isEditing ? (
                <select
                  value={cdpId.system}
                  onChange={(e) => updateCdpId(idx, 'system', e.target.value as CdpIdSystem)}
                  className="w-[100px] px-1 py-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="ucp">UCP</option>
                  <option value="cdp_admin">CDP Admin</option>
                  <option value="curator">Curator</option>
                </select>
              ) : (
                <span className={`text-[9px] font-bold border px-1.5 py-1 rounded uppercase tracking-wider h-fit flex-shrink-0 ${systemBadgeClass(cdpId.system)}`}>
                  {systemLabel(cdpId.system)}
                </span>
              )}

              {isEditing ? (
                <input
                  value={cdpId.value}
                  onChange={(e) => updateCdpId(idx, 'value', e.target.value)}
                  placeholder="CDP ID Value"
                  className="flex-1 px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-mono min-w-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              ) : (
                <div className="flex-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 pt-0.5 truncate" title={cdpId.value}>
                  {cdpId.value || '---'}
                </div>
              )}

              {isEditing && (
                <button onClick={() => handleRemove(idx)} className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Notes row below - small italic, left to right */}
            <div className="ml-1 mt-0.5">
              {isEditing ? (
                <input
                  value={cdpId.notes || ''}
                  onChange={(e) => updateCdpId(idx, 'notes', e.target.value)}
                  placeholder="Add note..."
                  className="w-full bg-transparent text-[9px] italic text-slate-600 dark:text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none px-1"
                />
              ) : (
                cdpId.notes ? (
                  <div className="text-[9px] italic text-slate-400 dark:text-slate-500 px-1" title={cdpId.notes}>
                    {cdpId.notes}
                  </div>
                ) : null
              )}
            </div>
          </div>
        ))}

        {isEditing && (
          <button
            onClick={handleAdd}
            className="w-full py-1.5 border border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400 rounded-lg text-[10px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-center gap-1"
          >
            <Plus size={12} /> Add New ID
          </button>
        )}
      </div>
    </div>
  );
};

const formatPhone = (val?: string) => {
  if (!val) return '';
  const cleaned = ('' + val).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return match[1] + '-' + match[2] + '-' + match[3];
  }
  return val;
};

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

  const getDealershipById = (id: string) => dealerships.find(d => d.id === id);
  const getGroupForDealership = (dealerId: string) => {
    const d = getDealershipById(dealerId);
    return d ? groups.find(g => g.id === d.enterprise_group_id) : undefined;
  };

  useEffect(() => {
    setFormData(shopper);
    setFullName(`${shopper.first_name || ''} ${shopper.last_name || ''}`.trim());
  }, [shopper]);

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

  // === Dealership helpers ===
  const addDealership = () => {
    const newDealership: ShopperDealership = {
      id: crypto.randomUUID(),
      dealership_id: '',
      profiles: [{
        id: crypto.randomUUID(),
        name: '',
        email: '',
        phone: '',
        dms_id: '',
        curator_id: '',
        curator_link: '',
        issue: '',
        cdp_ids: [],
      }],
    };
    setFormData(prev => ({
      ...prev,
      dealerships: [...(prev.dealerships || []), newDealership],
    }));
  };

  const removeDealership = (dIdx: number) => {
    setFormData(prev => {
      const newDealerships = [...(prev.dealerships || [])];
      newDealerships.splice(dIdx, 1);
      return { ...prev, dealerships: newDealerships };
    });
  };

  const updateDealershipField = (dIdx: number, field: keyof ShopperDealership, value: any) => {
    setFormData(prev => {
      const newDealerships = [...(prev.dealerships || [])];
      newDealerships[dIdx] = { ...newDealerships[dIdx], [field]: value };
      return { ...prev, dealerships: newDealerships };
    });
  };

  // === Profile helpers ===
  const addProfile = (dIdx: number) => {
    const newProfile: ShopperProfile = {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      phone: '',
      dms_id: '',
      curator_id: '',
      curator_link: '',
      issue: '',
      cdp_ids: [],
    };
    setFormData(prev => {
      const newDealerships = [...(prev.dealerships || [])];
      newDealerships[dIdx] = {
        ...newDealerships[dIdx],
        profiles: [...newDealerships[dIdx].profiles, newProfile],
      };
      return { ...prev, dealerships: newDealerships };
    });
  };

  const removeProfile = (dIdx: number, pIdx: number) => {
    setFormData(prev => {
      const newDealerships = [...(prev.dealerships || [])];
      const newProfiles = [...newDealerships[dIdx].profiles];
      newProfiles.splice(pIdx, 1);
      newDealerships[dIdx] = { ...newDealerships[dIdx], profiles: newProfiles };
      return { ...prev, dealerships: newDealerships };
    });
  };

  const updateProfileField = (dIdx: number, pIdx: number, field: keyof ShopperProfile, value: any) => {
    setFormData(prev => {
      const newDealerships = [...(prev.dealerships || [])];
      const newProfiles = [...newDealerships[dIdx].profiles];
      newProfiles[pIdx] = { ...newProfiles[pIdx], [field]: value };
      newDealerships[dIdx] = { ...newDealerships[dIdx], profiles: newProfiles };
      return { ...prev, dealerships: newDealerships };
    });
  };

  // === Copy All ===
  const handleCopyAll = () => {
    const lines: string[] = [];

    (formData.dealerships || []).forEach(sd => {
      const dealer = getDealershipById(sd.dealership_id);
      if (dealer) {
        const combo = `${dealer.pp_sys_id || ''}_${dealer.store_number || ''}_${dealer.branch_number || ''}`;
        lines.push(`DEALERSHIP ${combo}`);
      } else {
        lines.push('DEALERSHIP (unassigned)');
      }

      sd.profiles.forEach((profile, idx) => {
        const parts: string[] = [];
        if (profile.name) parts.push(profile.name.toUpperCase());
        if (profile.email) parts.push(profile.email);
        if (profile.phone) parts.push(profile.phone);
        if (profile.dms_id) parts.push(`DMS ${profile.dms_id}`);
        if (profile.curator_id) {
          let cur = `CUR - ${profile.curator_id}`;
          if (profile.curator_link) cur += ` ${profile.curator_link}`;
          parts.push(cur);
        }
        if (profile.issue) parts.push(` [Issue: ${profile.issue}]`);

        lines.push(`[${idx + 1}] ${parts.join(' | ')}`);

        (profile.cdp_ids || []).forEach(cdpId => {
          const systemLabel = cdpId.system === 'ucp' ? 'UCP'
            : cdpId.system === 'cdp_admin' ? 'CDPAdmin'
            : 'CUR';
          let line = `  - [${systemLabel}] ${cdpId.value}`;
          if (cdpId.notes) line += ` [${cdpId.notes}]`;
          lines.push(line);
        });
      });
    });

    copyToClipboard(lines.join('\n').trim(), 'all');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing && isNew ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-colors">

        {/* Sticky Header */}
        <div className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
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
                   <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formData.first_name} {formData.last_name}</h2>
                 )}
               </div>
             </div>

             <div className="flex items-center gap-2">
               {!isEditing && (
                 <button
                    onClick={handleCopyAll}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                    title="Copy All Details"
                 >
                    {copiedField === 'all' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                 </button>
               )}

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
          <div className="space-y-6 mx-auto">

            {/* Status Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
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
            </div>

            {/* Dealerships Section */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Dealerships</h3>
                {isEditing && (
                  <button
                    onClick={addDealership}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded transition-colors border border-indigo-100 dark:border-indigo-800"
                  >
                    <Plus size={12} /> Add Dealership
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {(formData.dealerships || []).map((shopperDealership, dIdx) => {
                  const dealer = getDealershipById(shopperDealership.dealership_id);
                  const group = getGroupForDealership(shopperDealership.dealership_id);

                  return (
                    <div key={shopperDealership.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-800/30 relative">

                      {/* Dealership Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dealership {dIdx + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {dealer && (
                            <>
                              <button
                                onClick={() => copyToClipboard(dealer.pp_sys_id || '', `pp-${dIdx}`)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                title="Copy PP Sys ID"
                              >
                                {copiedField === `pp-${dIdx}` ? <Check size={14} className="text-emerald-500" /> : <Hash size={14} />}
                              </button>
                              <button
                                onClick={() => {
                                  const combo = `${dealer.pp_sys_id || ''}_${dealer.store_number || ''}_${dealer.branch_number || ''}`;
                                  copyToClipboard(combo, `combo-${dIdx}`);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                title="Copy PP_Store_Branch"
                              >
                                {copiedField === `combo-${dIdx}` ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
                              </button>
                            </>
                          )}
                          {isEditing && (
                            <button
                              onClick={() => removeDealership(dIdx)}
                              className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                              title="Remove Dealership"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dealership Dropdown */}
                      <div className="mb-3">
                        <Label icon={Building2}>Assigned Dealership</Label>
                        {isEditing ? (
                          <select
                            value={shopperDealership.dealership_id || ''}
                            onChange={(e) => updateDealershipField(dIdx, 'dealership_id', e.target.value)}
                            className="w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal transition-all"
                          >
                            <option value="">-- Select Dealership --</option>
                            {eligibleDealerships.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                            ))}
                          </select>
                        ) : (
                          <DataValue value={dealer?.name || 'Unassigned'} />
                        )}
                      </div>

                      {/* Dealership Info */}
                      {dealer && (
                        <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                          <div className="min-w-0">
                            <Label>Enterprise Group</Label>
                            <div className="truncate" title={group?.name || 'Single (Independent)'}>
                              <DataValue value={group?.name || 'Single (Independent)'} />
                            </div>
                          </div>
                          <div>
                            <Label>PP Sys ID</Label>
                            <DataValue mono value={dealer.pp_sys_id} />
                          </div>
                          <div>
                            <Label>Store / Branch</Label>
                            <DataValue mono value={`${dealer.store_number || '-'}/${dealer.branch_number || '-'}`} />
                          </div>
                        </div>
                      )}

                      {/* Profiles under this dealership */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Profiles</span>
                          {isEditing && (
                            <button
                              onClick={() => addProfile(dIdx)}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded transition-colors border border-indigo-100 dark:border-indigo-800"
                            >
                              <Plus size={10} /> Add Profile
                            </button>
                          )}
                        </div>

                        {shopperDealership.profiles.map((profile, pIdx) => (
                          <div key={profile.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 relative">
                            {/* Profile header with number and remove */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Profile [{pIdx + 1}]</span>
                              {isEditing && shopperDealership.profiles.length > 1 && (
                                <button
                                  onClick={() => removeProfile(dIdx, pIdx)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                  title="Remove Profile"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>

                            {/* Profile fields - Row 1: Name, Email, Phone */}
                            <div className="grid grid-cols-3 gap-3 mb-2">
                              <div>
                                <Label>Name</Label>
                                {isEditing ? (
                                  <Input value={profile.name} onChange={(v) => updateProfileField(dIdx, pIdx, 'name', v)} placeholder="Name" />
                                ) : (
                                  <DataValue value={profile.name} />
                                )}
                              </div>
                              <div>
                                <Label>Email</Label>
                                {isEditing ? (
                                  <Input type="email" value={profile.email} onChange={(v) => updateProfileField(dIdx, pIdx, 'email', v)} placeholder="Email" />
                                ) : (
                                  <DataValue value={profile.email} />
                                )}
                              </div>
                              <div>
                                <Label>Phone</Label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={profile.phone || ''}
                                    onChange={(e) => updateProfileField(dIdx, pIdx, 'phone', e.target.value)}
                                    onBlur={(e) => updateProfileField(dIdx, pIdx, 'phone', formatPhone(e.target.value))}
                                    placeholder="###-###-####"
                                    className="w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                  />
                                ) : (
                                  <DataValue value={formatPhone(profile.phone)} />
                                )}
                              </div>
                            </div>

                            {/* Profile fields - Row 2: DMS ID, Curator ID, Curator Link */}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <Label icon={Hash}>DMS ID</Label>
                                {isEditing ? (
                                  <Input value={profile.dms_id} onChange={(v) => updateProfileField(dIdx, pIdx, 'dms_id', v)} placeholder="DMS ID" />
                                ) : (
                                  <DataValue value={profile.dms_id} mono />
                                )}
                              </div>
                              <div>
                                <Label icon={Hash}>Curator ID</Label>
                                {isEditing ? (
                                  <Input value={profile.curator_id} onChange={(v) => updateProfileField(dIdx, pIdx, 'curator_id', v)} placeholder="Curator ID" />
                                ) : (
                                  <DataValue value={profile.curator_id} mono />
                                )}
                              </div>
                              <div>
                                <Label icon={Link}>Curator Link</Label>
                                {isEditing ? (
                                  <Input value={profile.curator_link} onChange={(v) => updateProfileField(dIdx, pIdx, 'curator_link', v)} placeholder="https://..." />
                                ) : (
                                  <DataValue>
                                    {profile.curator_link ? (
                                      <a href={profile.curator_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate flex items-center gap-1" title={profile.curator_link}>
                                        Open Link <ExternalLink size={10} />
                                      </a>
                                    ) : '---'}
                                  </DataValue>
                                )}
                              </div>
                            </div>

                            {/* Issue Field */}
                            <div className="mb-3">
                              <Label icon={AlertTriangle}>Issue / Blocker</Label>
                              {isEditing ? (
                                <textarea
                                  value={profile.issue || ''}
                                  onChange={(e) => updateProfileField(dIdx, pIdx, 'issue', e.target.value)}
                                  className="w-full px-3 py-2 text-[12px] border border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-900 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-slate-800 dark:text-orange-100 placeholder:text-orange-300 min-h-[40px]"
                                  placeholder="Describe issue for this profile..."
                                />
                              ) : (
                                profile.issue ? (
                                  <div className="w-full px-3 py-2 text-[12px] border border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-900 rounded-lg text-slate-800 dark:text-orange-100">
                                    {profile.issue}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">No issues recorded.</div>
                                )
                              )}
                            </div>

                            {/* CDP IDs */}
                            <CdpIdManager
                              cdpIds={profile.cdp_ids || []}
                              onChange={(ids) => updateProfileField(dIdx, pIdx, 'cdp_ids', ids)}
                              isEditing={isEditing}
                            />
                          </div>
                        ))}

                        {shopperDealership.profiles.length === 0 && !isEditing && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">No profiles recorded.</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(!formData.dealerships || formData.dealerships.length === 0) && !isEditing && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">No dealerships assigned.</div>
                )}
              </div>
            </div>

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

export default ShopperDetailPanel;
