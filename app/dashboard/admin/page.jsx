'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SuperuserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    api.getMe()
      .then((res) => {
        if (!res.user?.isSuperuser) {
          toast.error('Superuser access required');
          router.push('/dashboard');
          return;
        }
        setUser(res.user);
        loadPosts('pending');
      })
      .catch(() => router.push('/auth/login'));
  }, [router]);

  const loadPosts = (status) => {
    setLoading(true);
    fetch(`/api/admin/posts?status=${status}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPosts(data.posts || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load posts'))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    loadPosts(status);
  };

  const handleModerate = async (postId, status) => {
    setActioningId(postId);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success(
        status === 'approved' ? 'Post approved and published to Explore!' : 'Post rejected'
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Moderation failed');
    } finally {
      setActioningId(null);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Verifying superuser permissions...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                  <ShieldCheck size={14} /> Superuser Moderation Studio
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Post Review & Approval
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Review submitted essays, approve quality content for Explore, or reject inappropriate posts.
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl">
                {[
                  { id: 'pending', label: 'Pending Review' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleFilterChange(item.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      statusFilter === item.id
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-card border border-border p-6 rounded-2xl space-y-3 skeleton-shimmer">
                  <div className="h-4 bg-muted/60 rounded-md w-1/4" />
                  <div className="h-6 bg-muted/80 rounded-md w-3/4" />
                  <div className="h-4 bg-muted/50 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 px-6 bg-card border border-border rounded-2xl max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-secondary text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl">
                ✅
              </div>
              <h3 className="font-serif text-xl font-bold mb-1 text-foreground">
                No {statusFilter} posts
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {statusFilter === 'pending'
                  ? 'All submitted essays have been reviewed! Check back later for new submissions.'
                  : `There are currently no posts with status "${statusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {posts.map((post) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-primary/40 transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author?.avatar || '/placeholder-user.jpg'}
                          alt={post.author?.name || 'Author'}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10"
                        />
                        <div>
                          <p className="font-bold text-sm text-foreground">{post.author?.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={12} /> Submitted {new Date(post.created_at).toLocaleDateString()} • Category: <span className="font-semibold text-foreground">{post.category}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            post.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : post.status === 'approved' || post.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-2">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed bg-secondary/50 p-4 rounded-xl border border-border/60">
                        {post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 300)}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
                      <Link
                        href={`/posts/${post.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Eye size={14} /> Full Preview
                      </Link>

                      <div className="flex items-center gap-2">
                        {post.status !== 'rejected' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={actioningId === post.id}
                            onClick={() => handleModerate(post.id, 'rejected')}
                          >
                            <XCircle size={15} /> Reject Post
                          </Button>
                        )}
                        {post.status !== 'approved' && (
                          <Button
                            variant="green"
                            size="sm"
                            disabled={actioningId === post.id}
                            onClick={() => handleModerate(post.id, 'approved')}
                          >
                            <CheckCircle2 size={15} /> Approve & Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
