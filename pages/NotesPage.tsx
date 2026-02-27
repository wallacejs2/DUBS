
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
  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
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
    className={`w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all ${className}`}
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <StickyNote size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {initial.id ? 'Edit Note' : 'New Note'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all">
              <Save size={13} /> Save
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <ListTodo size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {initial.id ? 'Edit Task' : 'New Task'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-violet-700 flex items-center gap-1.5 shadow-md shadow-violet-100 transition-all">
              <Save size={13} /> Save
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
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
              className="w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-violet-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <select
                value={formData.priority || TaskPriority.MEDIUM}
                onChange={(e) => update('priority', e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 text-[12px] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-violet-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
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
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Notes & Tasks</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {notes.length} note{notes.length !== 1 ? 's' : ''} · {tasks.length - completedCount} task{tasks.length - completedCount !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── NOTES COLUMN ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Notes header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <StickyNote size={14} />
              </div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Notes</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">{notes.length}</span>
            </div>
            <button
              onClick={() => setNoteForm({ open: true, data: undefined })}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
            >
              <Plus size={13} /> Add Note
            </button>
          </div>

          {/* Notes List */}
          {notesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 transition-colors">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <FileText size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No notes yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Click "Add Note" to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => setNoteForm({ open: true, data: note })}
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm('Delete this note?')) removeNote(note.id); }}
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {note.content && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {stripHtml(note.content)}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                      {formatDate(note.created_at)}
                    </p>
                  </div>
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
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tasks</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-full">
                {tasks.length - completedCount} left
              </span>
            </div>
            <button
              onClick={() => setTaskForm({ open: true, data: undefined })}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold shadow-md shadow-violet-100 hover:bg-violet-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
            >
              <Plus size={13} /> Add Task
            </button>
          </div>

          {/* Tasks List */}
          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 transition-colors">
              <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-violet-400">
                <ListTodo size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No tasks yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Click "Add Task" to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map(task => {
                const dueDateInfo = task.due_date ? formatDueDate(task.due_date) : null;
                return (
                  <div
                    key={task.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm transition-all group ${
                      task.completed
                        ? 'border-slate-100 dark:border-slate-800/50 opacity-60'
                        : 'border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700'
                    }`}
                  >
                    <div className="p-3.5 flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className={`mt-0.5 flex-shrink-0 transition-colors ${
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
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </span>
                            )}
                            <button
                              onClick={() => setTaskForm({ open: true, data: task })}
                              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/50 rounded-lg transition-all"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Delete this task?')) removeTask(task.id); }}
                              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {dueDateInfo && (
                          <p className={`text-[10px] mt-1 font-medium ${dueDateInfo.isOverdue && !task.completed ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            Due {dueDateInfo.label}{dueDateInfo.isOverdue && !task.completed ? ' · Overdue' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Completion summary */}
              {completedCount > 0 && (
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
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
