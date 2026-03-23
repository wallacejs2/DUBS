
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
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => { setEditingGroup({}); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
        >
          <Plus size={16} /> Create New Group
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="h-20 ios-shimmer"></div>)}
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Enterprise Groups</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Group your dealerships for better organization and reporting.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A]">
          {groups.map(group => (
            <div
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-base group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">{group.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-md group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-all">
                      {group.dealershipCount} Dealerships
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setEditingGroup(group); setIsModalOpen(true); }}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => window.confirm(`Delete ${group.name}?`) && remove(group.id)}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editingGroup?.id ? 'Edit Group' : 'New Group'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1 block">Group Name</label>
                <input
                  required
                  value={editingGroup?.name || ''}
                  onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-[#38383A] outline-none focus:ring-1 focus:ring-blue-500 transition-all font-normal text-slate-900 dark:text-slate-100"
                  placeholder="e.g. Hendrick Automotive"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1 block">PP Sys ID</label>
                  <input
                    value={editingGroup?.pp_sys_id || ''}
                    onChange={e => setEditingGroup({...editingGroup, pp_sys_id: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-[#38383A] outline-none focus:ring-1 focus:ring-blue-500 transition-all font-normal text-slate-900 dark:text-slate-100 font-mono"
                    placeholder="PP-###"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1 block">ERA ID</label>
                  <input
                    value={editingGroup?.era_system_id || ''}
                    onChange={e => setEditingGroup({...editingGroup, era_system_id: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-[#38383A] outline-none focus:ring-1 focus:ring-blue-500 transition-all font-normal text-slate-900 dark:text-slate-100 font-mono"
                    placeholder="ERA-###"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-slate-400 dark:text-slate-500 font-semibold text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
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
