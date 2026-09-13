'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';
import { UserPlus, Check, Sparkles, Clock, BookOpen, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AuthorPage() {
  const params = useParams();
  const id = params.id;

  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getUser(id)
      .then((data) => {
        setAuthor(data.user);
        setPosts(data.posts || []);
      })
      .catch(() => setAuthor(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!author) return;
    const nextFollowing = !author.isFollowing;
    setAuthor({
      ...author,
      isFollowing: nextFollowing,
      followers: Math.max(0, author.followers + (nextFollowing ? 1 : -1)),
    });

    try {
      const result = await api.followUser(id);
      setAuthor((prev) => ({
        ...prev,
        isFollowing: result.following,
      }));
      toast.success(result.following ? `Following ${author.name}` : `Unfollowed ${author.name}`);
    } catch {
      setAuthor((prev) => ({
        ...prev,
        isFollowing: !nextFollowing,
        followers: Math.max(0, prev.followers + (nextFollowing ? -1 : 1)),
      }));
      toast.error('Sign in to follow authors');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Loading author profile...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!author) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="font-serif text-3xl font-bold mb-3 text-foreground">Author not found</h1>
            <p className="text-muted-foreground text-sm mb-6">
              The author profile you are looking for does not exist or may have been removed.
            </p>
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-xs"
            >
              Back to Discover Feed
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Author Profile Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-10 shadow-xs flex flex-col md:flex-row gap-6 items-start"
          >
            <img
              src={author.avatar || '/placeholder-user.jpg'}
              alt={author.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-primary/10 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-serif text-3xl font-bold text-foreground">{author.name}</h1>
                <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full border border-primary/20">
                  Author
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-xl">
                {author.bio || 'Sharing thoughtful stories and insights.'}
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground mb-5 pt-3 border-t border-border/60">
                <span>
                  <strong className="text-foreground text-sm font-extrabold">{author.posts}</strong> essays
                </span>
                <span>
                  <strong className="text-foreground text-sm font-extrabold">{author.followers}</strong> followers
                </span>
                <span>
                  <strong className="text-foreground text-sm font-extrabold">{author.following}</strong> following
                </span>
              </div>
              <Button
                variant={author.isFollowing ? 'outline' : 'accent'}
                onClick={handleFollow}
                size="sm"
              >
                {author.isFollowing ? (
                  <>
                    <Check size={14} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Follow Author
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">
            Essays by {author.name} ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-16 px-6 bg-card border border-border rounded-2xl">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No published essays yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <motion.article
                  key={post.id}
                  whileHover={{ y: -2 }}
                  className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all"
                >
                  <Link href={`/posts/${post.id}`} className="block group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold bg-secondary text-foreground px-2.5 py-0.5 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock size={11} /> {post.read_time} min read
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

