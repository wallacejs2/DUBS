
import React, { useState, useMemo } from 'react';
import { Plus, User, Mail, Phone, Hash, Building2, Trash2, Edit3 } from 'lucide-react';
import { useTeamMembers, useDealerships } from '../hooks';
import { TeamMember, TeamRole, DealershipStatus } from '../types';
import FilterBar from '../components/FilterBar';
import TeamMemberDetailPanel from '../components/TeamMemberDetailPanel';

const TeamMembersPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', role: '' });
  const { members, loading, upsert, remove } = useTeamMembers(filters);
  const { dealerships, getDetails } = useDealerships();

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Helper to count linked dealerships for a member, excluding cancelled
  const getLinkedCount = (memberName: string) => {
    if (!memberName) return 0;
    return dealerships.filter(d => {
        if (d.status === DealershipStatus.CANCELLED) return false;

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
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => { setSelectedMemberId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
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
        <div className="rounded-2xl overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="h-16 ios-shimmer"></div>)}
        </div>
      ) : members.length === 0 ? (
        <div className="py-16 text-center">
          <User size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Team Members Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start by adding your internal team members to the system.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A]">
          {members.map(member => (
            <div
              key={member.id}
              onClick={() => handleRowClick(member.id)}
              className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
            >
               <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-base flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                     {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">{member.name}</h3>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${roleColors[member.role]}`}>
                           {member.role}
                        </span>
                     </div>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
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

               <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100/60 dark:border-[#38383A]">
                     <Building2 size={14} className="text-slate-400" />
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase leading-none">Linked</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-none">{getLinkedCount(member.name)}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRowClick(member.id); }}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete team member?')) remove(member.id); }}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                      >
                        <Trash2 size={14} />
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
