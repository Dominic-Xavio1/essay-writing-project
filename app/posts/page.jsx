'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  X,
  PenLine,
  Rows3,
  LayoutGrid,
  Heart,
  Bookmark,
  Share2,
  Check,
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { EssayCard, EssayCardSkeleton } from '@/components/board/EssayCard';
import { Kicker, GenreTag, EmptyNote, InkButton } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { categories, tagsFromPosts } from '@/lib/posts';
import { categoryMeta, boardContainer, boardItem, formatShortDate } from '@/lib/board';
import { openingLine } from '@/lib/essay';
import { cn } from '@/lib/utils';

const SORTS = [
  { value: 'recent', label: 'Newest' },
  { value: 'trending', label: 'Most read' },
  { value: 'most_liked', label: 'Most liked' },
];

export default function PostsPage() {
  const reduce = useReducedMotion();
  const [posts, setPosts] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [view, setView] = useState('index');

  const searchInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const search = params.get('search');
    if (cat && categories.includes(cat)) setSelectedCategory(cat);
    if (search) setSearchQuery(search);
    const saved = localStorage.getItem('asyv-shelf-view');
    if (saved === 'index' || saved === 'gallery') setView(saved);
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

  /* The tag list is built from the tags writers have actually used, so the
     filters can never offer a tag that returns nothing. It is kept from the
     unfiltered load so it does not shrink away as you filter. */
  useEffect(() => {
    api
      .getPosts({ sort: 'recent' })
      .then((data) => setAllTags(tagsFromPosts(data.posts || []).slice(0, 24)))
      .catch(() => {});
  }, []);

  const changeView = (next) => {
    setView(next);
    try {
      localStorage.setItem('asyv-shelf-view', next);
    } catch {}
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleLike = async (postId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
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
      toast.error('Sign in to like a piece.');
    }
  };

  const toggleBookmark = async (postId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const isCurrentlyBookmarked = bookmarkedPosts.includes(postId);
    setBookmarkedPosts((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    try {
      const result = await api.bookmarkPost(postId);
      if (result.bookmarked) {
        setBookmarkedPosts((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
        toast.success('Saved to your shelf');
      } else {
        setBookmarkedPosts((prev) => prev.filter((id) => id !== postId));
        toast.success('Removed from your shelf');
      }
    } catch {
      setBookmarkedPosts((prev) =>
        isCurrentlyBookmarked ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
      toast.error('Sign in to save pieces.');
    }
  };

  const handleShare = (postId, title, e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(postId);
    toast.success('Link copied', { description: title });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeMeta = categoryMeta(selectedCategory);
  const hasFilters = searchQuery || selectedCategory !== 'All' || selectedTags.length > 0;

  const clearAll = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTags([]);
  };

  const headline = useMemo(() => {
    if (searchQuery) return `Pieces mentioning “${searchQuery}”`;
    if (selectedCategory !== 'All') return activeMeta.label;
    return 'Everything we have published';
  }, [searchQuery, selectedCategory, activeMeta.label]);

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main" className="pb-24">
        {/* ── Shelf heading ──────────────────────────────────────────────── */}
        <section className="border-b border-rule paper-grain">
          <div className="relative mx-auto max-w-[84rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="font-reading text-2xl leading-none"
                    style={{ color: activeMeta.accent }}
                  >
                    {activeMeta.mark}
                  </span>
                  <Kicker>{activeMeta.kicker}</Kicker>
                </div>

                <h1 className="font-display type-5 font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
                  {headline}
                </h1>

                <p className="mt-4 font-reading type-1 leading-relaxed text-ink-soft">
                  {loading
                    ? 'Counting the pages…'
                    : `${posts.length} ${posts.length === 1 ? 'piece' : 'pieces'}${
                        selectedCategory === 'All' ? '' : ` in ${activeMeta.label}`
                      }. ${activeMeta.blurb}`}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
                <div className="relative flex-1 lg:w-72">
                  <Search
                    size={16}
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  />
                  <label htmlFor="shelf-search" className="sr-only">
                    Search the collection
                  </label>
                  <input
                    id="shelf-search"
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search titles and text…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-rule bg-input py-2.5 pl-9 pr-9 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-foreground"
                      aria-label="Clear the search"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  ) : (
                    <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 border border-rule px-1.5 py-0.5 text-[0.625rem] text-ink-faint sm:block">
                      ⌘K
                    </kbd>
                  )}
                </div>

                <InkButton href="/create" variant="solid">
                  <PenLine size={15} aria-hidden /> Write
                </InkButton>
              </div>
            </div>
          </div>
        </section>

        {/* ── Genre rail + controls ──────────────────────────────────────── */}
        <section className="sticky top-[4.5rem] z-30 border-b border-rule bg-paper/95 backdrop-blur-[2px]">
          <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2.5">
              <nav aria-label="Genres" className="flex shrink-0 items-center gap-5">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      aria-pressed={active}
                      className={cn(
                        'relative whitespace-nowrap py-1.5 text-[0.8125rem] font-medium uppercase tracking-[0.1em] transition-colors',
                        active ? 'text-foreground' : 'text-ink-faint hover:text-ink-soft'
                      )}
                    >
                      {cat === 'All' ? 'All' : categoryMeta(cat).label}
                      {active && (
                        <motion.span
                          layoutId="shelf-rule"
                          className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-accent"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              <span aria-hidden className="ml-auto hidden h-5 w-px shrink-0 bg-rule sm:block" />

              <div className="flex shrink-0 items-center gap-4">
                <div className="hidden items-center gap-3 sm:flex">
                  {SORTS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSortBy(option.value)}
                      aria-pressed={sortBy === option.value}
                      className={cn(
                        'text-xs transition-colors',
                        sortBy === option.value
                          ? 'font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4'
                          : 'text-ink-faint hover:text-ink-soft'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center border border-rule">
                  {[
                    { value: 'index', icon: Rows3, label: 'Contents list' },
                    { value: 'gallery', icon: LayoutGrid, label: 'Gallery' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeView(value)}
                      aria-label={label}
                      aria-pressed={view === value}
                      title={label}
                      className={cn(
                        'p-1.5 transition-colors',
                        view === value ? 'bg-secondary text-foreground' : 'text-ink-faint hover:text-ink-soft'
                      )}
                    >
                      <Icon size={15} aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags that writers have actually used */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar border-t border-rule py-2">
                <span className="label shrink-0 text-[0.5625rem]">Tags</span>
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                      className={cn(
                        'shrink-0 whitespace-nowrap text-xs transition-colors',
                        active
                          ? 'font-medium text-accent underline decoration-accent underline-offset-4'
                          : 'text-ink-faint hover:text-ink-soft'
                      )}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {hasFilters && (
          <div className="mx-auto flex max-w-[84rem] flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-5 text-xs sm:px-6 lg:px-8">
            <span className="label text-[0.5625rem]">Filtering</span>
            {selectedCategory !== 'All' && (
              <FilterChip onClear={() => setSelectedCategory('All')}>
                {categoryMeta(selectedCategory).label}
              </FilterChip>
            )}
            {selectedTags.map((t) => (
              <FilterChip key={t} onClear={() => toggleTag(t)}>
                #{t}
              </FilterChip>
            ))}
            {searchQuery && <FilterChip onClear={() => setSearchQuery('')}>“{searchQuery}”</FilterChip>}
            <button type="button" onClick={clearAll} className="link-quiet text-ink-soft">
              Clear all
            </button>
          </div>
        )}

        {/* ── The collection ────────────────────────────────────────────── */}
        <section className="mx-auto mt-10 max-w-[84rem] px-4 sm:px-6 lg:px-8">
          {loading ? (
            view === 'index' ? (
              <ul className="divide-y divide-rule border-y border-rule">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="py-6">
                    <div className="h-3 w-24 skeleton-shimmer" />
                    <div className="mt-3 h-6 w-2/3 skeleton-shimmer" />
                    <div className="mt-2 h-4 w-1/2 skeleton-shimmer" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <EssayCardSkeleton key={n} tall={n % 3 === 1} />
                ))}
              </div>
            )
          ) : posts.length === 0 ? (
            <EmptyNote
              title={hasFilters ? 'Nothing matches that' : 'This shelf is empty'}
              action={
                hasFilters ? (
                  <InkButton variant="outline" onClick={clearAll}>
                    Clear the filters
                  </InkButton>
                ) : (
                  <InkButton href="/create" variant="solid">
                    <PenLine size={15} aria-hidden /> Write the first piece
                  </InkButton>
                )
              }
            >
              {hasFilters
                ? 'Try a different genre, drop a tag, or search for something shorter.'
                : 'When a mentor approves a piece in this genre, it will appear here.'}
            </EmptyNote>
          ) : view === 'index' ? (
            <ContentsList
              posts={posts}
              reduce={reduce}
              onLike={handleLike}
              onBookmark={toggleBookmark}
              bookmarkedPosts={bookmarkedPosts}
            />
          ) : (
            <motion.div
              key={`${selectedCategory}-${sortBy}-${selectedTags.join()}`}
              variants={boardContainer}
              initial={reduce ? false : 'hidden'}
              animate="show"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {posts.map((post) => (
                <EssayCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onBookmark={toggleBookmark}
                  isBookmarked={bookmarkedPosts.includes(post.id)}
                  badge={
                    <button
                      type="button"
                      onClick={(e) => handleShare(post.id, post.title, e)}
                      aria-label="Copy a link to this piece"
                      className="relative z-10 p-1 text-ink-faint transition-colors hover:text-primary"
                    >
                      {copiedId === post.id ? (
                        <Check size={13} className="text-primary" aria-hidden />
                      ) : (
                        <Share2 size={13} aria-hidden />
                      )}
                    </button>
                  }
                />
              ))}
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FilterChip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-rule px-2 py-1 text-ink-soft">
      {children}
      <button type="button" onClick={onClear} aria-label="Remove this filter" className="hover:text-accent">
        <X size={11} aria-hidden />
      </button>
    </span>
  );
}

/**
 * The contents list: a dense, scannable index of everything on the shelf,
 * set the way a magazine prints its table of contents.
 */
function ContentsList({ posts, reduce, onLike, onBookmark, bookmarkedPosts }) {
  return (
    <motion.ul
      variants={boardContainer}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className="divide-y divide-rule border-y border-rule"
    >
      {posts.map((post, i) => (
        <motion.li key={post.id} variants={boardItem} className="group relative">
          <div className="flex gap-4 py-6 sm:gap-7">
            <span
              aria-hidden
              className="hidden w-8 shrink-0 pt-1 font-reading text-sm tabular-nums text-ink-faint sm:block"
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <GenreTag category={post.category} />
                <span aria-hidden className="text-ink-faint">·</span>
                <span className="text-[0.6875rem] text-ink-faint">
                  {formatShortDate(post.created_at)}
                  {post.read_time ? ` · ${post.read_time} min` : ''}
                </span>
              </div>

              <h2 className="mt-2 font-display type-3 font-semibold leading-tight text-foreground">
                <Link href={`/posts/${post.id}`} className="after:absolute after:inset-0 after:content-['']">
                  <span className="ink-underline">{post.title}</span>
                </Link>
              </h2>

              <p className="mt-2 max-w-2xl font-reading text-[0.9375rem] leading-relaxed text-ink-soft line-clamp-2">
                {post.excerpt?.trim() || openingLine(post.content || '')}
              </p>

              {post.author?.name && (
                <Link
                  href={`/author/${post.author.id}`}
                  className="link-quiet relative z-10 mt-2.5 inline-block text-[0.8125rem] font-medium text-foreground"
                >
                  {post.author.name}
                </Link>
              )}
            </div>

            <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
              <button
                type="button"
                onClick={(e) => onLike(post.id, e)}
                aria-label={post.liked ? 'Remove your like' : 'Like this piece'}
                aria-pressed={Boolean(post.liked)}
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-1 text-xs transition-colors',
                  post.liked ? 'text-accent' : 'text-ink-faint hover:text-accent'
                )}
              >
                <Heart size={14} aria-hidden className={post.liked ? 'fill-current' : ''} />
                <span className="tabular-nums">{post.likes ?? 0}</span>
              </button>

              <button
                type="button"
                onClick={(e) => onBookmark(post.id, e)}
                aria-label={bookmarkedPosts.includes(post.id) ? 'Remove from your shelf' : 'Save to your shelf'}
                aria-pressed={bookmarkedPosts.includes(post.id)}
                className={cn(
                  'p-1.5 transition-colors',
                  bookmarkedPosts.includes(post.id)
                    ? 'text-primary'
                    : 'text-ink-faint hover:text-primary'
                )}
              >
                <Bookmark
                  size={14}
                  aria-hidden
                  className={bookmarkedPosts.includes(post.id) ? 'fill-current' : ''}
                />
              </button>
            </div>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
