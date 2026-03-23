
import React, { useState } from 'react';
import {
  Plus, FileText, CheckSquare, Trash2, Edit3, X, Save,
  RefreshCw, Circle, CheckCircle2, StickyNote, ListTodo
} from 'lucide-react';
import { useNotes, useTasks } from '../hooks';
import { Note, Task, TaskPriority } from '../types';
import RichTextEditor from '../components/RichTextEditor';

// ─── Shared primitives ───────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
    {children}
  </label>
);

const Input = ({
  value, onChange, placeholder = '', type = 'text', className = ''
}: {
  value: any; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string;
}) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-1.5 text-xs border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all ${className}`}
  />
);

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]:   'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  [TaskPriority.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  [TaskPriority.LOW]:    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
};

// ─── Note Form Modal ─────────────────────────────────────────────────────────

interface NoteFormProps {
  initial?: Partial<Note>;
  onSave: (data: Partial<Note>) => void;
  onClose: () => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ initial = {}, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Note>>({
    title: '', content: '', ...initial
  });

  const update = (field: keyof Note, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!formData.title?.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#2C2C2E] shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b border-slate-200/60 dark:border-[#38383A] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <StickyNote size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {initial.id ? 'Edit Note' : 'New Note'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none">
              <Save size={13} /> Save
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(v) => update('title', v)}
              placeholder="Note title..."
              className="text-sm font-semibold"
            />
          </div>
          <div>
            <Label>Content</Label>
            <RichTextEditor
              value={formData.content || ''}
              onChange={(html) => update('content', html)}
              placeholder="Write your note here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Task Form Modal ──────────────────────────────────────────────────────────

interface TaskFormProps {
  initial?: Partial<Task>;
  onSave: (data: Partial<Task>) => void;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initial = {}, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', description: '', priority: TaskPriority.MEDIUM, completed: false, ...initial
  });

  const update = (field: keyof Task, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!formData.title?.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#2C2C2E] shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b border-slate-200/60 dark:border-[#38383A] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <ListTodo size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {initial.id ? 'Edit Task' : 'New Task'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none">
              <Save size={13} /> Save
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          <div>
            <Label>Task Title</Label>
            <Input
              value={formData.title}
              onChange={(v) => update('title', v)}
              placeholder="What needs to be done?"
              className="font-semibold"
            />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-3 py-1.5 text-xs border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-violet-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <select
                value={formData.priority || TaskPriority.MEDIUM}
                onChange={(e) => update('priority', e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200/60 dark:border-[#38383A] rounded-lg focus:ring-1 focus:ring-violet-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
              >
                <option value={TaskPriority.HIGH}>High</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.LOW}>Low</option>
              </select>
            </div>
            <div>
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(v) => update('due_date', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const NotesPage: React.FC = () => {
  const { notes, loading: notesLoading, upsert: upsertNote, remove: removeNote } = useNotes();
  const { tasks, loading: tasksLoading, upsert: upsertTask, remove: removeTask, toggleComplete } = useTasks();

  const [noteForm, setNoteForm] = useState<{ open: boolean; data?: Partial<Note> }>({ open: false });
  const [taskForm, setTaskForm] = useState<{ open: boolean; data?: Partial<Task> }>({ open: false });

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = d < today;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, isOverdue };
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="animate-in fade-in duration-700 h-full">
      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── NOTES COLUMN ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Notes header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <StickyNote size={14} />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</h2>
              <span className="text-xs font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">{notes.length}</span>
            </div>
            <button
              onClick={() => setNoteForm({ open: true, data: undefined })}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
            >
              <Plus size={13} /> Add Note
            </button>
          </div>

          {/* Notes List */}
          {notesLoading ? (
            <div className="rounded-2xl overflow-hidden">
              {[1, 2, 3].map(i => <div key={i} className="h-16 ios-shimmer" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No notes yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Click "Add Note" to get started.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A]">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight line-clamp-1">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => setNoteForm({ open: true, data: note })}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Delete this note?')) removeNote(note.id); }}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {note.content && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {stripHtml(note.content)}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {formatDate(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── TASKS COLUMN ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Tasks header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <CheckSquare size={14} />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tasks</h2>
              <span className="text-xs font-bold px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-full">
                {tasks.length - completedCount} left
              </span>
            </div>
            <button
              onClick={() => setTaskForm({ open: true, data: undefined })}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
            >
              <Plus size={13} /> Add Task
            </button>
          </div>

          {/* Tasks List */}
          {tasksLoading ? (
            <div className="rounded-2xl overflow-hidden">
              {[1, 2, 3].map(i => <div key={i} className="h-16 ios-shimmer" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center">
              <ListTodo size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No tasks yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Click "Add Task" to get started.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A]">
              {tasks.map(task => {
                const dueDateInfo = task.due_date ? formatDueDate(task.due_date) : null;
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className={`mt-0.5 flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none ${
                        task.completed
                          ? 'text-green-500 dark:text-green-400'
                          : 'text-slate-300 dark:text-slate-600 hover:text-violet-500 dark:hover:text-violet-400'
                      }`}
                    >
                      {task.completed
                        ? <CheckCircle2 size={18} />
                        : <Circle size={18} />
                      }
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {task.priority && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                          )}
                          <button
                            onClick={() => setTaskForm({ open: true, data: task })}
                            className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => { if (window.confirm('Delete this task?')) removeTask(task.id); }}
                            className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      {dueDateInfo && (
                        <p className={`text-xs mt-1 font-medium ${dueDateInfo.isOverdue && !task.completed ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          Due {dueDateInfo.label}{dueDateInfo.isOverdue && !task.completed ? ' · Overdue' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Completion summary */}
              {completedCount > 0 && (
                <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-3">
                  {completedCount} of {tasks.length} task{tasks.length !== 1 ? 's' : ''} completed
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Form Panel */}
      {noteForm.open && (
        <NoteForm
          initial={noteForm.data}
          onSave={(data) => upsertNote(data)}
          onClose={() => setNoteForm({ open: false })}
        />
      )}

      {/* Task Form Panel */}
      {taskForm.open && (
        <TaskForm
          initial={taskForm.data}
          onSave={(data) => upsertTask(data)}
          onClose={() => setTaskForm({ open: false })}
        />
      )}
    </div>
  );
};

export default NotesPage;
