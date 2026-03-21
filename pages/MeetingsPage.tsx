
import React, { useState, useMemo } from 'react';
import { Plus, CalendarDays, Trash2, Edit3, FileText } from 'lucide-react';
import { useMeetings } from '../hooks';
import { Meeting } from '../types';
import FilterBar from '../components/FilterBar';
import MeetingDetailPanel from '../components/MeetingDetailPanel';

const MeetingsPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '' });
  const { meetings, loading, upsert, remove } = useMeetings(filters);

  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeMeeting = useMemo(() => {
    if (isCreating) {
      return {
        name: '',
        date: '',
        notes: '',
        created_at: new Date().toISOString()
      } as Partial<Meeting>;
    }
    if (selectedMeetingId) {
      return meetings.find(m => m.id === selectedMeetingId);
    }
    return null;
  }, [isCreating, selectedMeetingId, meetings]);

  const handleRowClick = (id: string) => {
    setSelectedMeetingId(id);
    setIsCreating(false);
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => { setSelectedMeetingId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
        >
          <Plus size={16} /> New Meeting
        </button>
      </div>

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({ ...filters, search: v })}
        searchPlaceholder="Search by meeting name or notes..."
      />

      {loading ? (
        <div className="rounded-2xl overflow-hidden">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 ios-shimmer"></div>)}
        </div>
      ) : meetings.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarDays size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Meetings Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start by adding your first meeting notes.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A]">
          {meetings.map(meeting => (
            <div
              key={meeting.id}
              onClick={() => handleRowClick(meeting.id)}
              className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <CalendarDays size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                      {meeting.name || 'Untitled Meeting'}
                    </h3>
                    {meeting.date && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-[#38383A] flex-shrink-0">
                        {formatDate(meeting.date)}
                      </span>
                    )}
                  </div>
                  {meeting.notes && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <FileText size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{stripHtml(meeting.notes)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRowClick(meeting.id); }}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this meeting?')) remove(meeting.id); }}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMeeting && (
        <MeetingDetailPanel
          meeting={activeMeeting}
          onClose={() => { setSelectedMeetingId(null); setIsCreating(false); }}
          onUpdate={(data) => upsert(data)}
          onDelete={() => {
            if (activeMeeting.id && window.confirm('Are you sure you want to delete this meeting?')) {
              remove(activeMeeting.id);
              setSelectedMeetingId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default MeetingsPage;
