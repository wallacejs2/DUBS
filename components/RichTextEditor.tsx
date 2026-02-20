
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolbarButton {
  command: string;
  icon: React.FC<any>;
  label: string;
}

const toolbarButtons: ToolbarButton[] = [
  { command: 'bold', icon: Bold, label: 'Bold' },
  { command: 'italic', icon: Italic, label: 'Italic' },
  { command: 'underline', icon: Underline, label: 'Underline' },
  { command: 'strikeThrough', icon: Strikethrough, label: 'Strikethrough' },
  { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
  { command: 'insertOrderedList', icon: ListOrdered, label: 'Ordered List' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Start typing...' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const isInternalChange = useRef(false);

  // Sync external value into the editor only when it actually changes from outside
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const updateActiveStates = useCallback(() => {
    const newActive = new Set<string>();
    toolbarButtons.forEach(btn => {
      try {
        if (document.queryCommandState(btn.command)) {
          newActive.add(btn.command);
        }
      } catch {
        // queryCommandState can throw for some commands
      }
    });
    setActiveCommands(newActive);
  }, []);

  // Listen for selection changes to update active button states
  useEffect(() => {
    const handler = () => updateActiveStates();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [updateActiveStates]);

  const execCommand = (command: string) => {
    // Re-focus the editor to ensure the command applies to the right context
    editorRef.current?.focus();
    document.execCommand(command, false);
    updateActiveStates();

    // Capture the updated HTML
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      // Treat editor-produced empty states as empty string
      if (html === '<br>' || html === '<div><br></div>') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // Paste as plain text to avoid bringing in external styles
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 transition-all bg-white dark:bg-slate-800">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        {toolbarButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeCommands.has(btn.command);
          return (
            <button
              key={btn.command}
              type="button"
              title={btn.label}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent stealing focus from editor
                execCommand(btn.command);
              }}
              className={`p-1.5 rounded transition-all ${
                isActive
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      {/* Editable Area */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-0 left-0 px-3 py-2 text-[12px] text-slate-400 dark:text-slate-600 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className="px-3 py-2 text-[12px] text-slate-900 dark:text-slate-100 font-normal outline-none min-h-[200px] max-h-[500px] overflow-y-auto custom-scrollbar leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:my-0.5"
          role="textbox"
          aria-multiline="true"
          aria-placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
