'use client';

import { useState, useRef, useEffect } from 'react';
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
  Heading2,
  Heading3,
  Pilcrow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The writing canvas.
 *
 * Paper with a hairline tool rail above it. The controls are the same ones as
 * before — nothing was taken away — but they are set quietly so the words are
 * the only loud thing on the page.
 */
export function RichTextEditor({ value, onChange, placeholder = 'Begin where it matters.' }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [history, setHistory] = useState([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const editor = editorRef.current;
    const nextValue = value || '';
    if (!editor || editor.innerHTML === nextValue) return;

    editor.innerHTML = nextValue;
    setHistory([nextValue]);
    setHistoryIndex(0);
    setIsEmpty(!nextValue);
  }, [value]);

  const executeCommand = (command, arg = false) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    updateContent();
  };

  const insertLink = () => {
    const url = window.prompt('Address to link to:');
    if (url) executeCommand('createLink', url);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result;
      img.alt = '';
      img.style.maxWidth = '100%';

      const range = window.getSelection()?.getRangeAt(0);
      if (range) {
        range.insertNode(img);
        updateContent();
      }
    };
    reader.readAsDataURL(file);
  };

  const updateContent = () => {
    const content = editorRef.current?.innerHTML || '';
    onChange(content);
    setIsEmpty(!editorRef.current?.textContent?.trim() && !/<img/i.test(content));

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const applyHistory = (nextIndex) => {
    setHistoryIndex(nextIndex);
    if (editorRef.current) editorRef.current.innerHTML = history[nextIndex];
    onChange(history[nextIndex]);
  };

  const handleUndo = () => historyIndex > 0 && applyHistory(historyIndex - 1);
  const handleRedo = () => historyIndex < history.length - 1 && applyHistory(historyIndex + 1);

  const toolClass =
    'grid h-8 w-8 place-items-center text-ink-faint transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent';

  const groups = [
    [
      { icon: Bold, label: 'Bold', run: () => executeCommand('bold') },
      { icon: Italic, label: 'Italic', run: () => executeCommand('italic') },
      { icon: Underline, label: 'Underline', run: () => executeCommand('underline') },
      { icon: Strikethrough, label: 'Strikethrough', run: () => executeCommand('strikethrough') },
    ],
    [
      { icon: Pilcrow, label: 'Paragraph', run: () => executeCommand('formatBlock', '<p>') },
      { icon: Heading2, label: 'Section heading', run: () => executeCommand('formatBlock', '<h2>') },
      { icon: Heading3, label: 'Smaller heading', run: () => executeCommand('formatBlock', '<h3>') },
    ],
    [
      { icon: List, label: 'Bulleted list', run: () => executeCommand('insertUnorderedList') },
      { icon: ListOrdered, label: 'Numbered list', run: () => executeCommand('insertOrderedList') },
      { icon: Quote, label: 'Quotation', run: () => executeCommand('formatBlock', '<blockquote>') },
    ],
    [
      { icon: AlignLeft, label: 'Align left', run: () => executeCommand('justifyLeft') },
      { icon: AlignCenter, label: 'Align centre', run: () => executeCommand('justifyCenter') },
      { icon: AlignRight, label: 'Align right', run: () => executeCommand('justifyRight') },
    ],
    [
      { icon: Link2, label: 'Insert a link', run: insertLink },
      { icon: ImageIcon, label: 'Insert an image', run: () => fileInputRef.current?.click() },
    ],
  ];

  return (
    <div className="border border-rule bg-card">
      {/* Tool rail */}
      <div
        role="toolbar"
        aria-label="Writing tools"
        aria-controls="writing-canvas"
        className="flex flex-wrap items-center gap-1 border-b border-rule px-2 py-1.5"
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-0.5">
            {groupIndex > 0 && <span aria-hidden className="mx-1 h-5 w-px bg-rule" />}
            {group.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.label}
                  type="button"
                  onClick={tool.run}
                  title={tool.label}
                  aria-label={tool.label}
                  className={toolClass}
                >
                  <Icon size={16} aria-hidden />
                </button>
              );
            })}
          </div>
        ))}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo"
            aria-label="Undo"
            className={toolClass}
          >
            <Undo2 size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
            aria-label="Redo"
            className={toolClass}
          >
            <Redo2 size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        {isEmpty && (
          <p
            aria-hidden
            className="pointer-events-none absolute left-5 top-6 font-reading text-lg italic text-ink-faint/70 sm:left-8 sm:top-8"
          >
            {placeholder}
          </p>
        )}
        <div
          id="writing-canvas"
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Your writing"
          onInput={updateContent}
          suppressContentEditableWarning
          className={cn(
            'editor-surface min-h-[26rem] px-5 py-6 focus:outline-none sm:px-8 sm:py-8'
          )}
        />
      </div>

      <div className="flex items-center justify-between border-t border-rule px-4 py-2 text-[0.6875rem] text-ink-faint">
        <span>Everything is saved only when you press Save draft.</span>
        <span className="tabular-nums">{editorRef.current?.textContent?.length || 0} characters</span>
      </div>
    </div>
  );
}
