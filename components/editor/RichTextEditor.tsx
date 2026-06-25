'use client';

import { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Undo2,
  Redo2,
  Image as ImageIcon
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Start writing your essay...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const executeCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value as any);
    editorRef.current?.focus();
  };

  const applyInlineStyle = (tag: string) => {
    const selection = window.getSelection();
    if (!selection?.toString()) return;

    const span = document.createElement('span');
    span.className = `tag-${tag}`;

    const range = selection.getRangeAt(0);
    range.surroundContents(span);

    updateContent();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
      updateContent();
    }
  };

  const insertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.className = 'max-w-full h-auto rounded-lg my-4';
        img.style.maxWidth = '100%';

        const range = window.getSelection()?.getRangeAt(0);
        if (range) {
          range.insertNode(img);
          updateContent();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateContent = () => {
    const content = editorRef.current?.innerHTML || '';
    onChange(content);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
      }
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
      }
      onChange(history[newIndex]);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="bg-secondary border-b border-border p-4">
        <div className="flex flex-wrap gap-2">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-border pr-2">
            <button
              onClick={() => executeCommand('bold')}
              title="Bold (Ctrl+B)"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <Bold size={20} />
            </button>
            <button
              onClick={() => executeCommand('italic')}
              title="Italic (Ctrl+I)"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <Italic size={20} />
            </button>
            <button
              onClick={() => executeCommand('underline')}
              title="Underline (Ctrl+U)"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <Underline size={20} />
            </button>
            <button
              onClick={() => executeCommand('strikethrough')}
              title="Strikethrough"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <Strikethrough size={20} />
            </button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-border pr-2">
            <button
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bullet List"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <ListOrdered size={20} />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-border pr-2">
            <button
              onClick={() => executeCommand('justifyLeft')}
              title="Align Left"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <AlignLeft size={20} />
            </button>
            <button
              onClick={() => executeCommand('justifyCenter')}
              title="Align Center"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <AlignCenter size={20} />
            </button>
            <button
              onClick={() => executeCommand('justifyRight')}
              title="Align Right"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <AlignRight size={20} />
            </button>
          </div>

          {/* Quote */}
          <div className="flex gap-1 border-r border-border pr-2">
            <button
              onClick={() => executeCommand('formatBlock', '<blockquote>')}
              title="Block Quote"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <Quote size={20} />
            </button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-border pr-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  executeCommand('formatBlock', e.target.value);
                }
              }}
              className="px-3 py-2 text-sm border border-border rounded hover:bg-border transition-colors cursor-pointer"
              defaultValue=""
            >
              <option value="">Paragraph</option>
              <option value="<h1>">Heading 1</option>
              <option value="<h2>">Heading 2</option>
              <option value="<h3>">Heading 3</option>
            </select>
          </div>

          {/* Text Color */}
          <div className="flex gap-1 border-r border-border pr-2">
            <label className="p-2 hover:bg-border rounded transition-colors cursor-pointer flex items-center gap-1">
              <input
                type="color"
                onChange={(e) => executeCommand('foreColor', e.target.value)}
                className="w-6 h-6 cursor-pointer"
              />
              <span className="text-xs hidden sm:inline">Color</span>
            </label>
          </div>

          {/* Media */}
          <div className="flex gap-1 border-r border-border pr-2">
            <button
              onClick={insertImage}
              title="Insert Image"
              className="p-2 hover:bg-border rounded transition-colors"
            >
              <ImageIcon size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
              className="p-2 hover:bg-border rounded transition-colors disabled:opacity-50"
            >
              <Undo2 size={20} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
              className="p-2 hover:bg-border rounded transition-colors disabled:opacity-50"
            >
              <Redo2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        suppressContentEditableWarning
        className="min-h-96 p-6 focus:outline-none prose prose-invert max-w-none bg-background text-foreground"
        style={{
          outline: 'none'
        }}
      >
        {!value && <div className="text-muted-foreground">{placeholder}</div>}
      </div>

      {/* Character Count */}
      <div className="bg-secondary border-t border-border px-6 py-3 text-sm text-muted-foreground">
        {editorRef.current?.textContent?.length || 0} characters
      </div>
    </div>
  );
}
