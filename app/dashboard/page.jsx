'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Edit2,
  Trash2,
  Eye,
  PenLine,
  Bookmark,
  FileText,
  Clock,
  AlertCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { EssayCard } from '@/components/board/EssayCard';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Kicker, GenreTag, EmptyNote, InkButton, LoadingLine } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { categoryMeta, formatShortDate } from '@/lib/board';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
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
        toast.info(
          isRevision
            ? `A mentor asked for a revision of “${data.postTitle}”`
            : `Feedback on “${data.postTitle}”`,
          {
            description: data.feedback,
            duration: 10000,
            action: isRevision
              ? { label: 'Open', onClick: () => router.push('/dashboard') }
              : undefined,
          }
        );
        api.getMyPosts().then((postsRes) => setUserPosts(postsRes.posts || []));
      });

      unsubscribeMod = wsClient.subscribe('POST_MODERATED', () => {
        api.getMyPosts().then((postsRes) => setUserPosts(postsRes.posts || []));
      });
    } catch (err) {}

    return () => {
      unsubscribeFeedback();
      unsubscribeMod();
    };
  }, [router]);

  const handleDelete = async (postId, title) => {
    if (!confirm(`Delete “${title || 'this piece'}” for good? This cannot be undone.`)) return;
    try {
      await api.deletePost(postId);
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete that');
    }
  };

  const handleRemoveBookmark = async (postId) => {
    try {
      await api.bookmarkPost(postId);
      setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Removed from your shelf.');
    } catch {
      toast.error('Could not remove that');
    }
  };

  const published = useMemo(
    () => userPosts.filter((p) => p.status === 'approved' || p.status === 'published'),
    [userPosts]
  );
  const pending = useMemo(() => userPosts.filter((p) => p.status === 'pending'), [userPosts]);
  const drafts = useMemo(
    () => userPosts.filter((p) => p.status === 'draft' && !p.feedback),
    [userPosts]
  );
  const revisions = useMemo(
    () => userPosts.filter((p) => p.status === 'draft' && p.feedback),
    [userPosts]
  );

  /* Every figure below is counted from this writer's own published pieces or
     from the read records the site actually stored. Nothing is estimated. */
  const readerFacts = useMemo(() => {
    const likesByPiece = published
      .map((p) => ({ id: p.id, title: p.title, likes: p.likes || 0 }))
      .sort((a, b) => b.likes - a.likes);
    const maxLikes = likesByPiece[0]?.likes || 0;

    const byGenre = {};
    published.forEach((p) => {
      byGenre[p.category] = (byGenre[p.category] || 0) + 1;
    });

    const totalResponses = published.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalSaves = published.reduce((sum, p) => sum + (p.bookmarks || 0), 0);

    return { likesByPiece, maxLikes, byGenre, totalResponses, totalSaves };
  }, [published]);

  if (loading || !user) {
    return (
      <>
        <Header />
        <main id="main" className="min-h-screen bg-paper">
          <LoadingLine>Opening your desk…</LoadingLine>
        </main>
      </>
    );
  }

  const tabs = [
    { id: 'published', label: 'Published', count: published.length, icon: FileText },
    { id: 'pending', label: 'With a mentor', count: pending.length, icon: Clock },
    { id: 'revisions', label: 'Needs a revision', count: revisions.length, icon: AlertCircle },
    { id: 'drafts', label: 'Drafts', count: drafts.length, icon: Edit2 },
    { id: 'bookmarked', label: 'My shelf', count: bookmarkedPosts.length, icon: Bookmark },
    { id: 'readers', label: 'Readers', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main" className="pb-24">
        {/* ── Who you are ────────────────────────────────────────────────── */}
        <section className="border-b border-rule paper-grain">
          <div className="relative mx-auto max-w-[84rem] px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <UserAvatar src={user.avatar} name={user.name} size="xl" />
                <div className="min-w-0">
                  <Kicker className="mb-2">My desk</Kicker>
                  <h1 className="font-display type-4 font-semibold leading-tight text-foreground">
                    {user.name}
                  </h1>
                  {user.isSuperuser && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                      <ShieldCheck size={13} aria-hidden /> Mentor · can review submissions
                    </p>
                  )}
                  <p className="mt-3 max-w-xl font-reading type-1 leading-relaxed text-ink-soft">
                    {user.bio || 'No note about yourself yet. Readers see this under your name.'}
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="link-quiet mt-3 inline-block text-[0.8125rem] font-medium text-foreground"
                  >
                    Edit your profile
                  </Link>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                {user.isSuperuser && (
                  <InkButton href="/dashboard/admin" variant="outline">
                    <ShieldCheck size={15} aria-hidden /> Review submissions
                  </InkButton>
                )}
                <InkButton href="/create" variant="solid">
                  <PenLine size={15} aria-hidden /> Start writing
                </InkButton>
              </div>
            </div>

            {/* Real counts only */}
            <dl className="mt-10 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
              {[
                { term: 'Published', value: published.length },
                { term: 'Times opened', value: (user.totalReads || 0).toLocaleString() },
                { term: 'Likes received', value: (user.likes || 0).toLocaleString() },
                { term: 'Followers', value: (user.followers || 0).toLocaleString() },
              ].map((stat) => (
                <div key={stat.term} className="bg-card px-4 py-5">
                  <dd className="font-display type-3 font-semibold leading-none text-foreground tabular-nums">
                    {stat.value}
                  </dd>
                  <dt className="label mt-2">{stat.term}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <section className="sticky top-[4.5rem] z-30 border-b border-rule bg-paper/95 backdrop-blur-[2px]">
          <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
            <div
              role="tablist"
              aria-label="Your writing"
              className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2.5"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative whitespace-nowrap py-1.5 text-[0.8125rem] font-medium uppercase tracking-[0.08em] transition-colors',
                      isActive ? 'text-foreground' : 'text-ink-faint hover:text-ink-soft'
                    )}
                  >
                    {tab.label}
                    {typeof tab.count === 'number' && (
                      <span className="ml-1.5 tabular-nums text-ink-faint">{tab.count}</span>
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="desk-rule"
                        className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-accent"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[84rem] px-4 pt-10 sm:px-6 lg:px-8">
          {/* A keyed panel, deliberately without AnimatePresence: the cards
              inside carry their own variants, and waiting for them to finish
              exiting left the old panel on screen. The new panel simply fades
              up in its place. */}
          <motion.div
            key={activeTab}
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
              {activeTab === 'published' &&
                (published.length === 0 ? (
                  <EmptyNote
                    title="Nothing published yet"
                    action={
                      <InkButton href="/create" variant="solid">
                        <PenLine size={15} aria-hidden /> Write your first piece
                      </InkButton>
                    }
                  >
                    Once a mentor approves a piece, it appears here and on the public shelves.
                  </EmptyNote>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {published.map((post) => (
                      <EssayCard
                        key={post.id}
                        post={{
                          ...post,
                          author: { id: user.id, name: user.name, avatar: user.avatar },
                        }}
                        actions={
                          <>
                            <Link
                              href={`/posts/${post.id}`}
                              title="Read it as a reader sees it"
                              aria-label="Read this piece"
                              className="p-1.5 text-ink-faint transition-colors hover:text-primary"
                            >
                              <Eye size={15} aria-hidden />
                            </Link>
                            <Link
                              href={`/create?edit=${post.id}`}
                              title="Edit"
                              aria-label="Edit this piece"
                              className="p-1.5 text-ink-faint transition-colors hover:text-accent"
                            >
                              <Edit2 size={15} aria-hidden />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(post.id, post.title)}
                              title="Delete"
                              aria-label="Delete this piece"
                              className="p-1.5 text-ink-faint transition-colors hover:text-destructive"
                            >
                              <Trash2 size={15} aria-hidden />
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                ))}

              {activeTab === 'pending' &&
                (pending.length === 0 ? (
                  <EmptyNote mark="⁂" title="Nothing waiting">
                    When you send a piece, it sits here while a mentor reads it.
                  </EmptyNote>
                ) : (
                  <PieceList
                    posts={pending}
                    note="A mentor has this. You will get a notice when they answer."
                    tone="accent"
                    onDelete={handleDelete}
                  />
                ))}

              {activeTab === 'revisions' &&
                (revisions.length === 0 ? (
                  <EmptyNote mark="✓" title="No revisions asked for">
                    If a mentor wants changes, their note will appear here with the piece.
                  </EmptyNote>
                ) : (
                  <PieceList
                    posts={revisions}
                    tone="destructive"
                    showFeedback
                    primaryAction={(post) => (
                      <InkButton href={`/create?edit=${post.id}`} variant="solid" size="sm">
                        <Edit2 size={14} aria-hidden /> Revise
                      </InkButton>
                    )}
                    onDelete={handleDelete}
                  />
                ))}

              {activeTab === 'drafts' &&
                (drafts.length === 0 ? (
                  <EmptyNote
                    title="No drafts"
                    action={
                      <InkButton href="/create" variant="outline">
                        <PenLine size={15} aria-hidden /> Open a blank page
                      </InkButton>
                    }
                  >
                    Drafts are private. Only you can read them, for as long as you like.
                  </EmptyNote>
                ) : (
                  <PieceList
                    posts={drafts}
                    note="Private to you."
                    primaryAction={(post) => (
                      <InkButton href={`/create?edit=${post.id}`} variant="outline" size="sm">
                        <Edit2 size={14} aria-hidden /> Keep writing
                      </InkButton>
                    )}
                    onDelete={handleDelete}
                  />
                ))}

              {activeTab === 'bookmarked' &&
                (bookmarkedPosts.length === 0 ? (
                  <EmptyNote
                    mark="❧"
                    title="Your shelf is empty"
                    action={
                      <InkButton href="/posts" variant="outline">
                        Browse the collection
                      </InkButton>
                    }
                  >
                    Save pieces while you read and they will wait for you here.
                  </EmptyNote>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {bookmarkedPosts.map((post) => (
                      <EssayCard
                        key={post.id}
                        post={post}
                        actions={
                          <>
                            <Link
                              href={`/posts/${post.id}`}
                              aria-label="Read this piece"
                              className="p-1.5 text-ink-faint transition-colors hover:text-primary"
                            >
                              <Eye size={15} aria-hidden />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRemoveBookmark(post.id)}
                              aria-label="Take off your shelf"
                              className="p-1.5 text-primary transition-colors hover:text-destructive"
                            >
                              <Bookmark size={15} className="fill-current" aria-hidden />
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                ))}

              {activeTab === 'readers' && (
                <ReadersPanel user={user} published={published} facts={readerFacts} />
              )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/** A plain list of pieces that are not public yet. */
function PieceList({ posts, note, tone = 'ink', showFeedback = false, primaryAction, onDelete }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {posts.map((post) => (
        <li key={post.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <GenreTag category={post.category} />
              <span aria-hidden className="text-ink-faint">·</span>
              <span className="text-[0.6875rem] text-ink-faint">
                {formatShortDate(post.updated_at || post.created_at)}
              </span>
            </div>

            <h3 className="mt-2 font-display type-2 font-semibold leading-snug text-foreground">
              {post.title || 'Untitled'}
            </h3>

            {post.excerpt && (
              <p className="mt-1.5 max-w-2xl font-reading text-[0.9375rem] leading-relaxed text-ink-soft line-clamp-2">
                {post.excerpt}
              </p>
            )}

            {note && (
              <p
                className={cn(
                  'mt-2.5 text-xs',
                  tone === 'accent' ? 'text-accent' : 'text-ink-faint'
                )}
              >
                {note}
              </p>
            )}

            {showFeedback && post.feedback && (
              <div className="mt-3 max-w-2xl border-l-2 border-destructive/60 bg-card px-3.5 py-3">
                <p className="label mb-1.5 text-destructive">What your mentor wrote</p>
                <p className="font-reading text-[0.9375rem] leading-relaxed text-foreground">
                  {post.feedback}
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {primaryAction?.(post)}
            <button
              type="button"
              onClick={() => onDelete(post.id, post.title)}
              aria-label="Delete this piece"
              className="p-2 text-ink-faint transition-colors hover:text-destructive"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * What readers actually did. Each figure names its own source so nobody has
 * to guess what it means, and nothing is shown if there is no data for it.
 */
function ReadersPanel({ user, published, facts }) {
  const hasReads = (user.totalReads || 0) > 0;

  if (published.length === 0) {
    return (
      <EmptyNote mark="◎" title="No readers yet">
        Once a piece of yours is published, what readers do with it appears here.
      </EmptyNote>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h2 className="label mb-5">Likes, piece by piece</h2>
        <ul className="space-y-4">
          {facts.likesByPiece.map((piece) => (
            <li key={piece.id}>
              <div className="flex items-baseline justify-between gap-4">
                <Link
                  href={`/posts/${piece.id}`}
                  className="link-quiet min-w-0 truncate text-sm font-medium text-foreground"
                >
                  {piece.title || 'Untitled'}
                </Link>
                <span className="shrink-0 text-xs tabular-nums text-ink-soft">
                  {piece.likes} {piece.likes === 1 ? 'like' : 'likes'}
                </span>
              </div>
              <div className="mt-1.5 h-[3px] w-full bg-secondary">
                <div
                  className="h-full bg-accent transition-[width] duration-700 ease-out"
                  style={{
                    width: facts.maxLikes > 0 ? `${(piece.likes / facts.maxLikes) * 100}%` : '0%',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-ink-faint">
          Counted from the likes stored against each of your published pieces. The bar is relative
          to your most-liked piece.
        </p>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="label mb-4">Reading records</h2>
          <dl className="divide-y divide-rule border-y border-rule">
            {[
              {
                term: 'Times a piece was opened',
                value: (user.totalReads || 0).toLocaleString(),
                note: 'Every reading session the site recorded.',
              },
              {
                term: 'Average time in a piece',
                value: user.formattedDuration || '0m 0s',
                note: 'Averaged over those sessions.',
              },
              {
                term: 'Average scroll depth',
                value: `${user.retentionRate || 0}%`,
                note: 'How far down the page readers got, on average.',
              },
              {
                term: 'Responses written to you',
                value: facts.totalResponses.toLocaleString(),
                note: 'Comments and replies on your published pieces.',
              },
              {
                term: 'Times saved to a shelf',
                value: facts.totalSaves.toLocaleString(),
                note: 'Readers who bookmarked a piece to come back to it.',
              },
            ].map((row) => (
              <div key={row.term} className="py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-ink-soft">{row.term}</dt>
                  <dd className="font-display type-2 font-semibold tabular-nums text-foreground">
                    {row.value}
                  </dd>
                </div>
                <p className="mt-1 text-xs text-ink-faint">{row.note}</p>
              </div>
            ))}
          </dl>
          {!hasReads && (
            <p className="mt-4 text-xs leading-relaxed text-ink-faint">
              No reading sessions have been recorded yet, so the timing figures above are still
              zero.
            </p>
          )}
        </div>

        <div>
          <h2 className="label mb-4">What you write most</h2>
          <ul className="space-y-2.5">
            {Object.entries(facts.byGenre)
              .sort((a, b) => b[1] - a[1])
              .map(([genre, count]) => (
                <li key={genre} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span aria-hidden style={{ color: categoryMeta(genre).accent }}>
                      {categoryMeta(genre).mark}
                    </span>
                    <span className="text-ink-soft">{categoryMeta(genre).label}</span>
                  </span>
                  <span className="tabular-nums text-foreground">
                    {count} {count === 1 ? 'piece' : 'pieces'}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
