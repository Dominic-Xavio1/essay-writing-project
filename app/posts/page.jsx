'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { NoteBuddy } from '@/components/shared/NoteBuddy';
import { EssayCard, EssayCardSkeleton } from '@/components/board/EssayCard';
import { MasonryBoard } from '@/components/board/MasonryBoard';
import { FreeformBoard } from '@/components/board/FreeformBoard';
import { categories, allTags } from '@/lib/posts';
import { categoryMeta } from '@/lib/board';
import { api } from '@/lib/api-client';
import {
  Search,
  X,
  Flame,
  Clock3,
  Heart,
  LayoutGrid,
  Move,
  PenLine,
  Hash,
  Share2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SORTS = [
  { value: 'recent', label: 'Fresh', icon: Clock3 },
  { value: 'trending', label: 'Trending', icon: Flame },
  { value: 'most_liked', label: 'Most loved', icon: Heart },
];

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [view, setView] = useState('masonry');
  const [showTags, setShowTags] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const search = params.get('search');
    if (cat && categories.includes(cat)) setSelectedCategory(cat);
    if (search) setSearchQuery(search);
    const saved = localStorage.getItem('asyv-board-view');
    if (saved === 'freeform' || saved === 'masonry') setView(saved);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const params = { sort: sortBy };
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedTags.length) params.tags = selectedTags.join(',');

    setLoading(true);
    api
      .getPosts(params)
      .then((data) => {
        const fetchedPosts = data.posts || [];
        setPosts(fetchedPosts);
        const bookmarked = fetchedPosts.filter((p) => p.bookmarked).map((p) => p.id);
        setBookmarkedPosts((prev) => Array.from(new Set([...prev, ...bookmarked])));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory, selectedTags, sortBy]);

  const changeView = (next) => {
    setView(next);
    localStorage.setItem('asyv-board-view', next);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleLike = async (postId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const flip = (prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: Math.max(0, p.likes + (p.liked ? -1 : 1)) } : p
      );
    setPosts(flip);
    try {
      const result = await api.likePost(postId);
      setPosts((prevPosts) => prevPosts.map((p) => (p.id === postId ? { ...p, liked: result.liked } : p)));
    } catch {
      setPosts(flip);
      toast.error('Sign in to like essays');
    }
  };

  const toggleBookmark = async (postId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isCurrentlyBookmarked = bookmarkedPosts.includes(postId);
    setBookmarkedPosts((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    try {
      const result = await api.bookmarkPost(postId);
      if (result.bookmarked) {
        setBookmarkedPosts((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
        toast.success('Saved to your bookmarks 📌');
      } else {
        setBookmarkedPosts((prev) => prev.filter((id) => id !== postId));
        toast.success('Removed from bookmarks');
      }
    } catch {
      setBookmarkedPosts((prev) =>
        isCurrentlyBookmarked ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
      toast.error('Sign in to bookmark essays');
    }
  };

  const handleShare = (postId, title, e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(postId);
    toast.success('Link copied to clipboard!', { description: `"${title}"` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderCard = (post, tilt = true) => (
    <EssayCard
      post={post}
      tilt={tilt}
      onLike={handleLike}
      onBookmark={toggleBookmark}
      isBookmarked={bookmarkedPosts.includes(post.id)}
      badge={
        <button
          type="button"
          onClick={(e) => handleShare(post.id, post.title, e)}
          aria-label="Copy link"
          className="relative z-10 ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-white/70 hover:text-primary dark:hover:bg-black/20 transition-colors"
        >
          {copiedId === post.id ? <Check size={13} className="text-primary" /> : <Share2 size={13} />}
        </button>
      }
    />
  );

  const activeMeta = categoryMeta(selectedCategory);
  const ActiveIcon = activeMeta.icon;
  const hasFilters = searchQuery || selectedCategory !== 'All' || selectedTags.length > 0;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-canvas pb-24">
        {/* Board banner */}
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-note)] sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <motion.div
                  key={selectedCategory}
                  initial={{ scale: 0.6, rotate: -20 }}
                  animate={{ scale: 1, rotate: -6 }}
                  className="relative grid h-16 w-16 shrink-0 place-items-center"
                >
                  <NoteBuddy size="md" />
                  <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full border border-border bg-white text-primary shadow-sm">
                    <ActiveIcon size={13} strokeWidth={2.2} aria-hidden />
                  </span>
                </motion.div>
                <div>
                  <p className="font-hand text-xl text-accent">ASYV Writing board</p>
                  <h1 className="font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                    {selectedCategory === 'All' ? 'The Village Wall' : activeMeta.label}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {loading ? 'Pinning notes…' : `${posts.length} ${posts.length === 1 ? 'note' : 'notes'} from ASYV students`}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search the wall…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border-2 border-transparent bg-input py-3 pl-11 pr-16 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:outline-none transition-colors"
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  ) : (
                    <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg border border-border bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground sm:block">
                      ⌘K
                    </kbd>
                  )}
                </div>
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-extrabold text-accent-foreground shadow-[0_10px_24px_-12px_rgba(249,115,22,0.8)] transition-all hover:-translate-y-0.5 hover:scale-105"
                >
                  <PenLine size={16} /> Pin a note
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Toolbar */}
        <section className="sticky top-[5.5rem] z-30 mx-auto mt-5 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/85 p-2 shadow-sm backdrop-blur-md">
            <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const CatIcon = categoryMeta(cat).icon;
                const active = selectedCategory === cat;
                return (
                  <motion.button
                    key={cat}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition-colors',
                      active ? 'text-primary-foreground' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="cat-pill"
                        className="absolute inset-0 rounded-xl bg-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <CatIcon size={14} strokeWidth={2.5} className="relative" />
                    <span className="relative">{cat === 'All' ? 'All notes' : cat}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowTags((s) => !s)}
                className={cn(
                  'flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold transition-colors',
                  showTags || selectedTags.length ? 'bg-accent/10 text-accent' : 'text-foreground/70 hover:bg-secondary'
                )}
              >
                <Hash size={14} /> Tags{selectedTags.length ? ` · ${selectedTags.length}` : ''}
              </button>

              <div className="flex rounded-xl bg-secondary p-1">
                {SORTS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    title={label}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all',
                      sortBy === value ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon size={13} />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="hidden rounded-xl bg-secondary p-1 md:flex">
                {[
                  { value: 'masonry', icon: LayoutGrid, label: 'Masonry wall' },
                  { value: 'freeform', icon: Move, label: 'Free canvas' },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => changeView(value)}
                    title={label}
                    aria-label={label}
                    className={cn(
                      'rounded-lg p-1.5 transition-all',
                      view === value ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showTags && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card/90 p-3 backdrop-blur-md">
                  {allTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-bold transition-all hover:-translate-y-0.5',
                          active
                            ? 'border-accent bg-accent text-accent-foreground'
                            : 'border-border bg-card text-foreground/70 hover:border-accent/50 hover:text-accent'
                        )}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {hasFilters && (
          <div className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-2 px-4 text-xs font-bold sm:px-6 lg:px-8">
            <span className="text-muted-foreground">Filtering:</span>
            {selectedCategory !== 'All' && (
              <FilterChip onClear={() => setSelectedCategory('All')}>{selectedCategory}</FilterChip>
            )}
            {selectedTags.map((t) => (
              <FilterChip key={t} onClear={() => toggleTag(t)}>
                #{t}
              </FilterChip>
            ))}
            {searchQuery && <FilterChip onClear={() => setSearchQuery('')}>“{searchQuery}”</FilterChip>}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedTags([]);
              }}
              className="text-accent hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Board */}
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <EssayCardSkeleton key={n} tall={n % 3 === 1} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-[2rem] border-2 border-dashed border-border bg-card/80 p-10 text-center"
            >
              <NoteBuddy size="lg" className="mx-auto mb-2" />
              <h3 className="mt-4 font-display text-xl font-extrabold text-foreground">No notes here yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another board or tag — or be the first to pin something!
              </p>
              <Link
                href="/create"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-extrabold text-accent-foreground transition-transform hover:scale-105"
              >
                <PenLine size={16} /> Pin the first note
              </Link>
            </motion.div>
          ) : view === 'freeform' ? (
            <>
              <div className="hidden md:block">
                <FreeformBoard items={posts} renderItem={(post) => renderCard(post, false)} />
              </div>
              <div className="md:hidden">
                <MasonryBoard key={`${selectedCategory}-${sortBy}`}>{posts.map((post) => <div key={post.id}>{renderCard(post)}</div>)}</MasonryBoard>
              </div>
            </>
          ) : (
            <MasonryBoard key={`${selectedCategory}-${sortBy}-${selectedTags.join()}`}>
              {posts.map((post) => (
                <div key={post.id}>{renderCard(post)}</div>
              ))}
            </MasonryBoard>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function FilterChip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
      {children}
      <button onClick={onClear} aria-label="Remove filter" className="rounded-full hover:bg-primary/20">
        <X size={12} />
      </button>
    </span>
  );
}
