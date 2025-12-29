
import React, { useState } from 'react';
import { Plus, Users, Search, MoreVertical, Trash2, Edit3, X, Save } from 'lucide-react';
import { useEnterpriseGroups, useDealerships } from '../hooks';
import { EnterpriseGroup } from '../types';
import EnterpriseGroupDetailPanel from '../components/EnterpriseGroupDetailPanel';

const EnterpriseGroupsPage: React.FC = () => {
  const { groups, loading, upsert, remove } = useEnterpriseGroups();
  const { dealerships } = useDealerships();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<EnterpriseGroup> | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup?.name) {
      upsert(editingGroup);
      setIsModalOpen(false);
      setEditingGroup(null);
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const groupDealerships = selectedGroupId 
    ? dealerships.filter(d => d.enterprise_group_id === selectedGroupId)
    : [];

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Enterprise Groups</h1>
          <p className="text-xs text-slate-500 mt-0.5">Organize and categorize your dealerships by parent groups.</p>
        </div>
        <button 
          onClick={() => { setEditingGroup({}); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={16} /> Create New Group
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
          <Users className="mx-auto text-slate-200 mb-4" size={40} />
          <h3 className="text-xl font-bold text-slate-800">No Enterprise Groups</h3>
          <p className="text-xs text-slate-500 mt-1">Group your dealerships for better organization and reporting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => (
            <div 
              key={group.id} 
              onClick={() => setSelectedGroupId(group.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-base group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
                  {group.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight truncate">{group.name}</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-1">{group.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase rounded-full border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                      {group.dealershipCount} Dealerships
                    </span>
                    <span className="text-[9px] text-slate-300 font-medium">Created {new Date(group.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => { setEditingGroup(group); setIsModalOpen(true); }}
                  className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => window.confirm(`Delete ${group.name}?`) && remove(group.id)}
                  className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">{editingGroup?.id ? 'Edit Group' : 'New Group'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Group Name</label>
                <input 
                  required
                  value={editingGroup?.name || ''} 
                  onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
                  className="w-full px-3 py-2 text-[11px] bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="e.g. Hendrick Automotive"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Description</label>
                <textarea 
                  value={editingGroup?.description || ''} 
                  onChange={e => setEditingGroup({...editingGroup, description: e.target.value})}
                  className="w-full px-3 py-2 text-[11px] bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium h-24 resize-none"
                  placeholder="Describe the group..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-slate-400 font-bold text-[11px] hover:text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all text-[11px]"
                >
                  {editingGroup?.id ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedGroup && (
        <EnterpriseGroupDetailPanel 
          group={selectedGroup}
          dealerships={groupDealerships}
          onClose={() => setSelectedGroupId(null)}
          onViewDealer={(id) => {
            setSelectedGroupId(null);
          }}
        />
      )}
    </div>
  );
};

export default EnterpriseGroupsPage;
