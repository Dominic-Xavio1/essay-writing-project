'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/shared/Header';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { api } from '@/lib/api-client';
import { categories } from '@/lib/posts';
import { categoryMeta } from '@/lib/board';
import {
  X,
  Clock,
  ImagePlus,
  Hash,
  Send,
  Save,
  Lightbulb,
  Sparkles,
  Loader2,
  Sunrise,
  Users,
  Wrench,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SPARKS = [
  { icon: Sunrise, tone: 'text-accent', text: 'A morning on the hill you will never forget' },
  { icon: Users, tone: 'text-primary', text: 'Someone in your family (village family counts!) who changed you' },
  { icon: Wrench, tone: 'text-sky-600', text: 'A problem at school you would love to fix' },
  { icon: Flag, tone: 'text-violet-600', text: 'What Rwanda will look like when you are 30' },
];

export function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!editId) return;
    let isCurrentRequest = true;
    setLoadingEdit(true);
    api
      .getPost(editId)
      .then((data) => {
        if (!isCurrentRequest) return;
        const p = data.post;
        if (!p) throw new Error('Essay not found');
        setTitle(p.title || '');
        setExcerpt(p.excerpt || '');
        setContent(p.content || '');
        setCategory(p.category || 'Technology');
        setTags(p.tags || []);
        setFeaturedImage(p.featured_image || null);
      })
      .catch((error) => {
        if (isCurrentRequest) toast.error(error instanceof Error ? error.message : 'Failed to load essay');
      })
      .finally(() => {
        if (isCurrentRequest) setLoadingEdit(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [editId]);

  const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
  const wordCount = plainTextContent ? plainTextContent.split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
  const targetWords = 500;
  const wordProgress = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setFeaturedImage(event.target?.result);
    reader.readAsDataURL(file);
    toast.success('Cover image added 🖼️');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const submit = async (status) => {
    if (!title.trim()) {
      toast.error('Give your note a title first ✏️');
      return;
    }
    if (status === 'published' && (!excerpt.trim() || !content.trim())) {
      toast.error('Add a one-line summary and some content before pinning');
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
        status,
      };
      if (editId) {
        await api.updatePost(editId, body);
        toast.success(status === 'draft' ? 'Draft updated!' : 'Note updated!');
      } else {
        const res = await api.createPost(body);
        if (status === 'draft') {
          toast.success('Draft saved!');
        } else if (res.post?.status === 'pending') {
          toast.success('Sent to a mentor for review 🎉');
        } else {
          toast.success('Pinned to the wall! 🎉');
        }
        if (status === 'published') {
          setTitle('');
          setExcerpt('');
          setContent('');
          setCategory('Technology');
          setTags([]);
          setFeaturedImage(null);
        }
      }
      if (status === 'published') router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save essay');
    } finally {
      setSaving(false);
    }
  };

  const meta = categoryMeta(category);
  const MetaIcon = meta.icon;

  return (
    <>
      <Header />
      <main className="relative min-h-screen bg-canvas-lines pb-24">
        <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-96 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 px-3 py-8 sm:px-6 xl:grid-cols-[1fr_260px]">
          {/* Floating creation sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="relative rounded-[2rem] border border-border bg-card shadow-[0_30px_80px_-30px_rgba(26,33,24,0.35)]"
          >
            {/* Sheet top bar */}
            <div className="sticky top-[5.25rem] z-30 flex items-center justify-between gap-3 rounded-t-[2rem] border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href="/dashboard"
                  aria-label="Close editor"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition-all hover:rotate-90 hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <X size={18} />
                </Link>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-extrabold text-foreground">
                    {editId ? 'Editing your note' : 'New note'}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                    <Clock size={11} /> {wordCount} words · ~{estimatedReadTime} min read
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative hidden h-9 w-9 sm:block" title={`${wordProgress}% of a ${targetWords}-word goal`}>
                  <svg className="h-9 w-9 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" className="text-secondary" fill="none" />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="4"
                      className={cn('transition-all duration-500', wordProgress >= 100 ? 'text-accent' : 'text-primary')}
                      fill="none"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={100 - wordProgress}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-[9px] font-black">{wordProgress}%</span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => submit('draft')}
                  disabled={saving || loadingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary/20 px-3 py-2 text-xs font-extrabold text-primary transition-colors hover:border-primary disabled:opacity-50 sm:px-4"
                >
                  <Save size={15} />
                  <span className="hidden sm:inline">Save draft</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => submit('published')}
                  disabled={saving || loadingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-accent-foreground shadow-[0_10px_22px_-10px_rgba(249,115,22,0.8)] disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {editId ? 'Update' : 'Pin it'}
                </motion.button>
              </div>
            </div>

            <form className="space-y-6 p-4 sm:p-8" onSubmit={(e) => e.preventDefault()}>
              {/* Board / category stickers */}
              <div>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Which board?
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((c) => c !== 'All')
                    .map((cat) => {
                      const CatIcon = categoryMeta(cat).icon;
                      const active = category === cat;
                      return (
                        <motion.button
                          key={cat}
                          type="button"
                          whileHover={{ y: -3, rotate: -2 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setCategory(cat)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-2xl border-2 px-3 py-2 text-xs font-extrabold transition-colors',
                            active
                              ? 'border-primary bg-primary text-primary-foreground shadow-md'
                              : 'border-border bg-background text-foreground/70 hover:border-primary/40'
                          )}
                        >
                          <CatIcon size={14} strokeWidth={2.5} /> {cat}
                        </motion.button>
                      );
                    })}
                </div>
              </div>

              {/* Cover */}
              <AnimatePresence mode="wait">
                {featuredImage ? (
                  <motion.div
                    key="cover"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="group relative h-52 overflow-hidden rounded-3xl border border-border sm:h-72"
                  >
                    <img src={featuredImage} alt="Cover preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage(null)}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={14} /> Remove
                    </button>
                  </motion.div>
                ) : (
                  <motion.label
                    key="drop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'flex cursor-pointer items-center gap-4 rounded-3xl border-2 border-dashed p-4 transition-all',
                      isDragging
                        ? 'scale-[1.01] border-accent bg-note-peach'
                        : 'border-border bg-background/60 hover:border-accent/50 hover:bg-note-peach/50'
                    )}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-note-peach text-accent">
                      <ImagePlus size={22} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-foreground">Add a cover photo</span>
                      <span className="block text-xs text-muted-foreground">Drop an image here or click to browse</span>
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </motion.label>
                )}
              </AnimatePresence>

              {/* Title */}
              <div className="flex items-start gap-3">
                <motion.span
                  key={category}
                  initial={{ scale: 0.5, rotate: -30 }}
                  animate={{ scale: 1, rotate: -8 }}
                  className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-note-butter text-2xl"
                >
                  <MetaIcon size={24} strokeWidth={2.5} className={meta.tone} />
                </motion.span>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your note a title…"
                  rows={1}
                  className="field-sizing-content w-full resize-none bg-transparent font-display text-3xl font-extrabold leading-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none sm:text-4xl"
                />
              </div>

              {/* Excerpt as sticky note */}
              <div className="relative rotate-[-0.4deg] rounded-2xl bg-note-peach p-4">
                <span aria-hidden className="tape bg-accent/50" />
                <label className="mb-1 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-accent">
                  <span>The hook</span>
                  <span className="font-bold normal-case text-muted-foreground">{excerpt.length}/300</span>
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="One line that makes friends want to read more…"
                  rows={2}
                  maxLength={300}
                  className="w-full resize-none bg-transparent font-hand text-2xl leading-snug text-foreground placeholder:text-foreground/35 focus:outline-none"
                />
              </div>

              {/* Body */}
              {loadingEdit ? (
                <div className="flex min-h-[380px] items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-background/60 text-sm font-semibold text-muted-foreground" role="status">
                  <Loader2 size={17} className="animate-spin text-primary" />
                  Loading your saved note…
                </div>
              ) : (
                <RichTextEditor value={content} onChange={setContent} placeholder="Start writing your story here…" />
              )}

              {/* Tags */}
              <div className="rounded-3xl border border-border bg-background/60 p-4">
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <Hash size={13} /> Tags
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <AnimatePresence>
                    {tags.map((tag) => (
                      <motion.span
                        key={tag}
                        layout
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          aria-label={`Remove ${tag}`}
                          className="rounded-full hover:bg-white/20"
                        >
                          <X size={13} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length ? 'Add another…' : 'Type a tag and press Enter'}
                    className="min-w-[10rem] flex-1 bg-transparent py-1 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </form>
          </motion.div>

          {/* Inspiration rail */}
          <aside className="hidden xl:block">
            <div className="sticky top-28 space-y-4">
              <div className="flex items-center gap-2 font-display text-sm font-extrabold text-foreground">
                <Lightbulb size={16} className="text-accent" /> Writing sparks
              </div>
              {SPARKS.map((s, i) => (
                <motion.button
                  key={s.text}
                  type="button"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  whileHover={{ y: -4, rotate: 0, scale: 1.03 }}
                  style={{ rotate: i % 2 ? 1.5 : -1.5 }}
                  onClick={() => {
                    if (!title.trim()) setTitle(s.text);
                    else toast('Spark copied into your mind ✨', { description: s.text });
                  }}
                  className={cn(
                    'block w-full rounded-2xl border border-black/5 p-4 text-left shadow-[var(--shadow-note)] transition-shadow hover:shadow-[var(--shadow-float)]',
                    ['bg-note-mint', 'bg-note-butter', 'bg-note-sky', 'bg-note-lilac'][i]
                  )}
                >
                  <s.icon size={20} strokeWidth={2.5} className={s.tone} />
                  <span className="mt-1 block font-hand text-xl leading-tight text-foreground">{s.text}</span>
                </motion.button>
              ))}
              <div className="rounded-2xl border-2 border-dashed border-primary/30 p-4 text-xs font-semibold leading-relaxed text-muted-foreground">
                <Sparkles size={14} className="mb-1 text-primary" />
                Every note is reviewed by an ASYV mentor before it appears on the wall.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
