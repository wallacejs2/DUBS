import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Edit3, Trash2, Info, Users, Save, RefreshCw } from 'lucide-react';
import { EnterpriseGroup, Dealership, DealershipStatus } from '../types';

interface EnterpriseGroupDetailPanelProps {
  group: EnterpriseGroup;
  dealerships: Dealership[];
  onClose: () => void;
  onUpdate: (data: Partial<EnterpriseGroup>) => void;
  onDelete: () => void;
  onViewDealer: (id: string) => void;
}

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="mt-12 mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-indigo-500" />
      <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">
        {title}
      </h3>
    </div>
  </div>
);

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
    {children}
  </label>
);

const EnterpriseGroupDetailPanel: React.FC<EnterpriseGroupDetailPanelProps> = ({ 
  group, 
  dealerships, 
  onClose,
  onUpdate,
  onDelete,
  onViewDealer
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EnterpriseGroup>(group);

  useEffect(() => {
    setFormData(group);
  }, [group]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(group);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={isEditing ? undefined : onClose}></div>
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0 z-30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-sm">
                GROUP HIERARCHY
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tighter">GRP_{group.id.slice(0, 8).toUpperCase()}</span>
            </div>
            {isEditing ? (
               <input 
                 value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                 className="text-2xl font-bold text-slate-900 tracking-tight leading-none w-full border-b border-indigo-200 outline-none focus:border-indigo-500 pb-1"
                 placeholder="Group Name"
               />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{group.name}</h2>
            )}
          </div>
          <div className="flex gap-2 ml-6">
            {isEditing ? (
              <>
                 <button 
                  onClick={handleSave}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
                  title="Save Changes"
                >
                  <Save size={16} /> <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Save</span>
                </button>
                <button 
                  onClick={handleCancel}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-all"
                  title="Cancel Editing"
                >
                  <RefreshCw size={16} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                title="Edit Group"
              >
                <Edit3 size={20} />
              </button>
            )}
            {!isEditing && (
              <>
                <button 
                  onClick={onDelete} 
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                  title="Delete Group"
                >
                  <Trash2 size={20} />
                </button>
                <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          <div className="animate-in fade-in duration-500">
            
            {/* Corporate Profile */}
            <SectionHeader title="Corporate Profile" icon={Info} />
            <div className="px-1 mb-10">
              <Label>Executive Summary</Label>
              {isEditing ? (
                <textarea 
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full h-32 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-normal resize-none"
                  placeholder="Enter description..."
                />
              ) : (
                <p className="text-[12px] text-slate-700 font-medium leading-relaxed italic">
                  {group.description || 'No descriptive information available.'}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-8 px-1">
              <div>
                <Label>Asset Inventory</Label>
                <div className="text-2xl font-medium text-slate-900 tracking-tighter">{dealerships.length} Units</div>
              </div>
              <div>
                <Label>Portfolio Health</Label>
                <div className="text-2xl font-medium text-indigo-600 tracking-tighter">
                  {dealerships.length > 0 
                    ? `${Math.round((dealerships.filter(d => d.status === DealershipStatus.LIVE).length / dealerships.length) * 100)}% ACTIVE` 
                    : '0% ACTIVE'}
                </div>
              </div>
            </div>

            {/* Entities List */}
            <SectionHeader title="Associated Ledger Entities" icon={Users} />
            <div className="px-1 pb-16">
              {dealerships.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">Zero Entities Assigned</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {dealerships.map((dealer) => (
                    <div 
                      key={dealer.id} 
                      className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => onViewDealer(dealer.id)}
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-slate-900 truncate tracking-tight">{dealer.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{dealer.city}, {dealer.state}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none bg-slate-100 text-slate-600`}>
                          {dealer.status}
                        </span>
                        <ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">System Timestamp: {new Date(group.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseGroupDetailPanel;