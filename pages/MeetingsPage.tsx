
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Meetings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track your meeting notes, dates, and key takeaways.</p>
        </div>
        <button
          onClick={() => { setSelectedMeetingId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
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
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <CalendarDays size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Meetings Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start by adding your first meeting notes.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map(meeting => (
            <div
              key={meeting.id}
              onClick={() => handleRowClick(meeting.id)}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <CalendarDays size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">
                      {meeting.name || 'Untitled Meeting'}
                    </h3>
                    {meeting.date && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex-shrink-0">
                        {formatDate(meeting.date)}
                      </span>
                    )}
                  </div>
                  {meeting.notes && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <FileText size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{stripHtml(meeting.notes)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRowClick(meeting.id); }}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this meeting?')) remove(meeting.id); }}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
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
