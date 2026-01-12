
import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, 
  Sparkles, Calendar, MapPin, Monitor, Hash, Link, ExternalLink, FileText
} from 'lucide-react';
import { NewFeature } from '../types';

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

const NewFeatureDetailPanel: React.FC<NewFeatureDetailPanelProps> = ({ 
  feature, onClose, onUpdate, onDelete
}) => {
  const isNew = !feature.id;
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState<Partial<NewFeature>>(feature);

  useEffect(() => {
    setFormData(feature);
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
      setFormData(feature);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <Label icon={Monitor}>Platform</Label>
                   {isEditing ? (
                      <Input value={formData.platform} onChange={(v) => updateField('platform', v)} placeholder="e.g. Mobile, Web, CRM" />
                   ) : (
                      <DataValue value={formData.platform} />
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
                <div>
                   <Label icon={Calendar}>Launch Date</Label>
                   {isEditing ? (
                      <Input type="date" value={formatDateValue(formData.launch_date)} onChange={(v) => updateField('launch_date', v)} />
                   ) : (
                      <DataValue value={formData.launch_date} />
                   )}
                </div>
            </div>

            {/* PMR Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <Label icon={Hash}>PMR Number</Label>
                  {isEditing ? (
                     <Input value={formData.pmr_number} onChange={(v) => updateField('pmr_number', v)} placeholder="PMR-####" className="font-mono" />
                  ) : (
                     <DataValue value={formData.pmr_number} mono />
                  )}
               </div>
               <div>
                  <Label icon={Link}>PMR Link</Label>
                  {isEditing ? (
                     <Input value={formData.pmr_link} onChange={(v) => updateField('pmr_link', v)} placeholder="https://..." />
                  ) : (
                     <DataValue>
                       {formData.pmr_link ? (
                         <a href={formData.pmr_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                           Open Ticket <ExternalLink size={10} />
                         </a>
                       ) : '---'}
                     </DataValue>
                  )}
               </div>
               <div className="md:col-span-2">
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
