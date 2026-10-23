'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { ReadingBuddy } from '@/components/shared/ReadingBuddy';
import { ReadingReflection } from '@/components/shared/ReadingReflection';
import { READING_QUOTES } from '@/lib/reading-quotes';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';
import { ClapButton } from '@/components/ui/clap-button';
import { AuthorHoverCard } from '@/components/ui/author-hover-card';
import { EmojiPickerPopover } from '@/components/ui/EmojiPickerPopover';
import { CreativeLikeAnimation } from '@/components/ui/CreativeLikeAnimation';
import {
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  Sparkles,
  UserPlus,
  Check,
  Maximize2,
  Minimize2,
  Type,
  ArrowLeft,
  Smile,
  Send,
  CornerDownRight,
  TrendingUp,
  X,
  Heart,
  BookOpen,
  Quote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id;

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState([]);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [commentSort, setCommentSort] = useState('newest'); // 'newest' | 'likes'
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reader state
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [seenQuoteIndices, setSeenQuoteIndices] = useState([0]);
  const [textSize, setTextSize] = useState('large');
  const [focusMode, setFocusMode] = useState(false);
  const quoteStageRef = useRef(0);

  // Image Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Periodic read analytics beacon
  useEffect(() => {
    if (!id) return;
    let secondsSpent = 0;
    const interval = setInterval(() => {
      secondsSpent += 5;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = totalHeight > 0 ? Math.round((window.scrollY / totalHeight) * 100) : 0;
      fetch(`/api/posts/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readDuration: secondsSpent, scrollDepth: depth }),
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // Scroll Progress listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const quoteStage = Math.min(9, Math.floor(scrollProgress / 10));

  useEffect(() => {
    if (quoteStageRef.current === quoteStage) return;
    quoteStageRef.current = quoteStage;

    const repeatSeenQuote = seenQuoteIndices.length > 0 && Math.random() < 0.2;
    const unseenQuotes = READING_QUOTES
      .map((_, index) => index)
      .filter((index) => !seenQuoteIndices.includes(index));
    const availableQuotes = repeatSeenQuote ? seenQuoteIndices : unseenQuotes;
    const pool = availableQuotes.length > 0
      ? availableQuotes
      : READING_QUOTES.map((_, index) => index);
    const nextQuoteIndex = pool[Math.floor(Math.random() * pool.length)];

    setQuoteIndex(nextQuoteIndex);
    setSeenQuoteIndices((seen) =>
      seen.includes(nextQuoteIndex) ? seen : [...seen, nextQuoteIndex]
    );
  }, [quoteStage, seenQuoteIndices]);

  // Fetch Post & Comments
  useEffect(() => {
    if (!id) return;
    api
      .getPost(id)
      .then((data) => {
        setPost(data.post);
        setRelated(data.related || []);
        setLiked(data.post.liked ?? false);
        setBookmarked(data.post.bookmarked ?? false);
        setFollowing(data.post.author?.isFollowing ?? false);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));

    api
      .getComments(id)
      .then((data) => setComments(data.comments || []))
      .catch(() => {});

    api
      .getReactions(id)
      .then((data) => {
        setReactionCounts(data.reactions || []);
        if (data.userReaction) setSelectedReaction(data.userReaction);
      })
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Preparing essay for reading...</p>
        </main>
        <Footer />
      </>
    );
  }
  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="font-serif text-3xl font-bold mb-3 text-foreground">Essay not found</h1>
            <p className="text-muted-foreground text-sm mb-6">
              The essay you are looking for may have been moved or unpublished.
            </p>
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Discover
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setPost((prev) => ({ ...prev, likes: Math.max(0, prev.likes + (nextLiked ? 1 : -1)) }));

    try {
      const result = await api.likePost(id);
      setLiked(result.liked);
    } catch {
      setLiked(!nextLiked);
      setPost((prev) => ({ ...prev, likes: Math.max(0, prev.likes + (nextLiked ? -1 : 1)) }));
      toast.error('Sign in to like this essay');
    }
  };

  const handleBookmark = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      const result = await api.bookmarkPost(id);
      setBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? 'Essay saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      setBookmarked(!nextBookmarked);
      toast.error('Sign in to bookmark this essay');
    }
  };

  const handleReaction = async (emoji) => {
    try {
      const res = await api.reactPost(id, emoji);
      setSelectedReaction(res.userReaction);
      setReactionCounts(res.reactions || []);
      if (res.removed) {
        toast.info(`Removed reaction ${emoji}`);
      } else {
        toast.success(`Reacted with ${emoji}`);
      }
    } catch {
      toast.error('Sign in to react');
    }
  };

  const handleFollow = async () => {
    if (!post.author) return;
    const nextFollowing = !following;
    setFollowing(nextFollowing);

    try {
      const result = await api.followUser(post.author.id);
      setFollowing(result.following);
      toast.success(result.following ? `Following ${post.author.name}` : `Unfollowed ${post.author.name}`);
    } catch {
      setFollowing(!nextFollowing);
      toast.error('Sign in to follow authors');
    }
  };

  const handleAddComment = async (parentId = null) => {
    const textToSend = parentId ? replyText : newComment;
    if (!textToSend.trim()) return;

    setSubmittingComment(true);

    try {
      const data = await api.addComment(id, textToSend.trim(), parentId);
      if (!data.comment) throw new Error(data.error || 'Failed to post comment');

      setComments((prev) => [data.comment, ...prev]);
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewComment('');
      }
      setPost((prev) => ({ ...prev, comments: (prev.comments || 0) + 1 }));
      toast.success(parentId ? 'Reply posted!' : 'Comment posted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Please sign in to post comments');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !c.likedByViewer;
          return {
            ...c,
            likedByViewer: nextLiked,
            likes: Math.max(0, c.likes + (nextLiked ? 1 : -1)),
          };
        }
        return c;
      })
    );

    try {
      const res = await api.likeComment(commentId);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likedByViewer: res.liked } : c))
      );
    } catch {
      toast.error('Sign in to like comments');
    }
  };

  const handleShare = () => {
    const text = `Check out: "${post.title}" on Post Your Work`;
    if (navigator.share) {
      navigator.share({ title: 'Post Your Work', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const cycleTextSize = () => {
    if (textSize === 'normal') setTextSize('large');
    else if (textSize === 'large') setTextSize('xlarge');
    else setTextSize('normal');
  };

  const textSizeClasses = {
    normal: 'text-base leading-relaxed',
    large: 'text-lg leading-loose',
    xlarge: 'text-xl leading-loose',
  };

  const READING_MOMENTS = [
    { buddy: 'mouse', mood: 'curious' },
    { buddy: 'monkey', mood: 'focused' },
    { buddy: 'hippo', mood: 'determined' },
    { buddy: 'mouse', mood: 'joyful' },
  ];

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'likes') return (b.likes || 0) - (a.likes || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const readingMoment = READING_MOMENTS[Math.min(3, Math.floor(scrollProgress / 25))];
  const readingQuote = READING_QUOTES[quoteIndex];

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="reader-scene">
        <div className="reader-scene__backdrop" aria-hidden="true" />
        <div className="relative z-10">
      {!focusMode && <Header />}

      <main className="relative min-h-screen pb-32">
        {/* Pinned-print featured image */}
        {post.featured_image && (
          <figure className="relative mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
            <span aria-hidden="true" className="absolute left-[18%] top-7 z-10 hidden h-6 w-20 -rotate-6 rounded-sm bg-primary/20 shadow-sm sm:block" />
            <div className="reader-glass group relative overflow-hidden rounded-[1.75rem] border p-2 sm:p-3">
              <div className="relative flex max-h-[520px] min-h-[240px] items-center justify-center overflow-hidden rounded-[1.25rem] bg-secondary/50 sm:min-h-[320px]">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="max-h-[520px] w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                />

                <button
                  onClick={() => setLightboxOpen(true)}
                  aria-label="View full-size image"
                  className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-border bg-white/95 text-foreground shadow-sm transition-colors hover:bg-primary hover:text-white sm:bottom-4 sm:right-4"
                  title="View full resolution image"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
            <figcaption className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-px w-5 bg-primary/30" />
              A moment from the story
              <span className="h-px w-5 bg-primary/30" />
            </figcaption>
          </figure>
        )}

        {/* Article Container */}
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${focusMode ? 'max-w-4xl' : 'grid max-w-7xl grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,56rem)_minmax(0,1fr)]'}`}>
          {!focusMode && (
            <aside aria-label="Reading companion" className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center text-center xl:flex">
              <ReadingBuddy variant={readingMoment.buddy} mood={readingMoment.mood} progress={scrollProgress} />
              <p className="mt-2 text-[10px] font-extrabold uppercase text-primary">{readingMoment.mood === 'joyful' ? 'You made it!' : 'Reading buddy'}</p>
              <div
                className="reader-glass mt-2 flex items-center gap-2 rounded-full border px-3 py-2 text-xs text-muted-foreground"
                role="progressbar"
                aria-label="Article reading progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(scrollProgress)}
              >
                <BookOpen size={14} className="text-primary" aria-hidden="true" />
                <span className="font-bold text-foreground">{Math.round(scrollProgress)}%</span>
                <span>{readingMoment.mood === 'joyful' ? 'done' : 'read'}</span>
              </div>
            </aside>
          )}

        <article className={`w-full max-w-6xl px-5 py-8 pb-16 sm:px-8 lg:px-10 ${focusMode ? 'mx-auto' : 'mx-auto xl:col-start-2'}`}>
          {/* Category & Tags */}
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-primary/10 text-primary px-3.5 py-1.5 rounded-full border border-primary/20 shadow-xs">
              {post.category}
            </span>
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground bg-secondary/80 border border-border/60 px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold mb-6 leading-[1.18] text-foreground tracking-tight">
            {post.title}
          </h1>

          {/* Author Meta Info */}
          <div className="flex items-center justify-between gap-4 mb-10 pb-8 border-b border-border/80">
            {post.author && (
              <AuthorHoverCard author={post.author}>
                <div className="flex items-center gap-3.5 group cursor-pointer">
                  <img
                    src={post.author.avatar || '/placeholder-user.jpg'}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all"
                  />
                  <div>
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors block">
                      {post.author.name}
                    </span>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                        <Clock size={12} /> {post.read_time} min read
                      </span>
                    </p>
                  </div>
                </div>
              </AuthorHoverCard>
            )}

            {!post.author?.isSelf && (
              <div className="flex items-center gap-2">
                <Button
                  variant={following ? 'outline' : 'accent'}
                  size="sm"
                  onClick={handleFollow}
                >
                  {following ? (
                    <>
                      <Check size={13} /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} /> Follow
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="reader-glass mb-8 rounded-2xl border p-4 xl:hidden">
            <div className="flex items-start gap-3">
              <Quote size={17} className="mt-0.5 shrink-0 text-primary/70" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">A quiet thought</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="font-hand text-lg leading-snug text-foreground"
                  >
                    {readingQuote}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <div className="mt-4 border-t border-border/60 pt-3">
              <ReadingReflection postId={id} />
            </div>
          </div>

          {/* Article Body Content */}
          <div
            className={`reading-prose max-w-none mb-16 ${textSizeClasses[textSize]}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Reader Actions & Reactions Bar */}
          <div className="reader-glass relative mb-16 rounded-2xl border p-6">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 animate-pulse" /> Express Your Thoughts
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <ClapButton initialCount={post.likes} onClap={handleLike} size="lg" />

              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                  bookmarked
                    ? 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-900 shadow-xs'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bookmark size={16} className={bookmarked ? 'fill-amber-500 text-amber-500' : ''} />
                <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                <Share2 size={16} /> Share
              </button>

              {/* Reaction Trigger with Modern Emoji Picker Dropdown */}
              <EmojiPickerPopover
                side="bottom"
                align="start"
                onSelectEmoji={(emoji) => handleReaction(emoji)}
                trigger={
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                    <Smile size={16} className="text-amber-500" />
                    <span>{selectedReaction ? `Reacted ${selectedReaction}` : '✨ Add Reaction'}</span>
                  </button>
                }
              />

              {/* Display existing reaction counts */}
              {reactionCounts.map((rc) => (
                <button
                  key={rc.emoji}
                  onClick={() => handleReaction(rc.emoji)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedReaction === rc.emoji
                      ? 'bg-primary/10 border-primary text-primary shadow-xs'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{rc.emoji}</span>
                  <span className="font-bold">{rc.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upgraded Comments Section */}
          <section id="comments" className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2.5">
                <MessageCircle size={22} className="text-primary" />
                Comments ({comments.length})
              </h2>

              {/* Comments Sort Dropdown */}
              {comments.length > 1 && (
                <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/60 text-xs">
                  <button
                    onClick={() => setCommentSort('newest')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      commentSort === 'newest'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setCommentSort('likes')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      commentSort === 'likes'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TrendingUp size={12} /> Top
                  </button>
                </div>
              )}
            </div>

            {/* Comment Composer */}
            <div className="reader-glass relative z-30 mb-8 rounded-2xl border p-5">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts on this essay?"
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-3 bg-secondary/70 border border-border/80 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3 placeholder:text-muted-foreground"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EmojiPickerPopover
                    side="bottom"
                    align="start"
                    avoidCollisions={false}
                    onSelectEmoji={(emoji) => setNewComment((prev) => prev + emoji)}
                    trigger={
                      <button
                        type="button"
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        title="Insert emoji"
                      >
                        <Smile size={18} className="text-amber-500" />
                      </button>
                    }
                  />

                  <span className="text-[11px] text-muted-foreground">
                    {newComment.length}/1000
                  </span>
                </div>

                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleAddComment(null)}
                  disabled={!newComment.trim() || submittingComment}
                  className="flex items-center gap-1.5 px-4 py-2"
                >
                  {submittingComment ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={14} /> Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Comments Feed */}
            {sortedComments.length === 0 ? (
              <div className="reader-glass rounded-2xl border px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 text-2xl">
                  💬
                </div>
                <p className="font-medium text-foreground text-sm mb-1">No comments yet</p>
                <p className="text-xs text-muted-foreground">
                  Be the first to share your thoughts on this essay!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedComments
                  .filter((c) => !c.parentId)
                  .map((comment) => {
                    const replies = sortedComments.filter((r) => r.parentId === comment.id);
                    const isAuthor = comment.user_id === post.author_id;

                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="reader-glass rounded-2xl border p-5 shadow-xs transition-all hover:border-primary/30"
                      >
                        <div className="flex gap-3.5">
                          <img
                            src={comment.avatar || '/placeholder-user.jpg'}
                            alt={comment.author}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/10"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-foreground">{comment.author}</p>
                                {isAuthor && (
                                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    Author
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-foreground/90 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                              {comment.text}
                            </p>

                            <div className="flex items-center gap-4">
                              {/* Instagram / TikTok Inspired Interactive Particle Like Animation */}
                              <CreativeLikeAnimation
                                isLiked={comment.likedByViewer}
                                onToggle={() => handleLikeComment(comment.id)}
                              >
                                <div
                                  className={`text-xs flex items-center gap-1.5 font-semibold px-3 py-1 rounded-full border transition-all ${
                                    comment.likedByViewer
                                      ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 shadow-xs'
                                      : 'text-muted-foreground border-border/80 hover:text-foreground hover:bg-secondary'
                                  }`}
                                >
                                  <Heart
                                    size={14}
                                    className={comment.likedByViewer ? 'fill-rose-500 text-rose-500' : ''}
                                  />
                                  <span>{comment.likes || 0}</span>
                                </div>
                              </CreativeLikeAnimation>

                              <button
                                onClick={() =>
                                  setReplyingToId(replyingToId === comment.id ? null : comment.id)
                                }
                                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                              >
                                <CornerDownRight size={13} /> Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Reply Drawer */}
                        <AnimatePresence>
                          {replyingToId === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 ml-10 pl-3 border-l-2 border-primary/30 pt-3 relative"
                            >
                              <div className="relative flex gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to ${comment.author}...`}
                                  className="flex-1 px-3.5 py-2 text-xs bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />

                                <EmojiPickerPopover
                                  side="top"
                                  align="end"
                                  onSelectEmoji={(emoji) => setReplyText((prev) => prev + emoji)}
                                  trigger={
                                    <button
                                      type="button"
                                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                                      title="Insert emoji"
                                    >
                                      <Smile size={16} className="text-amber-500" />
                                    </button>
                                  }
                                />

                                <Button
                                  variant="accent"
                                  size="sm"
                                  disabled={!replyText.trim() || submittingComment}
                                  onClick={() => handleAddComment(comment.id)}
                                >
                                  Reply
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Sub-comments / Nested Replies */}
                        {replies.length > 0 && (
                          <div className="mt-4 ml-8 sm:ml-10 space-y-3 pt-3 border-t border-border/50">
                            {replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="reader-glass flex gap-3 rounded-xl border p-3.5"
                              >
                                <img
                                  src={reply.avatar || '/placeholder-user.jpg'}
                                  alt={reply.author}
                                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-primary/20"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-bold text-xs text-foreground">{reply.author}</p>
                                      {reply.user_id === post.author_id && (
                                        <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                                          Author
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(reply.created_at).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <p className="text-foreground/90 text-xs leading-relaxed mb-2 whitespace-pre-wrap">
                                    {reply.text}
                                  </p>

                                  <CreativeLikeAnimation
                                    isLiked={reply.likedByViewer}
                                    onToggle={() => handleLikeComment(reply.id)}
                                  >
                                    <div
                                      className={`text-[11px] inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                                        reply.likedByViewer
                                          ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40'
                                          : 'text-muted-foreground border-border/60 hover:text-foreground'
                                      }`}
                                    >
                                      <Heart
                                        size={12}
                                        className={reply.likedByViewer ? 'fill-rose-500 text-rose-500' : ''}
                                      />
                                      <span>{reply.likes || 0}</span>
                                    </div>
                                  </CreativeLikeAnimation>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Recommended Essays */}
          {related.length > 0 && (
            <section className="border-t border-border/80 pt-12">
              <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">Recommended Essays</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/posts/${relatedPost.id}`}
                    className="reader-glass group rounded-xl border p-5 shadow-xs transition-all hover:border-primary"
                  >
                    {relatedPost.featured_image && (
                      <div className="h-36 overflow-hidden rounded-lg mb-4 bg-secondary">
                        <img
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-primary transition-colors mb-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {relatedPost.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

          {!focusMode && (
            <aside aria-label="Reading inspiration" className="fixed right-4 top-1/2 z-30 hidden w-48 -translate-y-1/2 space-y-3 xl:block">
              <div className="reader-glass rounded-2xl border p-4">
                <Quote size={17} className="text-primary/70" aria-hidden="true" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary">A quiet thought</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 font-hand text-lg leading-snug text-foreground"
                  >
                    {readingQuote}
                  </motion.p>
                </AnimatePresence>
                <span className="mt-3 block text-[10px] font-bold uppercase text-muted-foreground">ASYV Writing</span>
              </div>
              <ReadingReflection postId={id} />
              <div aria-hidden="true" className="ml-6 flex h-9 w-9 rotate-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary/70">
                <Heart size={16} />
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Floating Sticky Reader Action Bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="reader-glass fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2.5 shadow-2xl sm:gap-4"
      >
        <ClapButton initialCount={post.likes} onClap={handleLike} size="sm" />

        <div className="h-4 w-px bg-border" />

        <a
          href="#comments"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Jump to comments"
        >
          <MessageCircle size={17} />
          <span className="font-semibold">{comments.length}</span>
        </a>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={handleBookmark}
          className={`p-1.5 rounded-full transition-colors ${
            bookmarked ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Save essay"
        >
          <Bookmark size={17} className={bookmarked ? 'fill-amber-500 text-amber-500' : ''} />
        </button>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={cycleTextSize}
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"
          title={`Text Size: ${textSize}`}
        >
          <Type size={14} />
          <span className="text-[10px] uppercase font-bold">{textSize[0]}</span>
        </button>

        <button
          onClick={() => {
            setFocusMode(!focusMode);
            toast.info(focusMode ? 'Exited Focus Mode' : 'Entered Focus Mode (distraction-free)');
          }}
          className={`p-1.5 rounded-full transition-colors ${
            focusMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          title={focusMode ? 'Exit Focus Mode' : 'Focus Mode (hide UI)'}
        >
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </motion.div>

      {/* Fullscreen High-Res Image Lightbox */}
      <AnimatePresence>
        {lightboxOpen && post.featured_image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={post.featured_image}
              alt={post.title}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!focusMode && <Footer readerTheme />}
        </div>
      </div>
    </>
  );
}
