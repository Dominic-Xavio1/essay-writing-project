'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EssayCard } from '@/components/board/EssayCard';
import { MasonryBoard } from '@/components/board/MasonryBoard';
import {
  Edit2,
  Trash2,
  Eye,
  Grid,
  List,
  PenSquare,
  BookOpen,
  Sparkles,
  BarChart3,
  Bookmark,
  FileText,
  Clock,
  Plus,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('published');
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMe(), api.getMyPosts(), api.getMyBookmarks()])
      .then(([me, postsRes, bookmarksRes]) => {
        setUser(me.user);
        setUserPosts(postsRes.posts || []);
        setBookmarkedPosts(bookmarksRes.posts || []);
        if (me.user?.id) {
          const { wsClient } = require('@/lib/websocket');
          wsClient.connect(me.user.id);
        }
      })
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));

    let unsubscribeFeedback = () => {};
    let unsubscribeMod = () => {};
    try {
      const { wsClient } = require('@/lib/websocket');
      unsubscribeFeedback = wsClient.subscribe('SUPERUSER_FEEDBACK', (data) => {
        const isRevision = data.status === 'draft';
        const message = isRevision 
          ? `📝 Revision Required: "${data.postTitle}" - ${data.feedback}`
          : `💬 Feedback on "${data.postTitle}": ${data.feedback}`;
        
        toast.info(message, {
          duration: 10000,
          action: isRevision ? {
            label: 'Revise Now',
            onClick: () => router.push('/dashboard')
          } : undefined
        });
        
        // Refresh posts to show updated status
        api.getMyPosts().then((postsRes) => setUserPosts(postsRes.posts || []));
      });
      
      // Also listen for post moderation updates
      unsubscribeMod = wsClient.subscribe('POST_MODERATED', (data) => {
        api.getMyPosts().then((postsRes) => setUserPosts(postsRes.posts || []));
      });
    } catch (err) {}

    return () => {
      unsubscribeFeedback();
      unsubscribeMod();
    };
  }, [router]);

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this essay?')) return;
    try {
      await api.deletePost(postId);
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Essay deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleRemoveBookmark = async (postId) => {
    try {
      await api.bookmarkPost(postId);
      setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Removed from bookmarks');
    } catch {
      toast.error('Failed to remove bookmark');
    }
  };

  if (loading || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-canvas flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Loading your dashboard...</p>
        </main>
      </>
    );
  }

  const publishedPosts = userPosts.filter((p) => p.status === 'approved' || p.status === 'published');
  const pendingPosts = userPosts.filter((p) => p.status === 'pending');
  const draftPosts = userPosts.filter((p) => p.status === 'draft' && !p.feedback);
  // A mentor either sends a note back with feedback (status 'draft' + feedback)
  // or declines it outright ('rejected'). Both need to be visible to the author.
  const revisionPosts = userPosts.filter(
    (p) => (p.status === 'draft' && p.feedback) || p.status === 'rejected'
  );

  // Hearts per read and the most-loved board, both computed from real rows.
  const heartsPerRead =
    user.totalReads > 0 ? Math.min(100, Math.round((user.likes / user.totalReads) * 100)) : 0;

  const topBoard = (() => {
    const byBoard = new Map();
    publishedPosts.forEach((post) => {
      const entry = byBoard.get(post.category) || { category: post.category, likes: 0, count: 0 };
      entry.likes += post.likes || 0;
      entry.count += 1;
      byBoard.set(post.category, entry);
    });
    const ranked = [...byBoard.values()].sort((a, b) => b.likes - a.likes || b.count - a.count);
    return ranked[0] || null;
  })();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-canvas pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Dashboard Title & CTA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-border/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles size={13} /> My Board
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                My Writing Board
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Everything you have pinned, saved and drafted — all on one board.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user.isSuperuser && (
                <Button variant="outline" href="/dashboard/admin">
                  <ShieldCheck size={16} className="text-amber-500" /> Moderation Studio
                </Button>
              )}
              <Button variant="accent" href="/create">
                <PenSquare size={16} /> Write New Essay
              </Button>
            </div>
          </div>

          {/* Author Profile Banner */}
          <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-note)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-2xl" />
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <UserAvatar src={user.avatar} name={user.name} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {user.name}
                  </h2>
                  {user.isSuperuser ? (
                    <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <ShieldCheck size={13} /> Superuser Admin
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Author
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-2xl">
                  {user.bio || 'ASYV student writer. Add a bio so the village knows your story.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Total Essays</p>
                    <p className="font-display text-xl font-extrabold text-foreground">{user.posts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Total Claps</p>
                    <p className="font-display text-xl font-extrabold text-rose-500">
                      {user.likes?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Followers</p>
                    <p className="font-display text-xl font-extrabold text-foreground">{user.followers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Following</p>
                    <p className="font-display text-xl font-extrabold text-foreground">{user.following}</p>
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 border border-border bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-muted transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </section>

          {/* Every figure here is read from the database — no placeholder charts */}
          <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatNote
              tone="bg-note-mint"
              tilt="-rotate-1"
              label="Total reads"
              value={(user.totalReads || 0).toLocaleString()}
              hint="across your published notes"
            />
            <StatNote
              tone="bg-note-peach"
              tilt="rotate-1"
              label="Hearts received"
              value={(user.likes || 0).toLocaleString()}
              valueClass="text-rose-500"
              hint="from readers on the wall"
            />
            <StatNote
              tone="bg-note-butter"
              tilt="-rotate-[0.6deg]"
              label="Readers reach"
              value={`${user.retentionRate || 0}%`}
              percent={user.retentionRate || 0}
              hint={`average time on a note · ${user.formattedDuration}`}
            />
            <StatNote
              tone="bg-note-sky"
              tilt="rotate-[0.8deg]"
              label="On the wall"
              value={publishedPosts.length}
              hint={`${pendingPosts.length} waiting for a mentor`}
            />
          </section>

          {/* Animated Tabbed Content Navigation */}
          <section className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/85 p-2 shadow-sm backdrop-blur-md">
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'published', label: `Published (${publishedPosts.length})`, icon: FileText },
                { id: 'pending', label: `Pending Approval (${pendingPosts.length})`, icon: Clock },
                { id: 'revisions', label: `Revisions (${revisionPosts.length})`, icon: AlertCircle },
                { id: 'drafts', label: `Drafts (${draftPosts.length})`, icon: Edit2 },
                { id: 'bookmarked', label: 'Bookmarks', icon: Bookmark },
                { id: 'analytics', label: 'Analytics Insights', icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-colors whitespace-nowrap ${
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon size={16} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="dashboardTab"
                        className="absolute inset-0 rounded-xl bg-primary"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          </section>

          {/* Tab Content Panels */}
          <AnimatePresence mode="wait">
            {activeTab === 'published' && (
              <motion.div
                key="published"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {publishedPosts.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-card/80 border-2 border-dashed border-border rounded-[2rem] max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto mb-4 text-2xl">
                      ✍️
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      No published essays yet
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      The world is waiting for your story. Craft your first essay with our distraction-free editor.
                    </p>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-[var(--shadow-note)] hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
                    >
                      <Plus size={16} /> Write Your First Essay
                    </Link>
                  </div>
                ) : viewMode === 'grid' ? (
                  <MasonryBoard columns="sm:columns-2 lg:columns-3">
                    {publishedPosts.map((post) => (
                      <EssayCard
                        key={post.id}
                        post={{ ...post, author: { id: user.id, name: user.name, avatar: user.avatar } }}
                        actions={
                          <>
                            <Link href={`/posts/${post.id}`} title="View" className="rounded-full p-1.5 text-muted-foreground hover:bg-white/70 hover:text-primary transition-colors"><Eye size={15} /></Link>
                            <Link href={`/create?edit=${post.id}`} title="Edit" className="rounded-full p-1.5 text-muted-foreground hover:bg-white/70 hover:text-accent transition-colors"><Edit2 size={15} /></Link>
                            <button onClick={() => handleDelete(post.id)} title="Delete" className="rounded-full p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"><Trash2 size={15} /></button>
                          </>
                        }
                      />
                    ))}
                  </MasonryBoard>
                ) : (
                  <div className="space-y-3">
                    {publishedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between hover:border-primary/40 transition-all duration-300 shadow-[var(--shadow-note)] hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
                      >
                        <div className="flex-1 pr-4">
                          <h4 className="font-display font-bold text-base text-foreground mb-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/posts/${post.id}`}
                            className="p-2 bg-secondary hover:bg-muted rounded-xl text-foreground"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            href={`/create?edit=${post.id}`}
                            className="p-2 bg-secondary hover:bg-muted rounded-xl text-foreground"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 bg-secondary hover:bg-rose-500/10 rounded-xl text-rose-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {pendingPosts.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-card/80 border-2 border-dashed border-border rounded-[2rem] max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl">
                      ⏳
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">No pending essays</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      You don't have any essays currently awaiting superuser moderation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between hover:border-amber-400/40 transition-all duration-300 shadow-[var(--shadow-note)] hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                              Pending Review
                            </span>
                            <h4 className="font-display font-bold text-base text-foreground">
                              {post.title}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 bg-secondary hover:bg-rose-500/10 rounded-xl text-rose-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'revisions' && (
              <motion.div
                key="revisions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {revisionPosts.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-card/80 border-2 border-dashed border-border rounded-[2rem] max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 text-2xl">
                      ✅
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">No revisions needed</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      You don't have any essays that need revision at this time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revisionPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-card border border-rose-500/30 p-5 rounded-2xl flex items-center justify-between hover:border-rose-500/60 transition-all shadow-xs bg-rose-50/5"
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                              {post.status === 'rejected' ? 'Not approved' : 'Revision requested'}
                            </span>
                            <h4 className="font-display font-bold text-base text-foreground">
                              {post.title}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{post.excerpt}</p>
                          {post.feedback && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                              <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">Feedback:</p>
                              <p className="text-[11px] text-rose-600 dark:text-rose-300">{post.feedback}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="green" size="sm" href={`/create?edit=${post.id}`}>
                            <Edit2 size={14} /> Revise
                          </Button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 bg-secondary hover:bg-rose-500/10 rounded-xl text-rose-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'drafts' && (
              <motion.div
                key="drafts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {draftPosts.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-card/80 border-2 border-dashed border-border rounded-[2rem] max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-full bg-secondary text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl">
                      📝
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">No drafts saved</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      You don't have any unpublished drafts right now. Start writing a new essay whenever inspiration strikes.
                    </p>
                    <Button variant="accent" href="/create">
                      <PenSquare size={16} /> Create Draft
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draftPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between hover:border-amber-400/40 transition-all duration-300 shadow-[var(--shadow-note)] hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                            <h4 className="font-display font-bold text-base text-foreground">
                              {post.title || 'Untitled Draft'}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="green" size="sm" href={`/create?edit=${post.id}`}>
                            <Edit2 size={14} /> Resume Writing
                          </Button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 bg-secondary hover:bg-rose-500/10 rounded-xl text-rose-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'bookmarked' && (
              <motion.div
                key="bookmarked"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {bookmarkedPosts.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-card/80 border-2 border-dashed border-border rounded-[2rem] max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl">
                      🔖
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      Bookmarked Essays
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      Save interesting essays from the Explore feed to read later. Your bookmarked stories will appear here.
                    </p>
                    <Link
                      href="/posts"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-[var(--shadow-note)] hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
                    >
                      <BookOpen size={16} /> Explore Feed
                    </Link>
                  </div>
                ) : (
                  <MasonryBoard columns="sm:columns-2 lg:columns-3">
                    {bookmarkedPosts.map((post) => (
                      <EssayCard
                        key={post.id}
                        post={post}
                        actions={
                          <>
                            <Link href={`/posts/${post.id}`} title="View" className="rounded-full p-1.5 text-muted-foreground hover:bg-white/70 hover:text-primary transition-colors"><Eye size={15} /></Link>
                            <button onClick={() => handleRemoveBookmark(post.id)} title="Remove bookmark" className="rounded-full p-1.5 text-accent bg-accent/10 hover:bg-accent/20 transition-colors"><Bookmark size={15} className="fill-accent" /></button>
                          </>
                        }
                      />
                    ))}
                  </MasonryBoard>
                )}
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-card border border-border p-6 sm:p-8 rounded-[2rem] shadow-[var(--shadow-note)]"
              >
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  How people read your notes
                </h3>
                <p className="text-sm text-muted-foreground mb-7">
                  Measured from real reading sessions on your published notes.
                </p>

                {user.totalReads === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-8 text-center">
                    <p className="mb-1 text-sm font-bold text-foreground">No reading data yet</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Once friends start reading your published notes, you&apos;ll see how far they get
                      and how long they stay.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <InsightBar
                      label="How far readers get through a note"
                      value={`${user.retentionRate}%`}
                      percent={user.retentionRate}
                      tone="bg-primary"
                    />
                    <InsightBar
                      label="Hearts per read"
                      value={`${heartsPerRead}%`}
                      percent={heartsPerRead}
                      tone="bg-rose-500"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Average time on a note
                        </p>
                        <p className="mt-1 font-display text-2xl font-extrabold text-foreground">
                          {user.formattedDuration}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Most-loved board
                        </p>
                        <p className="mt-1 font-display text-2xl font-extrabold text-foreground">
                          {topBoard ? topBoard.category : '—'}
                        </p>
                        {topBoard && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {topBoard.likes} {topBoard.likes === 1 ? 'heart' : 'hearts'} across{' '}
                            {topBoard.count} {topBoard.count === 1 ? 'note' : 'notes'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatNote({ tone, tilt, label, value, valueClass = 'text-foreground', hint, percent }) {
  return (
    <div className={cn('relative rounded-3xl border border-black/5 p-5 lift', tone, tilt)}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-2 font-display text-3xl font-extrabold', valueClass)}>{value}</p>
      {typeof percent === 'number' && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      )}
      {hint && (
        <p className="mt-2 text-[11px] font-semibold leading-snug text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function InsightBar({ label, value, percent, tone }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-xs font-semibold">
        <span className="text-foreground">{label}</span>
        <span className="font-display text-sm font-extrabold text-foreground">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700', tone)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
