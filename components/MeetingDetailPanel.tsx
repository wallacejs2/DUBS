
import React, { useState, useEffect } from 'react';
import {
  X, Trash2, Edit3, Save, RefreshCw,
  CalendarDays
} from 'lucide-react';
import { Meeting } from '../types';
import RichTextEditor from './RichTextEditor';

interface MeetingDetailPanelProps {
  meeting: Partial<Meeting>;
  onClose: () => void;
  onUpdate: (data: Partial<Meeting>) => void;
  onDelete: () => void;
}

const Label = ({ children, icon: Icon }: { children?: React.ReactNode, icon?: any }) => (
  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">
    {Icon && <Icon size={10} />}
    {children}
  </label>
);

const DataValue = ({ value, children }: { value?: any, children?: React.ReactNode }) => (
  <div className="text-sm font-normal text-slate-700 dark:text-slate-300 leading-tight min-h-[1.5em] flex items-center">
    {children || value || '---'}
  </div>
);

const Input = ({ value, onChange, type = "text", className = "", placeholder = "" }: { value: any, onChange: (v: string) => void, type?: string, className?: string, placeholder?: string }) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-1.5 text-sm border border-slate-200/60 dark:border-[#38383A] rounded-xl focus:ring-1 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none bg-slate-100/50 dark:bg-[#2C2C2E] text-slate-900 dark:text-slate-100 font-normal transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${className}`}
  />
);

const MeetingDetailPanel: React.FC<MeetingDetailPanelProps> = ({
  meeting, onClose, onUpdate, onDelete
}) => {
  const isNew = !meeting.id;
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState<Partial<Meeting>>(meeting);

  useEffect(() => {
    setFormData(meeting);
  }, [meeting]);

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
      setFormData(meeting);
      setIsEditing(false);
    }
  };

  const updateField = (field: keyof Meeting, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={isEditing && isNew ? undefined : onClose}></div>
      <div className="relative w-full max-w-3xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl h-full flex flex-col animate-in slide-in-from-right duration-300 rounded-l-2xl transition-colors">
        {/* Grabber pill */}
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-9 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-[#38383A] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl">
          <div className="p-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isNew ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                <CalendarDays size={20} />
              </div>
              <div>
                {isEditing ? (
                  <div className="w-full">
                    <Input
                      value={formData.name}
                      onChange={(v) => updateField('name', v)}
                      placeholder="Name of Meeting"
                      className="font-bold text-lg"
                    />
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formData.name || 'Untitled Meeting'}</h2>
                )}
                {!isEditing && formData.date && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatDate(formData.date)}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none flex items-center gap-2">
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
              <button onClick={onClose} className="p-2 text-slate-300 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"><X size={20} /></button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white/95 dark:bg-[#1C1C1E]/95 custom-scrollbar transition-colors">
          <div className="space-y-6">

            {/* Date Field */}
            <div>
              <Label icon={CalendarDays}>Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(v) => updateField('date', v)}
                />
              ) : (
                <DataValue value={formatDate(formData.date)} />
              )}
            </div>

            {/* Notes Field */}
            <div className="pt-4 border-t border-slate-100/60 dark:border-[#38383A]">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Meeting Notes</h3>
              {isEditing ? (
                <RichTextEditor
                  value={formData.notes || ''}
                  onChange={(html) => updateField('notes', html)}
                  placeholder="Type your meeting notes here..."
                />
              ) : (
                formData.notes ? (
                  <div
                    className="text-sm font-normal text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-white/[0.02] rounded-lg p-4 border border-slate-100 dark:border-slate-700 min-h-[200px] [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:my-0.5"
                    dangerouslySetInnerHTML={{ __html: formData.notes }}
                  />
                ) : (
                  <div className="text-sm font-normal text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-white/[0.02] rounded-lg p-4 border border-slate-100 dark:border-slate-700 min-h-[200px]">
                    <span className="text-slate-400 dark:text-slate-500 italic">No notes recorded.</span>
                  </div>
                )
              )}
            </div>

            {/* Timestamps */}
            {!isNew && (
              <div className="pt-4 mt-4 border-t border-slate-100/60 dark:border-[#38383A] flex gap-6 text-xs text-slate-400 dark:text-slate-500">
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

export default MeetingDetailPanel;
