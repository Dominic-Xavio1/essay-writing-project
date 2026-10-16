'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageCircle,
  Share2,
  Bookmark,
  Check,
  Maximize2,
  Minimize2,
  Type,
  ArrowLeft,
  Smile,
  Send,
  CornerDownRight,
  X,
  Heart,
  UserPlus,
  Expand,
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { ReadingLine } from '@/components/editorial/ReadingLine';
import { PostCover } from '@/components/editorial/GenreCover';
import {
  Kicker,
  GenreTag,
  SectionHead,
  InkButton,
  LoadingLine,
  EmptyNote,
} from '@/components/editorial/Bits';
import { AuthorHoverCard } from '@/components/ui/author-hover-card';
import { EmojiPickerPopover } from '@/components/ui/EmojiPickerPopover';
import { CreativeLikeAnimation } from '@/components/ui/CreativeLikeAnimation';
import { api } from '@/lib/api-client';
import { categoryMeta, formatLongDate } from '@/lib/board';
import { headingsFrom, withHeadingAnchors, openingLine } from '@/lib/essay';
import { cn } from '@/lib/utils';

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id;
  const reduce = useReducedMotion();

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState([]);

  // Responses
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [commentSort, setCommentSort] = useState('newest');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reader state
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [textSize, setTextSize] = useState('large');
  const [focusMode, setFocusMode] = useState(false);
  const [copied, setCopied] = useState(false);
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

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .getPost(id)
      .then((data) => {
        setPost(data.post);
        setRelated(data.related || []);
        setLiked(data.post.liked ?? false);
        setBookmarked(data.post.bookmarked ?? false);
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

  /* The essay's own section headings, used by the margin reading line. */
  const headings = useMemo(() => headingsFrom(post?.content || ''), [post?.content]);
  const bodyHtml = useMemo(() => withHeadingAnchors(post?.content || ''), [post?.content]);

  const sortedComments = useMemo(
    () =>
      [...comments].sort((a, b) => {
        if (commentSort === 'likes') return (b.likes || 0) - (a.likes || 0);
        return new Date(b.created_at) - new Date(a.created_at);
      }),
    [comments, commentSort]
  );

  if (loading) {
    return (
      <>
        <Header />
        <main id="main" className="min-h-screen bg-paper">
          <LoadingLine>Setting the page…</LoadingLine>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main id="main" className="flex min-h-screen items-center justify-center bg-paper px-6 py-24">
          <EmptyNote
            mark="⁂"
            title="This piece is not here"
            action={
              <InkButton href="/posts" variant="outline">
                <ArrowLeft size={15} aria-hidden /> Back to the shelves
              </InkButton>
            }
          >
            It may have been unpublished by its author, or sent back to a mentor for another
            look.
          </EmptyNote>
        </main>
        <Footer />
      </>
    );
  }

  const meta = categoryMeta(post.category);
  const standfirst = post.excerpt?.trim() || openingLine(post.content || '', 240);

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
      toast.error('Sign in to leave a mark on this piece.');
    }
  };

  const handleBookmark = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      const result = await api.bookmarkPost(id);
      setBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? 'Saved to your shelf' : 'Removed from your shelf');
    } catch {
      setBookmarked(!nextBookmarked);
      toast.error('Sign in to save pieces to your shelf.');
    }
  };

  const handleReaction = async (emoji) => {
    try {
      const res = await api.reactPost(id, emoji);
      setSelectedReaction(res.userReaction);
      setReactionCounts(res.reactions || []);
      if (res.removed) toast.info('Reaction removed');
    } catch {
      toast.error('Sign in to react.');
    }
  };

  const handleFollow = async () => {
    if (!post.author) return;
    const nextFollowing = !following;
    setFollowing(nextFollowing);

    try {
      const result = await api.followUser(post.author.id);
      setFollowing(result.following);
      toast.success(
        result.following ? `Following ${post.author.name}` : `No longer following ${post.author.name}`
      );
    } catch {
      setFollowing(!nextFollowing);
      toast.error('Sign in to follow writers.');
    }
  };

  const handleAddComment = async (parentId = null) => {
    const textToSend = parentId ? replyText : newComment;
    if (!textToSend.trim()) return;

    setSubmittingComment(true);

    try {
      const data = await api.addComment(id, textToSend.trim(), parentId);
      if (!data.comment) throw new Error(data.error || 'Could not post that');

      setComments((prev) => [data.comment, ...prev]);
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewComment('');
      }
      setPost((prev) => ({ ...prev, comments: (prev.comments || 0) + 1 }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in to respond.');
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
      toast.error('Sign in to like a response.');
    }
  };

  const handleShare = () => {
    const text = `“${post.title}” — ASYV Writers`;
    if (navigator.share) {
      navigator.share({ title: 'ASYV Writers', text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cycleTextSize = () => {
    setTextSize((prev) => (prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'));
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* A hairline that fills as the reader descends */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent" aria-hidden="true">
        <div
          className="h-full bg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {!focusMode && <Header />}

      <main id="main" className="pb-32">
        <div
          className={cn(
            'mx-auto px-4 sm:px-6 lg:px-8',
            focusMode
              ? 'max-w-3xl'
              : 'grid max-w-[84rem] grid-cols-1 gap-10 xl:grid-cols-[14rem_minmax(0,42rem)_14rem] xl:justify-center'
          )}
        >
          {/* Margin reading line, built from the piece's own headings */}
          {!focusMode && (
            <aside className="hidden xl:block">
              <div className="sticky top-32 pt-16">
                <ReadingLine headings={headings} progress={scrollProgress} />
              </div>
            </aside>
          )}

          {/* The measure is held at every width, not only once the margins
              appear, so a line never runs past about 70 characters. */}
          <article
            className={cn('mx-auto w-full max-w-[42rem]', !focusMode && 'xl:col-start-2')}
          >
            {/* Only the author and mentors can reach a piece that is not live,
                so say plainly that this is a preview rather than the page
                everyone else sees. */}
            {post.status !== 'approved' && post.status !== 'published' && (
              <p className="mt-10 border-l-2 border-accent bg-card px-4 py-3 text-sm text-ink-soft">
                <span className="font-medium text-foreground">
                  {post.status === 'pending'
                    ? 'Waiting for a mentor to read it.'
                    : post.status === 'draft'
                    ? 'This is still a draft.'
                    : 'This piece was not approved.'}
                </span>{' '}
                You can see this page because it is yours or you review for ASYV. It is not public
                yet.
              </p>
            )}

            {/* ── Text first: the title block ─────────────────────────────── */}
            <header className="pt-12 sm:pt-16">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <GenreTag category={post.category} size="md" />
                <span aria-hidden className="h-px w-6 bg-rule-strong" />
                <Kicker as="p">{formatLongDate(post.created_at)}</Kicker>
              </div>

              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'mt-6 type-5 font-semibold leading-[1.05] tracking-[-0.02em] text-foreground',
                  meta.titleFont === 'sans' ? 'font-sans' : 'font-display'
                )}
              >
                {post.title}
              </motion.h1>

              {standfirst && (
                <p className="mt-6 font-reading type-2 italic leading-relaxed text-ink-soft">
                  {standfirst}
                </p>
              )}

              {/* Credits */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-rule py-4">
                {post.author && (
                  <AuthorHoverCard author={post.author}>
                    <div className="flex items-center gap-3">
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="block">
                        <Link
                          href={`/author/${post.author.id}`}
                          className="link-quiet block text-sm font-medium text-foreground"
                        >
                          {post.author.name}
                        </Link>
                        <span className="mt-0.5 block text-xs text-ink-faint">
                          {post.read_time} min read
                          {post.tags?.length ? ` · ${post.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}` : ''}
                        </span>
                      </span>
                    </div>
                  </AuthorHoverCard>
                )}

                <button
                  type="button"
                  onClick={handleFollow}
                  className={cn(
                    'inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors',
                    following
                      ? 'border-rule-strong text-ink-soft hover:text-foreground'
                      : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                  )}
                  aria-pressed={following}
                >
                  {following ? (
                    <>
                      <Check size={13} aria-hidden /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} aria-hidden /> Follow
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* The author's image, after the opening — the words lead */}
            {post.featured_image && (
              <figure className="group relative mt-10">
                <PostCover post={post} ratio="3 / 2" className="border border-rule" priority />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center border border-rule bg-card/90 text-ink-soft opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label="View the image full size"
                >
                  <Expand size={15} aria-hidden />
                </button>
                <figcaption className="mt-2.5 font-reading text-xs italic text-ink-faint">
                  Image chosen by {post.author?.name || 'the author'}.
                </figcaption>
              </figure>
            )}

            {/* ── The essay ───────────────────────────────────────────────── */}
            <div
              className="essay mt-12"
              data-size={textSize}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {/* ── Appreciation ────────────────────────────────────────────── */}
            <section
              aria-labelledby="appreciation"
              className="mt-16 border-t border-rule pt-8"
            >
              <h2 id="appreciation" className="label mb-5">
                If it moved you
              </h2>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleLike}
                  aria-pressed={liked}
                  className={cn(
                    'group inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-medium transition-colors',
                    liked
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-rule-strong text-ink-soft hover:border-accent hover:text-accent'
                  )}
                >
                  <Heart
                    size={16}
                    aria-hidden
                    className={cn('transition-transform duration-300 group-active:scale-75', liked && 'fill-current')}
                  />
                  <span className="tabular-nums">{post.likes ?? 0}</span>
                  <span className="sr-only">likes</span>
                </button>

                <button
                  type="button"
                  onClick={handleBookmark}
                  aria-pressed={bookmarked}
                  className={cn(
                    'inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-medium transition-colors',
                    bookmarked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-rule-strong text-ink-soft hover:border-primary hover:text-primary'
                  )}
                >
                  <Bookmark size={16} aria-hidden className={bookmarked ? 'fill-current' : ''} />
                  {bookmarked ? 'On your shelf' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 border border-rule-strong px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-foreground"
                >
                  {copied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
                  {copied ? 'Copied' : 'Share'}
                </button>

                <EmojiPickerPopover
                  side="top"
                  align="start"
                  onSelectEmoji={handleReaction}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 border border-rule-strong px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-foreground"
                    >
                      <Smile size={16} aria-hidden />
                      {selectedReaction ? `You reacted ${selectedReaction}` : 'React'}
                    </button>
                  }
                />
              </div>

              {reactionCounts.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {reactionCounts.map((rc) => (
                    <li key={rc.emoji}>
                      <button
                        type="button"
                        onClick={() => handleReaction(rc.emoji)}
                        aria-pressed={selectedReaction === rc.emoji}
                        className={cn(
                          'inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors',
                          selectedReaction === rc.emoji
                            ? 'border-primary text-primary'
                            : 'border-rule text-ink-soft hover:border-rule-strong'
                        )}
                      >
                        <span aria-hidden>{rc.emoji}</span>
                        <span className="tabular-nums font-medium">{rc.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Responses ───────────────────────────────────────────────── */}
            <section id="responses" className="mt-16">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
                <h2 className="font-display type-3 font-semibold text-foreground">
                  Responses{comments.length ? ` (${comments.length})` : ''}
                </h2>

                {comments.length > 1 && (
                  <div className="flex items-center gap-4 text-xs">
                    {[
                      { id: 'newest', label: 'Newest' },
                      { id: 'likes', label: 'Most liked' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setCommentSort(option.id)}
                        aria-pressed={commentSort === option.id}
                        className={cn(
                          'pb-0.5 font-medium transition-colors',
                          commentSort === option.id
                            ? 'border-b-2 border-accent text-foreground'
                            : 'text-ink-faint hover:text-ink-soft'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="border border-rule bg-card p-4">
                <label htmlFor="response" className="label mb-2 block">
                  Write to the author
                </label>
                <textarea
                  id="response"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What stayed with you?"
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none border border-rule bg-input px-3 py-2.5 font-reading text-base text-foreground focus:border-primary focus:outline-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <EmojiPickerPopover
                      side="top"
                      align="start"
                      onSelectEmoji={(emoji) => setNewComment((prev) => prev + emoji)}
                      trigger={
                        <button
                          type="button"
                          className="p-1.5 text-ink-faint transition-colors hover:text-foreground"
                          aria-label="Insert an emoji"
                        >
                          <Smile size={17} aria-hidden />
                        </button>
                      }
                    />
                    <span className="text-[0.6875rem] tabular-nums text-ink-faint">
                      {newComment.length}/1000
                    </span>
                  </div>

                  <InkButton
                    variant="solid"
                    size="sm"
                    onClick={() => handleAddComment(null)}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    <Send size={14} aria-hidden />
                    {submittingComment ? 'Sending…' : 'Send'}
                  </InkButton>
                </div>
              </div>

              {/* Thread */}
              {sortedComments.length === 0 ? (
                <p className="mt-8 border-t border-rule pt-8 text-center font-reading type-1 italic text-ink-faint">
                  No responses yet. Be the first to write to the author.
                </p>
              ) : (
                <ul className="mt-8 divide-y divide-rule border-t border-rule">
                  {sortedComments
                    .filter((c) => !c.parentId)
                    .map((comment) => {
                      const replies = sortedComments.filter((r) => r.parentId === comment.id);
                      const isAuthor = comment.user_id === post.author_id;

                      return (
                        <li key={comment.id} className="py-6">
                          <div className="flex gap-3.5">
                            {comment.avatar ? (
                              <img
                                src={comment.avatar}
                                alt=""
                                loading="lazy"
                                className="h-9 w-9 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-reading text-sm text-ink-soft"
                              >
                                {comment.author?.[0]?.toUpperCase() || '?'}
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                                <p className="text-sm font-medium text-foreground">{comment.author}</p>
                                {isAuthor && (
                                  <span className="label text-[0.5625rem] text-accent">The author</span>
                                )}
                                <time
                                  dateTime={new Date(comment.created_at).toISOString()}
                                  className="text-[0.6875rem] text-ink-faint"
                                >
                                  {new Date(comment.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </time>
                              </div>

                              <p className="mt-2 whitespace-pre-wrap font-reading text-base leading-relaxed text-foreground/90">
                                {comment.text}
                              </p>

                              <div className="mt-3 flex items-center gap-5">
                                <CreativeLikeAnimation
                                  isLiked={comment.likedByViewer}
                                  onToggle={() => handleLikeComment(comment.id)}
                                >
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1.5 text-xs font-medium transition-colors',
                                      comment.likedByViewer
                                        ? 'text-accent'
                                        : 'text-ink-faint hover:text-accent'
                                    )}
                                  >
                                    <Heart
                                      size={13}
                                      aria-hidden
                                      className={comment.likedByViewer ? 'fill-current' : ''}
                                    />
                                    <span className="tabular-nums">{comment.likes || 0}</span>
                                  </span>
                                </CreativeLikeAnimation>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyingToId(replyingToId === comment.id ? null : comment.id)
                                  }
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-primary"
                                >
                                  <CornerDownRight size={13} aria-hidden /> Reply
                                </button>
                              </div>

                              <AnimatePresence>
                                {replyingToId === comment.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 flex gap-2 border-l-2 border-rule pl-3">
                                      <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${comment.author}…`}
                                        aria-label={`Reply to ${comment.author}`}
                                        className="min-w-0 flex-1 border border-rule bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                                      />
                                      <InkButton
                                        variant="outline"
                                        size="sm"
                                        disabled={!replyText.trim() || submittingComment}
                                        onClick={() => handleAddComment(comment.id)}
                                      >
                                        Reply
                                      </InkButton>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {replies.length > 0 && (
                                <ul className="mt-5 space-y-4 border-l-2 border-rule pl-4">
                                  {replies.map((reply) => (
                                    <li key={reply.id}>
                                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                        <p className="text-[0.8125rem] font-medium text-foreground">
                                          {reply.author}
                                        </p>
                                        {reply.user_id === post.author_id && (
                                          <span className="label text-[0.5625rem] text-accent">
                                            The author
                                          </span>
                                        )}
                                        <time
                                          dateTime={new Date(reply.created_at).toISOString()}
                                          className="text-[0.625rem] text-ink-faint"
                                        >
                                          {new Date(reply.created_at).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                          })}
                                        </time>
                                      </div>
                                      <p className="mt-1 whitespace-pre-wrap font-reading text-[0.9375rem] leading-relaxed text-foreground/90">
                                        {reply.text}
                                      </p>
                                      <CreativeLikeAnimation
                                        isLiked={reply.likedByViewer}
                                        onToggle={() => handleLikeComment(reply.id)}
                                      >
                                        <span
                                          className={cn(
                                            'mt-1.5 inline-flex items-center gap-1 text-[0.6875rem] font-medium transition-colors',
                                            reply.likedByViewer
                                              ? 'text-accent'
                                              : 'text-ink-faint hover:text-accent'
                                          )}
                                        >
                                          <Heart
                                            size={12}
                                            aria-hidden
                                            className={reply.likedByViewer ? 'fill-current' : ''}
                                          />
                                          <span className="tabular-nums">{reply.likes || 0}</span>
                                        </span>
                                      </CreativeLikeAnimation>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>

            {/* ── Related reads: at the very end only ─────────────────────── */}
            {related.length > 0 && (
              <section className="mt-20">
                <SectionHead
                  kicker="Read next"
                  title={`More from ${meta.label}`}
                  level={2}
                />
                <ul className="divide-y divide-rule border-y border-rule">
                  {related.map((relatedPost) => (
                    <li key={relatedPost.id}>
                      <Link href={`/posts/${relatedPost.id}`} className="group block py-5">
                        <GenreTag category={relatedPost.category} withMark={false} />
                        <h3 className="mt-2 font-display type-2 font-semibold leading-snug text-foreground">
                          <span className="ink-underline">{relatedPost.title}</span>
                        </h3>
                        <p className="mt-2 font-reading text-[0.9375rem] leading-relaxed text-ink-soft line-clamp-2">
                          {relatedPost.excerpt?.trim() || openingLine(relatedPost.content || '')}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          {!focusMode && <div className="hidden xl:block" aria-hidden="true" />}
        </div>
      </main>

      {/* Reader controls — a quiet strip, not a floating pill */}
      <motion.div
        initial={reduce ? false : { y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-rule bg-card/95 backdrop-blur-[2px]"
      >
        <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleLike}
              aria-pressed={liked}
              aria-label={liked ? 'Remove your like' : 'Like this piece'}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm transition-colors',
                liked ? 'text-accent' : 'text-ink-soft hover:text-accent'
              )}
            >
              <Heart size={16} aria-hidden className={liked ? 'fill-current' : ''} />
              <span className="tabular-nums">{post.likes ?? 0}</span>
            </button>

            <a
              href="#responses"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:text-foreground"
            >
              <MessageCircle size={16} aria-hidden />
              <span className="tabular-nums">{comments.length}</span>
              <span className="sr-only">responses</span>
            </a>

            <button
              type="button"
              onClick={handleBookmark}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Remove from your shelf' : 'Save to your shelf'}
              className={cn(
                'p-2 transition-colors',
                bookmarked ? 'text-primary' : 'text-ink-soft hover:text-primary'
              )}
            >
              <Bookmark size={16} aria-hidden className={bookmarked ? 'fill-current' : ''} />
            </button>
          </div>

          <p className="hidden font-reading text-xs italic text-ink-faint sm:block">
            {Math.round(scrollProgress)}% read
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={cycleTextSize}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-foreground"
              aria-label={`Text size: ${textSize}. Press to change.`}
            >
              <Type size={15} aria-hidden />
              <span className="uppercase tracking-wider">{textSize === 'xlarge' ? 'XL' : textSize[0]}</span>
            </button>

            <button
              type="button"
              onClick={() => setFocusMode((f) => !f)}
              aria-pressed={focusMode}
              className={cn(
                'p-2 transition-colors',
                focusMode ? 'text-primary' : 'text-ink-soft hover:text-foreground'
              )}
              aria-label={focusMode ? 'Leave reading-only view' : 'Reading-only view'}
            >
              {focusMode ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Full-size image */}
      <AnimatePresence>
        {lightboxOpen && post.featured_image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Full-size image"
            className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-ink/95 p-4 sm:p-10"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
              className="absolute right-5 top-5 p-2.5 text-paper/80 transition-colors hover:text-paper"
            >
              <X size={22} aria-hidden />
            </button>
            <img
              src={post.featured_image}
              alt={post.title}
              className="max-h-[88vh] max-w-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!focusMode && <Footer />}
    </div>
  );
}
