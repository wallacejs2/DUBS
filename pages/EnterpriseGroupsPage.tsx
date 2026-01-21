
import React, { useState } from 'react';
import { Plus, Users, X, Edit3, Trash2 } from 'lucide-react';
import { useEnterpriseGroups, useDealerships } from '../hooks';
import { EnterpriseGroup } from '../types';
import EnterpriseGroupDetailPanel from '../components/EnterpriseGroupDetailPanel';
import DealershipDetailPanel from '../components/DealershipDetailPanel';

const EnterpriseGroupsPage: React.FC = () => {
  const { groups, loading, upsert, remove } = useEnterpriseGroups();
  const { dealerships, getDetails, upsert: upsertDealer, remove: removeDealer } = useDealerships();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<EnterpriseGroup> | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup?.name) {
      upsert(editingGroup);
      setIsModalOpen(false);
      setEditingGroup(null);
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedDealerDetails = selectedDealerId ? getDetails(selectedDealerId) : null;
  
  const groupDealerships = selectedGroupId 
    ? dealerships.filter(d => d.enterprise_group_id === selectedGroupId)
    : [];

  const handleDeleteFromPanel = () => {
    if (selectedGroupId && window.confirm(`Delete ${selectedGroup?.name}?`)) {
      remove(selectedGroupId);
      setSelectedGroupId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Enterprise Groups</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Organize and categorize your dealerships by parent groups.</p>
        </div>
        <button 
          onClick={() => { setEditingGroup({}); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
        >
          <Plus size={16} /> Create New Group
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 dark:text-slate-600">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Enterprise Groups</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Group your dealerships for better organization and reporting.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(group => (
            <div 
              key={group.id} 
              onClick={() => setSelectedGroupId(group.id)}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-base group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">{group.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase rounded-md border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:border-indigo-100 dark:group-hover:border-indigo-800 transition-all">
                      {group.dealershipCount} Dealerships
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => { setEditingGroup(group); setIsModalOpen(true); }}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => window.confirm(`Delete ${group.name}?`) && remove(group.id)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editingGroup?.id ? 'Edit Group' : 'New Group'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">Group Name</label>
                <input 
                  required
                  value={editingGroup?.name || ''} 
                  onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-normal text-slate-900 dark:text-slate-100"
                  placeholder="e.g. Hendrick Automotive"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">PP Sys ID</label>
                  <input 
                    value={editingGroup?.pp_sys_id || ''} 
                    onChange={e => setEditingGroup({...editingGroup, pp_sys_id: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-normal text-slate-900 dark:text-slate-100 font-mono"
                    placeholder="PP-###"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">ERA ID</label>
                  <input 
                    value={editingGroup?.era_system_id || ''} 
                    onChange={e => setEditingGroup({...editingGroup, era_system_id: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-normal text-slate-900 dark:text-slate-100 font-mono"
                    placeholder="ERA-###"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-slate-400 dark:text-slate-500 font-bold text-[11px] hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all text-[11px] dark:shadow-none"
                >
                  {editingGroup?.id ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedGroup && !selectedDealerId && (
        <EnterpriseGroupDetailPanel 
          group={selectedGroup}
          dealerships={groupDealerships}
          onClose={() => setSelectedGroupId(null)}
          onUpdate={(data) => upsert(data)}
          onDelete={handleDeleteFromPanel}
          onViewDealer={(id) => setSelectedDealerId(id)}
        />
      )}

      {selectedDealerId && selectedDealerDetails && (
        <DealershipDetailPanel 
          dealership={selectedDealerDetails}
          groups={groups}
          onClose={() => { setSelectedDealerId(null); setSelectedGroupId(null); }}
          onBack={() => setSelectedDealerId(null)}
          onUpdate={(data) => upsertDealer(data)}
          onDelete={() => {
             if (window.confirm('Are you sure you want to delete this dealership?')) {
                removeDealer(selectedDealerId);
                setSelectedDealerId(null);
             }
          }}
        />
      )}
    </div>
  );
};

export default EnterpriseGroupsPage;
