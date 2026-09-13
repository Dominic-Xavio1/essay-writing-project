'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';
import { ClapButton } from '@/components/ui/clap-button';
import { AuthorHoverCard } from '@/components/ui/author-hover-card';
import {
  MessageCircle,
  Share2,
  Bookmark,
  ThumbsUp,
  Clock,
  Sparkles,
  UserPlus,
  Check,
  Maximize2,
  Minimize2,
  Type,
  ArrowLeft,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const REACTIONS = ['👍', '❤️', '😂', '😢', '🔥', '💯'];

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id;

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  const [reactionCounts, setReactionCounts] = useState([]);

  // Readers state controls
  const [scrollProgress, setScrollProgress] = useState(0);
  const [textSize, setTextSize] = useState('large');
  const [focusMode, setFocusMode] = useState(false);

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
      setShowReactions(false);
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const data = await api.addComment(id, newComment);
      setComments([data.comment, ...comments]);
      setNewComment('');
      setPost({ ...post, comments: post.comments + 1 });
      toast.success('Comment posted successfully');
    } catch {
      toast.error('Sign in to post comments');
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
    const text = `Check out: "${post.title}" on ASYV Writing`;
    if (navigator.share) {
      navigator.share({ title: 'ASYV Writing', text, url: window.location.href });
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

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-secondary z-50">
        <div
          className="h-full bg-emerald-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {!focusMode && <Header />}

      <main className="min-h-screen bg-background pb-32">
        {post.featured_image && (
          <div className="w-full h-80 sm:h-96 md:h-[450px] relative overflow-hidden bg-secondary">
            <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
          </div>
        )}

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          {/* Category & Tags */}
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase tracking-wider bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
              {post.category}
            </span>
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
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
                <div className="flex items-center gap-3.5 group">
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
          </div>

          {/* Article Body Content */}
          <div
            className={`prose prose-zinc dark:prose-invert max-w-none mb-16 text-foreground font-sans ${textSizeClasses[textSize]}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Reactions bar */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-16 shadow-xs">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> Reader Reactions
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <ClapButton initialCount={post.likes} onClap={handleLike} size="lg" />

              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                  bookmarked
                    ? 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-900'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bookmark size={16} className={bookmarked ? 'fill-amber-500 text-amber-500' : ''} />
                <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                <Share2 size={16} /> Share
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
                >
                  <span>{selectedReaction ? `Reacted ${selectedReaction}` : '✨ Add Reaction'}</span>
                </button>
                {showReactions && (
                  <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-xl shadow-xl p-3 flex gap-2 z-20">
                    {REACTIONS.map((reaction) => (
                      <button
                        key={reaction}
                        onClick={() => handleReaction(reaction)}
                        className={`text-2xl hover:scale-130 transition-transform p-1 rounded-lg ${
                          selectedReaction === reaction ? 'bg-secondary ring-2 ring-primary' : ''
                        }`}
                      >
                        {reaction}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {reactionCounts.map((rc) => (
                <button
                  key={rc.emoji}
                  onClick={() => handleReaction(rc.emoji)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedReaction === rc.emoji
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-secondary border-border text-muted-foreground'
                  }`}
                >
                  <span>{rc.emoji}</span>
                  <span className="font-bold">{rc.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <section id="comments" className="mb-16">
            <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">
              Comments ({comments.length})
            </h2>

            <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-xs">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts on this essay?"
                rows={3}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
              />
              <div className="flex items-center justify-between">
                {newComment.trim().length > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Writing comment...</span>
                  </div>
                ) : (
                  <div />
                )}
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Post Comment
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 bg-card border border-border p-5 rounded-xl">
                  <img
                    src={comment.avatar || '/placeholder-user.jpg'}
                    alt={comment.author}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-foreground">{comment.author}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{comment.text}</p>
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`text-xs flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full transition-colors ${
                        comment.likedByViewer
                          ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <ThumbsUp size={14} className={comment.likedByViewer ? 'fill-rose-500' : ''} />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* More Essays */}
          {related.length > 0 && (
            <section className="border-t border-border/80 pt-12">
              <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">Recommended Essays</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/posts/${relatedPost.id}`}
                    className="group bg-card border border-border rounded-xl p-5 hover:border-primary transition-all shadow-xs"
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
      </main>

      {/* Floating Sticky Reader Action Bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border border-border/90 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 sm:gap-4"
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

        {/* Text Size Adjuster Toggle */}
        <button
          onClick={cycleTextSize}
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"
          title={`Text Size: ${textSize}`}
        >
          <Type size={14} />
          <span className="text-[10px] uppercase font-bold">{textSize[0]}</span>
        </button>

        {/* Focus Mode Trigger */}
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

      {!focusMode && <Footer />}
    </>
  );
}
