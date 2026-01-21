
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Trash2, Edit3, Save, RefreshCw, 
  User, Mail, Phone, Hash, Building2, Check, ArrowRight
} from 'lucide-react';
import { TeamMember, TeamRole, DealershipStatus } from '../types';
import { useDealerships } from '../hooks';

interface TeamMemberDetailPanelProps {
  member: Partial<TeamMember>;
  onClose: () => void;
  onUpdate: (data: Partial<TeamMember>) => void;
  onDelete: () => void;
}

const roleColors: Record<TeamRole, string> = {
  [TeamRole.CSM]: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  [TeamRole.SALES]: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [TeamRole.ENROLLMENT]: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
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

const TeamMemberDetailPanel: React.FC<TeamMemberDetailPanelProps> = ({ 
  member, onClose, onUpdate, onDelete
}) => {
  const isNew = !member.id;
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState<Partial<TeamMember>>(member);
  
  // Use hooks to find linked dealerships
  const { dealerships, getDetails } = useDealerships();

  // Filter linked dealerships based on name match
  const linkedDealerships = useMemo(() => {
    if (!member.name || isNew) return [];
    
    return dealerships.filter(d => {
        const details = getDetails(d.id);
        if (!details || !details.contacts) return false;
        
        return (
            details.contacts.sales_contact_name === member.name ||
            details.contacts.enrollment_contact_name === member.name ||
            details.contacts.assigned_specialist_name === member.name
        );
    });
  }, [dealerships, member.name, isNew, getDetails]);

  useEffect(() => {
    setFormData(member);
  }, [member]);

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
      setFormData(member);
      setIsEditing(false);
    }
  };

  const updateField = (field: keyof TeamMember, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing && isNew ? undefined : onClose}></div>
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-colors">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="p-4 flex justify-between items-center gap-4">
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isNew ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                 <User size={20} />
               </div>
               <div>
                 {isEditing ? (
                   <div className="w-full">
                     <Input 
                       value={formData.name} 
                       onChange={(v) => updateField('name', v)} 
                       placeholder="Full Name" 
                       className="font-bold text-lg" 
                     />
                   </div>
                 ) : (
                   <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formData.name}</h2>
                 )}
                 {!isEditing && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formData.email}</p>}
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
            
            {/* Role & ID Section */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label>Role</Label>
                  {isEditing ? (
                    <Select 
                       value={formData.role || TeamRole.CSM}
                       onChange={(v) => updateField('role', v as TeamRole)}
                       options={Object.values(TeamRole).map(s => ({ label: s, value: s }))}
                    />
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${roleColors[formData.role || TeamRole.CSM]}`}>
                      {formData.role}
                    </span>
                  )}
               </div>
               <div>
                  <Label icon={Hash}>User ID</Label>
                  {isEditing ? (
                    <Input value={formData.user_id} onChange={(v) => updateField('user_id', v)} placeholder="e.g. jsmith22" className="font-mono" />
                  ) : (
                    <DataValue mono value={formData.user_id} />
                  )}
               </div>
            </div>

            {/* Contact Info */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <Label icon={Mail}>Email Address</Label>
                  {isEditing ? (
                    <Input type="email" value={formData.email} onChange={(v) => updateField('email', v)} />
                  ) : (
                    <DataValue>
                      <a href={`mailto:${formData.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{formData.email}</a>
                    </DataValue>
                  )}
                </div>
                <div>
                  <Label icon={Phone}>Phone Number</Label>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      onBlur={(e) => updateField('phone', formatPhone(e.target.value))}
                      placeholder="(###) ###-####"
                      className="w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  ) : (
                    <DataValue value={formatPhone(formData.phone)} />
                  )}
                </div>
              </div>
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
                            No dealerships linked to this team member.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {linkedDealerships.map(d => (
                                <div key={d.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
                                            <Building2 size={12} />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{d.name}</div>
                                            <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{d.pp_sys_id}</div>
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

export default TeamMemberDetailPanel;
