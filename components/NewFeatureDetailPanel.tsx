
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Trash2, Edit3, Save, RefreshCw,
  Sparkles, Calendar, MapPin, Monitor, Hash, Link, ExternalLink, FileText, Clock, AlertCircle, Activity, Compass, Plus, Bell, Megaphone, Tag, Box, ChevronRight, ChevronDown
} from 'lucide-react';
import { NewFeature, PMR } from '../types';
import RichTextEditor from './RichTextEditor';

interface NewFeatureDetailPanelProps {
  feature: Partial<NewFeature>;
  onClose: () => void;
  onUpdate: (data: Partial<NewFeature>) => void;
  onDelete: () => void;
  allFeatures?: NewFeature[];
}

const Label = ({ children, icon: Icon }: { children?: React.ReactNode, icon?: any }) => (
  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">
    {Icon && <Icon size={10} />}
    {children}
  </label>
);

const DataValue = ({ value, mono = false, children }: { value?: any, mono?: boolean, children?: React.ReactNode }) => (
  <div className={`text-sm font-normal text-slate-700 dark:text-slate-300 leading-tight min-h-[1.5em] flex items-center ${mono ? 'font-mono' : ''}`}>
    {children || value || '---'}
  </div>
);

const Input = ({ value, onChange, type = "text", className = "", placeholder="", required = false }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string, required?: boolean }) => (
  <input 
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    required={required}
    className={`w-full px-3 py-1.5 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${className}`}
  />
);

const Select = ({ value, onChange, options, className = "", placeholder }: { value: any, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string, placeholder?: string }) => (
  <select 
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-1.5 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal transition-all ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const NavigationChipInput = ({ value, onChange, allFeatures }: { value: string; onChange: (v: string) => void; allFeatures: NewFeature[] }) => {
  const [segments, setSegments] = useState<string[]>(() => value ? value.split(' > ').map(s => s.trim()).filter(Boolean) : []);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newText, setNewText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Sync from parent when value changes externally
  useEffect(() => {
    const parsed = value ? value.split(' > ').map(s => s.trim()).filter(Boolean) : [];
    const current = segments.filter(Boolean);
    if (parsed.join(' > ') !== current.join(' > ')) {
      setSegments(parsed);
    }
  }, [value]);

  const allKnownSegments = useMemo(() => {
    const segSet = new Set<string>();
    allFeatures.forEach(f => {
      if (f.navigation) {
        f.navigation.split(' > ').forEach(seg => {
          const trimmed = seg.trim();
          if (trimmed) segSet.add(trimmed);
        });
      }
    });
    return Array.from(segSet).sort();
  }, [allFeatures]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Remove any empty segments when clicking outside
        const cleaned = segments.filter(Boolean);
        setSegments(cleaned);
        onChange(cleaned.join(' > '));
        setOpenIdx(null);
        setAddingNew(false);
        setNewText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [segments, onChange]);

  useEffect(() => {
    if (addingNew && newInputRef.current) newInputRef.current.focus();
  }, [addingNew]);

  const selectSegment = (idx: number, val: string) => {
    const updated = [...segments];
    updated[idx] = val;
    setSegments(updated);
    onChange(updated.filter(Boolean).join(' > '));
    setOpenIdx(null);
    setAddingNew(false);
    setNewText('');
  };

  const removeSegment = (idx: number) => {
    const updated = segments.filter((_, i) => i !== idx);
    setSegments(updated);
    onChange(updated.filter(Boolean).join(' > '));
    setOpenIdx(null);
  };

  const addSegment = () => {
    const updated = [...segments, ''];
    setSegments(updated);
    // Don't call onChange yet — empty segment is temporary until user picks a value
    setOpenIdx(updated.length - 1);
    setAddingNew(false);
    setNewText('');
  };

  const confirmNewOption = (idx: number) => {
    const trimmed = newText.trim();
    if (trimmed) {
      selectSegment(idx, trimmed);
    }
    setAddingNew(false);
    setNewText('');
  };

  const filteredOptions = (idx: number) => {
    const currentSegments = new Set(segments.filter((_, i) => i !== idx));
    return allKnownSegments.filter(s => !currentSegments.has(s));
  };

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-1.5 min-h-[34px] w-full px-2 py-1.5 border border-slate-200/60 dark:border-[#38383A] rounded-lg bg-slate-100/50 dark:bg-[#2C2C2E]">
      {segments.map((seg, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setOpenIdx(openIdx === idx ? null : idx); setAddingNew(false); setNewText(''); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/50 transition-colors"
            >
              {seg || <span className="text-slate-400 italic">select...</span>}
              <ChevronDown size={10} className={`transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
              <span
                onClick={(e) => { e.stopPropagation(); removeSegment(idx); }}
                className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              >
                <X size={10} />
              </span>
            </button>

            {openIdx === idx && (
              <div className="absolute z-50 left-0 top-full mt-1 min-w-[180px] bg-white/95 dark:bg-[#1C1C1E]/95 border border-slate-200/60 dark:border-[#38383A] rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                {filteredOptions(idx).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => selectSegment(idx, opt)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${opt === seg ? 'bg-blue-50 dark:bg-blue-900/30 font-bold text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {opt}
                  </button>
                ))}
                {filteredOptions(idx).length > 0 && <div className="border-t border-slate-100/60 dark:border-[#38383A]" />}
                {!addingNew ? (
                  <button
                    type="button"
                    onClick={() => setAddingNew(true)}
                    className="w-full text-left px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={10} /> Add new...
                  </button>
                ) : (
                  <div className="p-2 flex gap-1">
                    <input
                      ref={newInputRef}
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNewOption(idx); } }}
                      placeholder="Type name..."
                      className="flex-1 px-2 py-1 text-xs border border-slate-200/60 dark:border-[#38383A] rounded-md bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                    <button type="button" onClick={() => confirmNewOption(idx)} className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </React.Fragment>
      ))}
      <button
        type="button"
        onClick={addSegment}
        className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-blue-600 hover:border-blue-400 dark:hover:text-blue-400 dark:hover:border-blue-500 transition-colors"
        title="Add navigation segment"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

const platformColors: Record<string, string> = {
  'UCP': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Curator': 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'FOCUS': 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
};

const NewFeatureDetailPanel: React.FC<NewFeatureDetailPanelProps> = ({
  feature, onClose, onUpdate, onDelete, allFeatures = []
}) => {
  const isNew = !feature.id;
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState<Partial<NewFeature>>(feature);

  useEffect(() => {
    // Migrate legacy PMR fields to pmrs array if needed
    const pmrs = feature.pmrs || [];
    if (pmrs.length === 0 && (feature.pmr_number || feature.pmr_link)) {
        pmrs.push({
            id: crypto.randomUUID(),
            number: feature.pmr_number || '',
            link: feature.pmr_link || ''
        });
    }
    setFormData({ ...feature, pmrs });
  }, [feature]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title) return; // Validation
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
      // Re-initialize with migration logic
      const pmrs = feature.pmrs || [];
      if (pmrs.length === 0 && (feature.pmr_number || feature.pmr_link)) {
          pmrs.push({
              id: crypto.randomUUID(),
              number: feature.pmr_number || '',
              link: feature.pmr_link || ''
          });
      }
      setFormData({ ...feature, pmrs });
      setIsEditing(false);
    }
  };

  const updateField = (field: keyof NewFeature, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateValue = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}-${dd}-${yy}`;
  };

  const parseRelease = (val: string = '') => {
    const parts = val.split(' ');
    let q = parts.find(p => ['Q1','Q2','Q3','Q4'].includes(p)) || '';
    let y = parts.find(p => p.match(/^\d{4}$/)) || '';
    return { q, y };
  };

  // PMR Management
  const addPmr = () => {
    const newPmr: PMR = { id: crypto.randomUUID(), number: '', link: '' };
    updateField('pmrs', [...(formData.pmrs || []), newPmr]);
  };

  const removePmr = (index: number) => {
    const newPmrs = [...(formData.pmrs || [])];
    newPmrs.splice(index, 1);
    updateField('pmrs', newPmrs);
  };

  const updatePmr = (index: number, field: keyof PMR, value: string) => {
    const newPmrs = [...(formData.pmrs || [])];
    newPmrs[index] = { ...newPmrs[index], [field]: value };
    updateField('pmrs', newPmrs);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={isEditing && isNew ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl h-full flex flex-col animate-in slide-in-from-right duration-300 rounded-l-2xl transition-colors">
        {/* Grabber pill */}
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-9 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        </div>

        {/* Sticky Header */}
        <div className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-[#38383A] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl">
          <div className="p-4 flex justify-between items-center gap-4">
             <div className="flex items-center gap-3 w-full">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0 ${isNew ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                 <Sparkles size={20} />
               </div>
               <div className="w-full">
                 {isEditing ? (
                   <div className="w-full">
                     <Input 
                       value={formData.title} 
                       onChange={(v) => updateField('title', v)} 
                       placeholder="Feature Title (Required)" 
                       className="font-bold text-lg w-full" 
                       required
                     />
                   </div>
                 ) : (
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{formData.title}</h2>
                 )}
               </div>
             </div>

             <div className="flex items-center gap-2 flex-shrink-0">
               {isEditing ? (
                 <>
                   <button onClick={() => handleSave()} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2">
                     <Save size={14} /> Save
                   </button>
                   <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"><RefreshCw size={16} /></button>
                 </>
               ) : (
                 <button onClick={() => setIsEditing(true)} className="px-3 py-2 border border-slate-200/60 dark:border-[#38383A] text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all">
                    <Edit3 size={14} /> Edit
                 </button>
               )}
               {!isNew && (
                 <button onClick={onDelete} className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 size={18} /></button>
               )}
               <button onClick={onClose} className="p-2 text-slate-300 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"><X size={20} /></button>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white/95 dark:bg-[#1C1C1E]/95 custom-scrollbar transition-colors">
          <form onSubmit={handleSave} className="space-y-6 mx-auto">
            
            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Source & Type */}
                <div>
                   <Label icon={AlertCircle}>Source / Type</Label>
                   {isEditing ? (
                      <div className="flex gap-2">
                        <Select
                          value={formData.source || ''}
                          onChange={(v) => updateField('source', v)}
                          placeholder="Source"
                          options={[
                             { label: 'Fullpath', value: 'Fullpath' },
                             { label: 'Reynolds', value: 'Reynolds' }
                          ]}
                        />
                        <Select
                          value={formData.type || 'New'}
                          onChange={(v) => updateField('type', v)}
                          options={[
                             { label: 'New', value: 'New' },
                             { label: 'Updated', value: 'Updated' },
                             { label: 'Add', value: 'Add' }
                          ]}
                        />
                      </div>
                   ) : (
                      <DataValue>
                        <div className="flex items-center gap-1.5">
                         {formData.source ? (
                           <span className={`font-bold px-2 py-0.5 rounded-md border text-xs ${
                             formData.source === 'Fullpath'
                               ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                               : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                           }`}>
                             {formData.source}
                           </span>
                         ) : null}
                         {formData.type ? (
                           <span className={`font-bold px-2 py-0.5 rounded-md border text-xs ${
                             formData.type === 'New'
                               ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                               : formData.type === 'Add'
                               ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                               : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                           }`}>
                             {formData.type}
                           </span>
                         ) : null}
                         {!formData.source && !formData.type && '---'}
                        </div>
                      </DataValue>
                   )}
                </div>

                {/* 2. Quarterly Release */}
                <div>
                   <Label icon={Clock}>Quarterly Release</Label>
                   {isEditing ? (
                      <div className="flex gap-2">
                          <Select 
                            value={parseRelease(formData.quarterly_release).q} 
                            onChange={(v) => {
                                const { y } = parseRelease(formData.quarterly_release);
                                updateField('quarterly_release', `${v} ${y}`.trim());
                            }} 
                            options={[
                                { label: 'Q1', value: 'Q1' },
                                { label: 'Q2', value: 'Q2' },
                                { label: 'Q3', value: 'Q3' },
                                { label: 'Q4', value: 'Q4' }
                            ]}
                            placeholder="Qtr"
                            className="font-bold text-blue-700 dark:text-blue-400 min-w-[70px]"
                          />
                          <Select 
                            value={parseRelease(formData.quarterly_release).y} 
                            onChange={(v) => {
                                const { q } = parseRelease(formData.quarterly_release);
                                updateField('quarterly_release', `${q} ${v}`.trim());
                            }}
                            options={[
                                { label: '2024', value: '2024' },
                                { label: '2025', value: '2025' },
                                { label: '2026', value: '2026' },
                                { label: '2027', value: '2027' },
                                { label: '2028', value: '2028' }
                            ]}
                            placeholder="Year"
                            className="font-bold text-blue-700 dark:text-blue-400 w-full"
                          />
                      </div>
                   ) : (
                      <DataValue>
                         {formData.quarterly_release ? (
                           <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-xs dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">{formData.quarterly_release}</span>
                         ) : '---'}
                      </DataValue>
                   )}
                </div>

                {/* 3. Status */}
                <div>
                   <Label icon={Activity}>Status</Label>
                   {isEditing ? (
                      <Select 
                        value={formData.status || 'Pending'} 
                        onChange={(v) => updateField('status', v)}
                        options={[
                           { label: 'Pending', value: 'Pending' },
                           { label: 'Launched', value: 'Launched' }
                        ]}
                      />
                   ) : (
                      <DataValue>
                         {formData.status ? (
                           <span className={`font-bold px-2 py-0.5 rounded-md border text-xs ${
                             formData.status === 'Launched' 
                               ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
                               : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                           }`}>
                             {formData.status}
                           </span>
                         ) : '---'}
                      </DataValue>
                   )}
                </div>

                {/* Dates Row: Notified, Announced, Launch */}
                <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                     <Label icon={Bell}>Notified Date</Label>
                     {isEditing ? (
                        <Input type="date" value={formatDateValue(formData.notified_date)} onChange={(v) => updateField('notified_date', v)} />
                     ) : (
                        <DataValue value={formatDateDisplay(formData.notified_date)} />
                     )}
                  </div>
                  <div>
                     <Label icon={Megaphone}>Announced Date</Label>
                     {isEditing ? (
                        <Input type="date" value={formatDateValue(formData.announced_date)} onChange={(v) => updateField('announced_date', v)} />
                     ) : (
                        <DataValue value={formatDateDisplay(formData.announced_date)} />
                     )}
                  </div>
                  <div>
                     <Label icon={Calendar}>Launch Date</Label>
                     {isEditing ? (
                        <Input type="date" value={formatDateValue(formData.launch_date)} onChange={(v) => updateField('launch_date', v)} />
                     ) : (
                        <DataValue value={formatDateDisplay(formData.launch_date)} />
                     )}
                  </div>
                </div>

                {/* Platform, Product Area, Location Row */}
                <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                     <Label icon={Monitor}>Platform</Label>
                     {isEditing ? (
                        <Select
                          value={formData.platform}
                          onChange={(v) => updateField('platform', v)}
                          placeholder="Select Platform"
                          options={[
                            { label: 'UCP', value: 'UCP' },
                            { label: 'Curator', value: 'Curator' },
                            { label: 'FOCUS', value: 'FOCUS' }
                          ]}
                        />
                     ) : (
                        <DataValue>
                          {formData.platform ? (
                             <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${platformColors[formData.platform] || 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                               {formData.platform}
                             </span>
                          ) : '---'}
                        </DataValue>
                     )}
                  </div>
                  <div>
                     <Label icon={Box}>Product Area</Label>
                     {isEditing ? (
                        <Input value={formData.product_area} onChange={(v) => updateField('product_area', v)} placeholder="e.g. Inventory, CRM, Analytics" />
                     ) : (
                        <DataValue value={formData.product_area} />
                     )}
                  </div>
                  <div>
                     <Label icon={MapPin}>Location</Label>
                     {isEditing ? (
                        <Input value={formData.location} onChange={(v) => updateField('location', v)} placeholder="e.g. Global, NA, EMEA" />
                     ) : (
                        <DataValue value={formData.location} />
                     )}
                  </div>
                </div>

                {/* Categories */}
                <div className="col-span-1 md:col-span-3">
                  <Label icon={Tag}>Categories</Label>
                  {isEditing ? (
                    <Input value={formData.categories} onChange={(v) => updateField('categories', v)} placeholder="e.g. Inventory, Performance, UX (comma-separated)" />
                  ) : (
                    <DataValue>
                      {formData.categories ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.categories.split(',').map((cat, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              {cat.trim()}
                            </span>
                          ))}
                        </div>
                      ) : '---'}
                    </DataValue>
                  )}
                </div>

                {/* Navigation (Full Width) */}
                <div className="col-span-1 md:col-span-3">
                  <Label icon={Compass}>Navigation</Label>
                  {isEditing ? (
                    <NavigationChipInput
                      value={formData.navigation || ''}
                      onChange={(v) => updateField('navigation', v)}
                      allFeatures={allFeatures}
                    />
                  ) : (
                    <DataValue>
                      {formData.navigation ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {formData.navigation.split(' > ').map((seg, idx, arr) => (
                            <React.Fragment key={idx}>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                {seg.trim()}
                              </span>
                              {idx < arr.length - 1 && <ChevronRight size={12} className="text-slate-400" />}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : '---'}
                    </DataValue>
                  )}
                </div>
            </div>

            {/* Support Material & PMR Section */}
            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100/60 dark:border-[#38383A] flex flex-col gap-6">
               {/* Support Material */}
               <div>
                  <Label icon={FileText}>Support Material</Label>
                  {isEditing ? (
                     <Input value={formData.support_material_link} onChange={(v) => updateField('support_material_link', v)} placeholder="Doc Link (Google Drive, Confluence, etc.)" />
                  ) : (
                     <DataValue>
                       {formData.support_material_link ? (
                         <a href={formData.support_material_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                           View Documentation <ExternalLink size={10} />
                         </a>
                       ) : '---'}
                     </DataValue>
                  )}
               </div>

               {/* PMR Section */}
               <div className="pt-4 border-t border-slate-200/60 dark:border-[#38383A]">
                  <div className="flex justify-between items-center mb-2">
                     <Label icon={Hash}>PMR Tickets</Label>
                     {isEditing && (
                        <button 
                           type="button" 
                           onClick={addPmr}
                           className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 flex items-center gap-1 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                        >
                           <Plus size={10} /> Add ID
                        </button>
                     )}
                  </div>

                  <div className="space-y-2">
                     {(!formData.pmrs || formData.pmrs.length === 0) && !isEditing && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 italic">No PMRs linked.</div>
                     )}

                     {formData.pmrs?.map((pmr, idx) => (
                        <div key={pmr.id} className="flex gap-2 items-center bg-slate-100/50 dark:bg-[#2C2C2E] p-2 rounded-lg border border-slate-200/60 dark:border-[#38383A] shadow-sm">
                           {isEditing ? (
                              <>
                                 <input 
                                    value={pmr.number} 
                                    onChange={(e) => updatePmr(idx, 'number', e.target.value)} 
                                    placeholder="PMR-####" 
                                    className="w-32 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono font-bold uppercase bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                 />
                                 <input 
                                    value={pmr.link} 
                                    onChange={(e) => updatePmr(idx, 'link', e.target.value)} 
                                    placeholder="https://..." 
                                    className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                 />
                                 <button type="button" onClick={() => removePmr(idx)} className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={14} /></button>
                              </>
                           ) : (
                              <div className="flex items-center gap-2">
                                 {pmr.link ? (
                                    <a href={pmr.link} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                       {pmr.number || 'LINK'} <ExternalLink size={10} />
                                    </a>
                                 ) : (
                                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                                       {pmr.number || '---'}
                                    </span>
                                 )}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Summary Section */}
            <div className="pt-2">
               <Label icon={FileText}>Summary</Label>
               {isEditing ? (
                  <textarea
                    value={formData.summary || ''}
                    onChange={(e) => updateField('summary', e.target.value)}
                    placeholder="Enter a brief summary of this feature..."
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-y"
                  />
               ) : (
                  <div className="w-full px-4 py-3 text-sm border border-slate-100/60 dark:border-[#38383A] bg-slate-50/50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                    {formData.summary || 'No summary provided.'}
                  </div>
               )}
            </div>

            {/* Description Section */}
            <div className="pt-2">
               <Label icon={FileText}>Description</Label>
               {isEditing ? (
                  <RichTextEditor
                    value={formData.description || ''}
                    onChange={(html) => updateField('description', html)}
                    placeholder="Enter full feature description, requirements, and notes here..."
                  />
               ) : (
                  <div
                    className="w-full px-4 py-3 text-sm border border-slate-100/60 dark:border-[#38383A] bg-slate-50/50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed min-h-[100px] [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:my-0.5"
                    dangerouslySetInnerHTML={{ __html: formData.description || 'No description provided.' }}
                  />
               )}
            </div>

            {/* Timestamps */}
            {!isNew && (
              <div className="pt-4 mt-6 border-t border-slate-100/60 dark:border-[#38383A] flex gap-6 text-xs text-slate-400 dark:text-slate-500">
                <span>Added: {new Date(formData.created_at || '').toLocaleDateString()}</span>
                <span>ID: {formData.id}</span>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default NewFeatureDetailPanel;
