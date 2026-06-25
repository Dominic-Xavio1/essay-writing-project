'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import { Heart, MessageCircle, Share2, Bookmark, ThumbsUp } from 'lucide-react';
import type { Post } from '@/lib/posts';

const REACTIONS = ['👍', '❤️', '😂', '😢', '🔥', '💯'];

type Comment = { id: string; author: string; avatar: string; text: string; likes: number };

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getPost(id)
      .then((data: { post: Post & { liked?: boolean; bookmarked?: boolean }; related: Post[] }) => {
        setPost(data.post);
        setRelated(data.related || []);
        setLiked(data.post.liked ?? false);
        setBookmarked(data.post.bookmarked ?? false);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));

    api.getComments(id).then((data: { comments: Comment[] }) => setComments(data.comments)).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Essay not found</h1>
            <Link href="/posts" className="text-primary hover:underline">Back to essays</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleLike = async () => {
    try {
      const result = await api.likePost(id) as { liked: boolean };
      setLiked(result.liked);
      setPost({ ...post, likes: post.likes + (result.liked ? 1 : -1) });
    } catch {
      alert('Sign in to like this essay');
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await api.bookmarkPost(id) as { bookmarked: boolean };
      setBookmarked(result.bookmarked);
    } catch {
      alert('Sign in to bookmark this essay');
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      await api.reactPost(id, emoji);
      setSelectedReaction(emoji);
      setShowReactions(false);
    } catch {
      alert('Sign in to react');
    }
  };

  const handleFollow = async () => {
    if (!post.author) return;
    try {
      const result = await api.followUser(post.author.id) as { following: boolean };
      setFollowing(result.following);
    } catch {
      alert('Sign in to follow authors');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const data = await api.addComment(id, newComment) as { comment: Comment };
      setComments([data.comment, ...comments]);
      setNewComment('');
      setPost({ ...post, comments: post.comments + 1 });
    } catch {
      alert('Sign in to comment');
    }
  };

  const handleShare = () => {
    const text = `Check out: "${post.title}" on EssayHub`;
    if (navigator.share) navigator.share({ title: 'EssayHub', text });
    else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {post.featured_image && (
          <div className="w-full h-96 overflow-hidden">
            <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm bg-secondary px-3 py-1 rounded-full font-medium">{post.category}</span>
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground px-2 py-1">#{tag}</span>
            ))}
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight">{post.title}</h1>

          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            {post.author && (
              <>
                <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <Link href={`/author/${post.author.id}`} className="font-semibold hover:text-primary">{post.author.name}</Link>
                  <p className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()} • {post.read_time} min read
                  </p>
                </div>
                <button onClick={handleFollow} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary font-semibold">
                  {following ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>

          <div className="prose prose-invert max-w-none mb-12 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />

          <div className="bg-secondary border border-border rounded-lg p-6 mb-12">
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${liked ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-border'}`}>
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                <span className="font-semibold">{post.likes}</span>
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border">
                <MessageCircle size={20} />
                <span className="font-semibold">{comments.length}</span>
              </div>
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-border">
                <Share2 size={20} />
                <span className="font-semibold">Share</span>
              </button>
              <button onClick={handleBookmark} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${bookmarked ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-border'}`}>
                <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
                <span className="font-semibold">Save</span>
              </button>
              <div className="relative">
                <button onClick={() => setShowReactions(!showReactions)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${selectedReaction ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-border'}`}>
                  <span>{selectedReaction || '👋'}</span>
                </button>
                {showReactions && (
                  <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-lg shadow-lg p-3 flex gap-2 z-10">
                    {REACTIONS.map((reaction) => (
                      <button key={reaction} onClick={() => handleReaction(reaction)} className="text-2xl hover:scale-125 transition-transform">{reaction}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
            <div className="mb-8 bg-secondary border border-border rounded-lg p-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
              />
              <button onClick={handleAddComment} disabled={!newComment.trim()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
                Post Comment
              </button>
            </div>
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <img src={comment.avatar || '/placeholder-user.jpg'} alt={comment.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <div className="bg-secondary border border-border rounded-lg p-4 mb-2">
                      <p className="font-semibold mb-2">{comment.author}</p>
                      <p>{comment.text}</p>
                    </div>
                    <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                      <ThumbsUp size={16} /><span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {related.length > 0 && (
            <section className="border-t border-border pt-12">
              <h2 className="text-2xl font-bold mb-6">More Essays</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/posts/${relatedPost.id}`} className="group bg-card border border-border rounded-lg p-6 hover:border-primary">
                    {relatedPost.featured_image && (
                      <img src={relatedPost.featured_image} alt={relatedPost.title} className="w-full h-32 object-cover rounded-lg mb-4" />
                    )}
                    <h3 className="font-bold mb-2 group-hover:text-primary">{relatedPost.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{relatedPost.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
