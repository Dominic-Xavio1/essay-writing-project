'use client';

import { useEffect, useState } from 'react';
import { Check, NotebookPen, Save } from 'lucide-react';
import { toast } from 'sonner';

export function ReadingReflection({ postId }) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadNote = () => {
      try {
        const storedNote = window.localStorage.getItem(`asyv-reading-note-${postId}`);
        setNote(storedNote || '');
        setSaved(Boolean(storedNote));
      } catch {
        toast.error('Your private reading note could not be loaded on this device');
      }
    };

    loadNote();
    window.addEventListener('asyv-reading-note-updated', loadNote);
    window.addEventListener('storage', loadNote);
    return () => {
      window.removeEventListener('asyv-reading-note-updated', loadNote);
      window.removeEventListener('storage', loadNote);
    };
  }, [postId]);

  const saveNote = () => {
    try {
      window.localStorage.setItem(`asyv-reading-note-${postId}`, note.trim());
      setNote(note.trim());
      setSaved(Boolean(note.trim()));
      window.dispatchEvent(new Event('asyv-reading-note-updated'));
      toast.success('Your private margin note is saved on this device');
    } catch {
      toast.error('Your note could not be saved on this device');
    }
  };

  return (
    <details className="reader-reflection group rounded-2xl border p-3.5">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-foreground [&::-webkit-details-marker]:hidden">
        <NotebookPen size={15} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="flex-1">Keep a margin note</span>
        {saved && <Check size={14} className="text-primary" aria-label="Note saved" />}
        <span className="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
      </summary>
      <label className="mt-3 block">
        <span className="sr-only">Your private reflection on this essay</span>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setSaved(false);
          }}
          maxLength={500}
          rows={3}
          placeholder="What idea would you like to carry with you?"
          className="w-full resize-y rounded-xl border border-primary/10 bg-background/70 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </label>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">Private · saved only on this device</span>
        <button
          type="button"
          onClick={saveNote}
          disabled={!note.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={12} aria-hidden="true" />
          Save
        </button>
      </div>
    </details>
  );
}
