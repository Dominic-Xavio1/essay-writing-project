'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  X,
  ImagePlus,
  Send,
  Save,
  Loader2,
  Check,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { InkButton } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { categories } from '@/lib/posts';
import { categoryMeta } from '@/lib/board';
import { wordCount as countWords } from '@/lib/essay';
import { cn } from '@/lib/utils';

/* Prompts offered beside the page. Editorial copy, not data. */
const SPARKS = [
  'A morning on the hill you will never forget.',
  'Someone in your family — village family counts — who changed you.',
  'A problem at school you would love to fix, and how.',
  'What Rwanda will look like when you are thirty.',
];

/* What each status means, in plain words. */
const STATUS_COPY = {
  draft: {
    label: 'Draft',
    icon: Save,
    tone: 'text-ink-soft',
    line: 'Only you can see this. It stays here until you send it.',
  },
  pending: {
    label: 'With a mentor',
    icon: Clock,
    tone: 'text-accent',
    line: 'An ASYV mentor is reading it. You will get a notice when they answer.',
  },
  approved: {
    label: 'Published',
    icon: Check,
    tone: 'text-primary',
    line: 'This is live on the site. Any edit goes back to a mentor before it reappears.',
  },
  published: {
    label: 'Published',
    icon: Check,
    tone: 'text-primary',
    line: 'This is live on the site. Any edit goes back to a mentor before it reappears.',
  },
  rejected: {
    label: 'Not approved',
    icon: AlertCircle,
    tone: 'text-destructive',
    line: 'A mentor did not approve this one. Read their note, then send it again.',
  },
};

export function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const reduce = useReducedMotion();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('draft');
  const [feedback, setFeedback] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const titleRef = useRef(null);

  /* Keep the title on one growing line. `field-sizing` does this natively in
     newer browsers; this handles the ones where it does not. */
  useEffect(() => {
    const el = titleRef.current;
    if (!el || CSS.supports?.('field-sizing', 'content')) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  useEffect(() => {
    if (!editId) return;
    let isCurrentRequest = true;
    setLoadingEdit(true);
    api
      .getPost(editId)
      .then((data) => {
        if (!isCurrentRequest) return;
        const p = data.post;
        if (!p) throw new Error('That piece could not be found');
        setTitle(p.title || '');
        setExcerpt(p.excerpt || '');
        setContent(p.content || '');
        setCategory(p.category || 'Personal');
        setTags(p.tags || []);
        setFeaturedImage(p.featured_image || null);
        setStatus(p.status || 'draft');
        setFeedback(p.feedback || '');
        if (p.excerpt || p.featured_image || p.tags?.length) setShowDetails(true);
      })
      .catch((error) => {
        if (isCurrentRequest) {
          toast.error(error instanceof Error ? error.message : 'Could not open that piece');
        }
      })
      .finally(() => {
        if (isCurrentRequest) setLoadingEdit(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [editId]);

  const words = useMemo(() => countWords(content), [content]);
  const estimatedReadTime = Math.max(1, Math.ceil(words / 200));

  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
      if (clean && !tags.includes(clean)) setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('That file is not an image');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setFeaturedImage(event.target?.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const submit = async (nextStatus) => {
    if (!title.trim()) {
      toast.error('Give the piece a title first.');
      return;
    }
    if (nextStatus === 'published' && (!excerpt.trim() || !content.trim())) {
      toast.error('A summary and some writing are needed before you send it.');
      setShowDetails(true);
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        excerpt,
        content,
        category,
        tags,
        featured_image: featuredImage || '',
        status: nextStatus,
      };

      if (editId) {
        const res = await api.updatePost(editId, body);
        if (res.post?.status) setStatus(res.post.status);
        toast.success(
          nextStatus === 'draft'
            ? 'Draft saved.'
            : res.post?.status === 'pending'
            ? 'Sent to a mentor.'
            : 'Updated.'
        );
      } else {
        const res = await api.createPost(body);
        if (nextStatus === 'draft') {
          toast.success('Draft saved. You can come back to it any time.');
          if (res.post?.id) router.replace(`/create?edit=${res.post.id}`);
        } else if (res.post?.status === 'pending') {
          toast.success('Sent to a mentor for reading.');
        } else {
          toast.success('Published.');
        }
      }

      if (nextStatus === 'published') router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const meta = categoryMeta(category);
  const statusInfo = STATUS_COPY[status] || STATUS_COPY.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <Header />

      <main id="main" className="min-h-screen bg-paper pb-28">
        {/* ── Desk bar: the only controls, and the current status ────────── */}
        <div className="sticky top-[4.5rem] z-30 border-b border-rule bg-paper/95 backdrop-blur-[2px]">
          <div className="mx-auto flex max-w-[84rem] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-foreground"
            >
              <X size={14} aria-hidden /> Close
            </Link>

            <span aria-hidden className="h-4 w-px bg-rule" />

            <p className={cn('inline-flex items-center gap-1.5 text-xs font-medium', statusInfo.tone)}>
              <StatusIcon size={13} aria-hidden />
              {statusInfo.label}
            </p>

            <p className="hidden text-xs tabular-nums text-ink-faint sm:block">
              {words} {words === 1 ? 'word' : 'words'} · about {estimatedReadTime} min to read
            </p>

            <div className="ml-auto flex items-center gap-2">
              {editId && (status === 'approved' || status === 'published') && (
                <Link
                  href={`/posts/${editId}`}
                  className="hidden items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-ink-soft hover:text-foreground sm:inline-flex"
                >
                  <Eye size={14} aria-hidden /> View live
                </Link>
              )}

              <InkButton
                variant="outline"
                size="sm"
                onClick={() => submit('draft')}
                disabled={saving || loadingEdit}
              >
                <Save size={14} aria-hidden />
                <span className="hidden sm:inline">Save draft</span>
              </InkButton>

              <InkButton
                variant="solid"
                size="sm"
                onClick={() => submit('published')}
                disabled={saving || loadingEdit}
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Send size={14} aria-hidden />
                )}
                Send to a mentor
              </InkButton>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-[84rem] grid-cols-1 gap-12 px-4 pt-10 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
          {/* ── The notebook ────────────────────────────────────────────── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[44rem]"
          >
            {/* A mentor's note, when there is one to read */}
            {feedback && (
              <div className="mb-8 border border-accent/40 bg-accent/5 p-4">
                <p className="label mb-2 text-accent">A note from your mentor</p>
                <p className="font-reading text-base leading-relaxed text-foreground">{feedback}</p>
              </div>
            )}

            <p className="mb-6 font-reading text-sm italic text-ink-faint">{statusInfo.line}</p>

            {/* Genre */}
            <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-rule pb-4">
              <span className="label">Genre</span>
              {categories
                .filter((c) => c !== 'All')
                .map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      aria-pressed={active}
                      className={cn(
                        'text-xs transition-colors',
                        active
                          ? 'font-medium text-foreground underline decoration-2 underline-offset-4'
                          : 'text-ink-faint hover:text-ink-soft'
                      )}
                      style={active ? { textDecorationColor: categoryMeta(cat).accent } : undefined}
                    >
                      {categoryMeta(cat).label}
                    </button>
                  );
                })}
            </div>

            {/* Title */}
            <label htmlFor="piece-title" className="sr-only">
              Title
            </label>
            <div className="relative">
              <textarea
                id="piece-title"
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                rows={1}
                className="field-sizing-content w-full resize-none overflow-hidden bg-transparent font-display type-5 font-semibold leading-[1.08] tracking-[-0.02em] text-foreground placeholder:text-ink-faint/50 focus:outline-none"
              />
              {!title && (
                <span
                  aria-hidden
                  className="animate-caret pointer-events-none absolute left-0 top-[0.1em] h-[0.9em] w-[2px] bg-accent"
                />
              )}
            </div>

            {/* Body */}
            <div className="mt-8">
              {loadingEdit ? (
                <div
                  className="flex min-h-[26rem] items-center justify-center gap-2 border border-rule text-sm text-ink-soft"
                  role="status"
                >
                  <Loader2 size={16} className="animate-spin text-primary" aria-hidden />
                  Opening your pages…
                </div>
              ) : (
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Begin where it matters."
                />
              )}
            </div>

            {/* Everything else, folded away until it is needed */}
            <div className="mt-10 border-t border-rule pt-5">
              <button
                type="button"
                onClick={() => setShowDetails((s) => !s)}
                aria-expanded={showDetails}
                className="label flex items-center gap-2 text-ink-soft transition-colors hover:text-foreground"
              >
                <span aria-hidden className="text-sm leading-none">
                  {showDetails ? '−' : '+'}
                </span>
                Summary, cover and tags
              </button>

              <AnimatePresence initial={false}>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-8 pt-6">
                      {/* Summary */}
                      <div>
                        <div className="mb-2 flex items-baseline justify-between">
                          <label htmlFor="piece-summary" className="label">
                            Summary
                          </label>
                          <span className="text-[0.6875rem] tabular-nums text-ink-faint">
                            {excerpt.length}/300
                          </span>
                        </div>
                        <textarea
                          id="piece-summary"
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="One or two lines that make a reader want to begin."
                          rows={2}
                          maxLength={300}
                          className="w-full resize-none border border-rule bg-input px-3.5 py-3 font-reading text-lg italic leading-relaxed text-foreground focus:border-primary focus:outline-none"
                        />
                        <p className="mt-1.5 text-xs text-ink-faint">
                          This appears under the title and on every listing. It is required before
                          you can send the piece.
                        </p>
                      </div>

                      {/* Cover */}
                      <div>
                        <p className="label mb-2">Cover image</p>
                        {featuredImage ? (
                          <div className="group relative border border-rule">
                            <img
                              src={featuredImage}
                              alt="Your chosen cover"
                              className="h-56 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setFeaturedImage(null)}
                              className="absolute right-2 top-2 inline-flex items-center gap-1.5 border border-rule bg-card px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:text-destructive"
                            >
                              <X size={13} aria-hidden /> Remove
                            </button>
                          </div>
                        ) : (
                          <label
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleImageFile(file);
                            }}
                            className={cn(
                              'flex cursor-pointer items-center gap-4 border border-dashed p-4 transition-colors',
                              isDragging
                                ? 'border-accent bg-accent/5'
                                : 'border-rule-strong hover:border-accent'
                            )}
                          >
                            <ImagePlus size={20} className="shrink-0 text-ink-faint" aria-hidden />
                            <span>
                              <span className="block text-sm font-medium text-foreground">
                                Add a cover, if you have one
                              </span>
                              <span className="mt-0.5 block text-xs text-ink-soft">
                                Drop a file here or click to choose. Without one, we set your title
                                in type instead — which often looks better.
                              </span>
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <label htmlFor="piece-tags" className="label mb-2 block">
                          Tags
                        </label>
                        <div className="flex flex-wrap items-center gap-2 border-b border-rule pb-2">
                          <AnimatePresence initial={false}>
                            {tags.map((tag) => (
                              <motion.span
                                key={tag}
                                layout
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="inline-flex items-center gap-1 border border-rule px-2 py-1 text-xs text-ink-soft"
                              >
                                #{tag}
                                <button
                                  type="button"
                                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                                  aria-label={`Remove the tag ${tag}`}
                                  className="hover:text-destructive"
                                >
                                  <X size={11} aria-hidden />
                                </button>
                              </motion.span>
                            ))}
                          </AnimatePresence>
                          <input
                            id="piece-tags"
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder={tags.length ? 'Another…' : 'Type a tag, press Enter'}
                            className="min-w-[9rem] flex-1 bg-transparent py-1 text-sm text-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── The margin: what happens next, then prompts ─────────────── */}
          <aside className="xl:pt-2">
            <div className="xl:sticky xl:top-36">
              <div className="border border-rule bg-card p-5">
                <p className="label mb-4">What happens after you send it</p>
                <ol className="space-y-4">
                  {[
                    {
                      n: '1',
                      t: 'A mentor reads it',
                      d: 'Your piece goes to the ASYV mentors. Nobody else can see it yet.',
                    },
                    {
                      n: '2',
                      t: 'They publish it, or write back',
                      d: 'If something needs work, their note comes back to you and the piece returns to your drafts.',
                    },
                    {
                      n: '3',
                      t: 'It appears on the site',
                      d: 'Once approved it is listed under its genre for everyone to read.',
                    },
                  ].map((step) => (
                    <li key={step.n} className="flex gap-3">
                      <span
                        aria-hidden
                        className="shrink-0 font-reading text-sm tabular-nums text-accent"
                      >
                        {step.n}
                      </span>
                      <span>
                        <span className="block text-[0.8125rem] font-medium text-foreground">
                          {step.t}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                          {step.d}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 border-t border-rule pt-4 text-xs leading-relaxed text-ink-faint">
                  Editing a published piece sends it back for another read, so it never changes
                  under a reader without a mentor seeing it first.
                </p>
              </div>

              <div className="mt-8">
                <p className="label mb-4">If you are stuck</p>
                <ul className="divide-y divide-rule border-y border-rule">
                  {SPARKS.map((spark) => (
                    <li key={spark}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!title.trim()) setTitle(spark.replace(/\.$/, ''));
                          else toast('Keep it in mind', { description: spark });
                        }}
                        className="group block w-full py-3.5 text-left font-reading text-[0.9375rem] italic leading-snug text-ink-soft transition-colors hover:text-foreground"
                      >
                        {spark}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-faint">
                  Tap one to use it as your title, then change it however you like.
                </p>
              </div>

              <p
                className="mt-8 font-reading text-base italic leading-relaxed text-ink-faint"
                style={{ color: meta.accent, opacity: 0.8 }}
              >
                <span aria-hidden>{meta.mark}</span> You are writing for {meta.label}.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
