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
  Undo2,
  Redo2,
  Image as ImageIcon,
  Link2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tell your story...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const executeCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value as any);
    editorRef.current?.focus();
    updateContent();
  };

  const insertLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      executeCommand('createLink', url);
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
        img.className = 'max-w-full h-auto rounded-xl my-6 shadow-md border border-border';
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
    <div className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs">
      {/* Sticky Editorial Toolbar */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-md border-b border-border/80 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-muted-foreground">
          {/* Formatting group */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              title="Bold"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Bold size={17} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              title="Italic"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Italic size={17} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              title="Underline"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Underline size={17} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('strikethrough')}
              title="Strikethrough"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Strikethrough size={17} />
            </button>
          </div>

          {/* Block type */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  executeCommand('formatBlock', e.target.value);
                }
              }}
              className="px-2.5 py-1.5 text-xs font-semibold bg-secondary text-foreground border border-border rounded-lg focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="">Paragraph</option>
              <option value="<h1>">Heading 1</option>
              <option value="<h2>">Heading 2</option>
              <option value="<h3>">Heading 3</option>
            </select>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bullet List"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <List size={17} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <ListOrdered size={17} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<blockquote>')}
              title="Quote"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Quote size={17} />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            <button
              type="button"
              onClick={() => executeCommand('justifyLeft')}
              title="Align Left"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <AlignLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyCenter')}
              title="Align Center"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <AlignCenter size={17} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyRight')}
              title="Align Right"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <AlignRight size={17} />
            </button>
          </div>

          {/* Media & Link */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            <button
              type="button"
              onClick={insertLink}
              title="Insert Link"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Link2 size={17} />
            </button>
            <button
              type="button"
              onClick={insertImage}
              title="Insert Image"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <ImageIcon size={17} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* History */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
            >
              <Undo2 size={17} />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
              className="p-2 hover:text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
            >
              <Redo2 size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        suppressContentEditableWarning
        className="min-h-[380px] p-6 sm:p-8 focus:outline-none font-sans text-lg leading-relaxed text-foreground prose prose-zinc dark:prose-invert max-w-none"
        style={{ outline: 'none' }}
      >
        {!value && <div className="text-muted-foreground/50 italic">{placeholder}</div>}
      </div>

      {/* Editorial Footer Info */}
      <div className="bg-secondary/40 border-t border-border/60 px-6 py-2.5 flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span>Editorial Rich Text Editor</span>
        <span>{editorRef.current?.textContent?.length || 0} characters</span>
      </div>
    </div>
  );
}

