
import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, 
  Sparkles, Calendar, MapPin, Monitor, Hash, Link, ExternalLink, FileText, Clock, AlertCircle, Activity, Compass, Plus
} from 'lucide-react';
import { NewFeature, PMR } from '../types';

interface NewFeatureDetailPanelProps {
  feature: Partial<NewFeature>;
  onClose: () => void;
  onUpdate: (data: Partial<NewFeature>) => void;
  onDelete: () => void;
}

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

const Input = ({ value, onChange, type = "text", className = "", placeholder="", required = false }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string, required?: boolean }) => (
  <input 
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    required={required}
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal transition-all ${className}`}
  />
);

const Select = ({ value, onChange, options, className = "", placeholder }: { value: any, onChange: (v: string) => void, options: { label: string, value: string }[], className?: string, placeholder?: string }) => (
  <select 
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-normal transition-all ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const platformColors: Record<string, string> = {
  'UCP': 'bg-blue-50 text-blue-700 border-blue-100',
  'Curator': 'bg-purple-50 text-purple-700 border-purple-100',
  'FOCUS': 'bg-orange-50 text-orange-700 border-orange-100',
};

const NewFeatureDetailPanel: React.FC<NewFeatureDetailPanelProps> = ({ 
  feature, onClose, onUpdate, onDelete
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing && isNew ? undefined : onClose}></div>
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Sticky Header */}
        <div className="bg-white sticky top-0 z-30 border-b border-slate-100 shadow-sm">
          <div className="p-4 flex justify-between items-center gap-4">
             <div className="flex items-center gap-3 w-full">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0 ${isNew ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
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
                   <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{formData.title}</h2>
                 )}
               </div>
             </div>

             <div className="flex items-center gap-2 flex-shrink-0">
               {isEditing ? (
                 <>
                   <button onClick={() => handleSave()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-100 flex items-center gap-2 transition-all">
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
        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
          <form onSubmit={handleSave} className="space-y-6 mx-auto">
            
            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 1. Type */}
                <div>
                   <Label icon={AlertCircle}>Type</Label>
                   {isEditing ? (
                      <Select 
                        value={formData.type || 'New'} 
                        onChange={(v) => updateField('type', v)}
                        options={[
                           { label: 'New', value: 'New' },
                           { label: 'Updated', value: 'Updated' }
                        ]}
                      />
                   ) : (
                      <DataValue>
                         {formData.type ? (
                           <span className={`font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                             formData.type === 'New' 
                               ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                               : 'bg-blue-50 text-blue-700 border-blue-100'
                           }`}>
                             {formData.type}
                           </span>
                         ) : '---'}
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
                            className="font-bold text-indigo-700 min-w-[70px]"
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
                            className="font-bold text-indigo-700 w-full"
                          />
                      </div>
                   ) : (
                      <DataValue>
                         {formData.quarterly_release ? (
                           <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]">{formData.quarterly_release}</span>
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
                           <span className={`font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                             formData.status === 'Launched' 
                               ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                               : 'bg-purple-50 text-purple-700 border-purple-100'
                           }`}>
                             {formData.status}
                           </span>
                         ) : '---'}
                      </DataValue>
                   )}
                </div>

                {/* 4. Launch Date */}
                <div>
                   <Label icon={Calendar}>Launch Date</Label>
                   {isEditing ? (
                      <Input type="date" value={formatDateValue(formData.launch_date)} onChange={(v) => updateField('launch_date', v)} />
                   ) : (
                      <DataValue value={formData.launch_date} />
                   )}
                </div>
                
                {/* Platform and Location */}
                <div className="col-span-1 md:col-span-2">
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
                           <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${platformColors[formData.platform] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                             {formData.platform}
                           </span>
                        ) : '---'}
                      </DataValue>
                   )}
                </div>
                <div className="col-span-1 md:col-span-2">
                   <Label icon={MapPin}>Location</Label>
                   {isEditing ? (
                      <Input value={formData.location} onChange={(v) => updateField('location', v)} placeholder="e.g. Global, NA, EMEA" />
                   ) : (
                      <DataValue value={formData.location} />
                   )}
                </div>

                {/* Navigation (Full Width) */}
                <div className="col-span-1 md:col-span-4">
                  <Label icon={Compass}>Navigation</Label>
                  {isEditing ? (
                    <Input value={formData.navigation} onChange={(v) => updateField('navigation', v)} placeholder="Inventory > Settings > ..." />
                  ) : (
                    <DataValue value={formData.navigation} />
                  )}
                </div>
            </div>

            {/* Support Material & PMR Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-6">
               {/* Support Material */}
               <div>
                  <Label icon={FileText}>Support Material</Label>
                  {isEditing ? (
                     <Input value={formData.support_material_link} onChange={(v) => updateField('support_material_link', v)} placeholder="Doc Link (Google Drive, Confluence, etc.)" />
                  ) : (
                     <DataValue>
                       {formData.support_material_link ? (
                         <a href={formData.support_material_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                           View Documentation <ExternalLink size={10} />
                         </a>
                       ) : '---'}
                     </DataValue>
                  )}
               </div>

               {/* PMR Section */}
               <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                     <Label icon={Hash}>PMR Tickets</Label>
                     {isEditing && (
                        <button 
                           type="button" 
                           onClick={addPmr}
                           className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 flex items-center gap-1"
                        >
                           <Plus size={10} /> Add ID
                        </button>
                     )}
                  </div>

                  <div className="space-y-2">
                     {(!formData.pmrs || formData.pmrs.length === 0) && !isEditing && (
                        <div className="text-[11px] text-slate-400 italic">No PMRs linked.</div>
                     )}

                     {formData.pmrs?.map((pmr, idx) => (
                        <div key={pmr.id} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                           {isEditing ? (
                              <>
                                 <input 
                                    value={pmr.number} 
                                    onChange={(e) => updatePmr(idx, 'number', e.target.value)} 
                                    placeholder="PMR-####" 
                                    className="w-32 px-2 py-1 text-[11px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold uppercase"
                                 />
                                 <input 
                                    value={pmr.link} 
                                    onChange={(e) => updatePmr(idx, 'link', e.target.value)} 
                                    placeholder="https://..." 
                                    className="flex-1 px-2 py-1 text-[11px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                 />
                                 <button type="button" onClick={() => removePmr(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                              </>
                           ) : (
                              <div className="flex items-center gap-2">
                                 {pmr.link ? (
                                    <a href={pmr.link} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                       {pmr.number || 'LINK'} <ExternalLink size={10} />
                                    </a>
                                 ) : (
                                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
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

            {/* Description Section */}
            <div className="pt-2">
               <Label icon={FileText}>Description</Label>
               {isEditing ? (
                  <textarea 
                    value={formData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full px-4 py-3 text-[13px] border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 placeholder:text-slate-300 min-h-[300px] leading-relaxed resize-y"
                    placeholder="Enter full feature description, requirements, and notes here..."
                  />
               ) : (
                  <div className="w-full px-4 py-3 text-[13px] border border-slate-100 bg-slate-50/50 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                    {formData.description || 'No description provided.'}
                  </div>
               )}
            </div>

            {/* Timestamps */}
            {!isNew && (
              <div className="pt-4 mt-6 border-t border-slate-100 flex gap-6 text-[10px] text-slate-400">
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
