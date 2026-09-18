'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { EmojiBurstButton } from '@/components/ui/likeButton';
import { categories, allTags } from '@/lib/posts';
import { api } from '@/lib/api-client';
import { ClapButton } from '@/components/ui/clap-button';
import { AuthorHoverCard } from '@/components/ui/author-hover-card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  MessageSquare,
  Share2,
  Bookmark,
  Search,
  Clock,
  Sparkles,
  X,
  TrendingUp,
  SlidersHorizontal,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const searchInputRef = useRef(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
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
    api.getPosts(params)
      .then((data) => {
        const fetchedPosts = data.posts || [];
        setPosts(fetchedPosts);
        const bookmarked = fetchedPosts.filter((p) => p.bookmarked).map((p) => p.id);
        setBookmarkedPosts((prev) => Array.from(new Set([...prev, ...bookmarked])));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory, selectedTags, sortBy]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLike = async (postId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.liked;
          return {
            ...p,
            liked: nextLiked,
            likes: Math.max(0, p.likes + (nextLiked ? 1 : -1)),
          };
        }
        return p;
      })
    );

    try {
      const result = await api.likePost(postId);
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, liked: result.liked } : p))
      );
    } catch {
      // Revert optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            const revertedLiked = !p.liked;
            return {
              ...p,
              liked: revertedLiked,
              likes: Math.max(0, p.likes + (revertedLiked ? 1 : -1)),
            };
          }
          return p;
        })
      );
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
        toast.success('Essay saved to bookmarks!');
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
    toast.success('Link copied to clipboard!', {
      description: `"${title}"`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pb-20">
        {/* Header Hero Banner */}
        <section className="bg-secondary/40 border-b border-border/80 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={13} /> Curated Reading Feed
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
                Discover Thoughtful Writing
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                Explore deep dives, essays, and stories crafted by writers around the world on technology, philosophy, design, and society.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Interactive Search Bar & Hotkey Bar */}
          <div className="mb-8 relative max-w-3xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-muted-foreground" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-3.5 bg-card border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs"
              />
              <div className="absolute right-3 flex items-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-muted-foreground hover:text-foreground rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[11px] font-mono font-medium text-muted-foreground bg-secondary border border-border px-2 py-1 rounded-md">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Sort By Toggle */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <SlidersHorizontal size={14} /> Sort Feed
                </h3>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary rounded-lg">
                  {['recent', 'trending'].map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                        sortBy === sort
                          ? 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sort === 'trending' ? '🔥 Trending' : '✨ Recent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Categories
                </h3>
                <div className="space-y-1">
                  {categories.map((category) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`relative w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Filter by Tag
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Posts Content Feed */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-card border border-border p-6 rounded-xl space-y-4 skeleton-shimmer"
                    >
                      <div className="h-4 bg-muted/60 rounded-md w-1/4" />
                      <div className="h-6 bg-muted/80 rounded-md w-3/4" />
                      <div className="h-4 bg-muted/50 rounded-md w-full" />
                      <div className="h-4 bg-muted/50 rounded-md w-2/3" />
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 px-6 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-4 text-xl">
                    🔍
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-2 text-foreground">No essays found</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Try adjusting your search query or switching categories to explore more stories.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedTags([]);
                    }}
                    className="px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-muted transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence>
                    {posts.map((post) => {
                      const isBookmarked = bookmarkedPosts.includes(post.id);
                      console.log("The post that I am expecting to see ",post);
                      return (
                        <motion.article
                          key={post.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          whileHover={{ y: -2, scale: 1.005 }}
                          transition={{ duration: 0.25 }}
                          className="group bg-card border border-border/80 hover:border-primary/50 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex flex-col md:flex-row gap-6 p-6 sm:p-7">
                            {post.featured_image && (
                              <div className="md:w-56 h-40 md:h-auto flex-shrink-0 relative overflow-hidden rounded-xl bg-secondary">
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                {post.author && (
                                  <div className="flex items-center gap-3 mb-3">
                                    <AuthorHoverCard author={post.author}>
                                      <div className="flex items-center gap-2">
                                        <UserAvatar
                                          src={post.author.avatar}
                                          name={post.author.name}
                                          size="sm"
                                        />
                                        <span className="font-semibold text-xs text-foreground hover:text-primary transition-colors">
                                          {post.author.name}
                                        </span>
                                      </div>
                                    </AuthorHoverCard>

                                    <span className="text-muted-foreground text-xs">•</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(post.created_at)}
                                    </span>
                                    <span className="text-muted-foreground text-xs hidden sm:inline">•</span>

                                    <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                                      <Clock size={11} /> {post.read_time} min read
                                    </div>
                                  </div>
                                )}

                                <Link href={`/posts/${post.id}`} className="block group/link">
                                  <h2 className="font-serif text-xl sm:text-2xl font-bold mb-2.5 text-foreground group-hover/link:text-primary transition-colors leading-snug">
                                    {post.title}
                                  </h2>
                                </Link>

                                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-4">
                                  {post.excerpt}
                                </p>
                              </div>

                              <div>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                  <span className="text-[11px] font-semibold bg-secondary text-foreground px-2.5 py-0.5 rounded-full">
                                    {post.category}
                                  </span>
                                  {post.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <EmojiBurstButton
                                        label="Like"
                                        onReact={() => handleLike(post.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                          post.liked
                                            ? 'bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-900'
                                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                      >
                                        <span>{post.liked ? '❤️' : '🤍'}</span>
                                        <span>{post.likes}</span>
                                      </EmojiBurstButton>
                                    </div>

                                    <Link
                                      href={`/posts/${post.id}#comments`}
                                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-full hover:bg-secondary transition-colors"
                                    >
                                      <MessageSquare size={16} />
                                      <span className="font-medium">{post.comments}</span>
                                    </Link>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => handleShare(post.id, post.title, e)}
                                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                                      title="Share link"
                                    >
                                      {copiedId === post.id ? (
                                        <Check size={17} className="text-emerald-500" />
                                      ) : (
                                        <Share2 size={17} />
                                      )}
                                    </button>

                                    <motion.button
                                      whileTap={{ scale: 0.8 }}
                                      onClick={(e) => toggleBookmark(post.id, e)}
                                      className={`p-2 rounded-full transition-colors ${
                                        isBookmarked
                                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                      }`}
                                      title={isBookmarked ? 'Saved' : 'Save essay'}
                                    >
                                      <Bookmark
                                        size={18}
                                        className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''}
                                      />
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
