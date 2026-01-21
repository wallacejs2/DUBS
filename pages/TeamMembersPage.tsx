
import React, { useState, useMemo } from 'react';
import { Plus, User, Mail, Phone, Hash, Building2, Trash2, Edit3 } from 'lucide-react';
import { useTeamMembers, useDealerships } from '../hooks';
import { TeamMember, TeamRole } from '../types';
import FilterBar from '../components/FilterBar';
import TeamMemberDetailPanel from '../components/TeamMemberDetailPanel';

const TeamMembersPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', role: '' });
  const { members, loading, upsert, remove } = useTeamMembers(filters);
  const { dealerships, getDetails } = useDealerships();
  
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Helper to count linked dealerships for a member
  const getLinkedCount = (memberName: string) => {
    if (!memberName) return 0;
    return dealerships.filter(d => {
        const details = getDetails(d.id);
        if (!details || !details.contacts) return false;
        return (
            details.contacts.sales_contact_name === memberName ||
            details.contacts.enrollment_contact_name === memberName ||
            details.contacts.assigned_specialist_name === memberName
        );
    }).length;
  };

  const activeMember = useMemo(() => {
    if (isCreating) {
      return {
        name: '',
        role: TeamRole.CSM,
        user_id: '',
        email: '',
        phone: '',
        created_at: new Date().toISOString()
      } as Partial<TeamMember>;
    }
    if (selectedMemberId) {
      return members.find(m => m.id === selectedMemberId);
    }
    return null;
  }, [isCreating, selectedMemberId, members]);

  const roleColors: Record<TeamRole, string> = {
    [TeamRole.CSM]: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    [TeamRole.SALES]: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    [TeamRole.ENROLLMENT]: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  };

  const handleRowClick = (id: string) => {
    setSelectedMemberId(id);
    setIsCreating(false);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Team Members</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage internal team roster, roles, and contact information.</p>
        </div>
        <button 
          onClick={() => { setSelectedMemberId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
        >
          <Plus size={16} /> New Team Member
        </button>
      </div>

      <FilterBar 
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({...filters, search: v})}
        searchPlaceholder="Search by name, email or user ID..."
        filters={[
          {
            label: 'Role',
            value: filters.role,
            onChange: (v) => setFilters({...filters, role: v}),
            options: Object.values(TeamRole).map(r => ({ label: r, value: r }))
          }
        ]}
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <User size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Team Members Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start by adding your internal team members to the system.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {members.map(member => (
            <div 
              key={member.id} 
              onClick={() => handleRowClick(member.id)}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
               <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-base flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">{member.name}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${roleColors[member.role]}`}>
                           {member.role}
                        </span>
                     </div>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {member.email && (
                           <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-400" />
                              <span className="truncate">{member.email}</span>
                           </div>
                        )}
                        {member.phone && (
                           <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400" />
                              <span>{member.phone}</span>
                           </div>
                        )}
                        {member.user_id && (
                           <div className="flex items-center gap-1.5">
                              <Hash size={12} className="text-slate-400" />
                              <span className="font-mono">{member.user_id}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                     <Building2 size={14} className="text-slate-400" />
                     <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Linked</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-none">{getLinkedCount(member.name)}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRowClick(member.id); }}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete team member?')) remove(member.id); }}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {activeMember && (
        <TeamMemberDetailPanel 
          member={activeMember}
          onClose={() => { setSelectedMemberId(null); setIsCreating(false); }}
          onUpdate={(data) => upsert(data)}
          onDelete={() => {
            if (activeMember.id && window.confirm('Are you sure you want to delete this team member?')) {
              remove(activeMember.id);
              setSelectedMemberId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default TeamMembersPage;
