'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Kicker, GenreTag, EmptyNote, InkButton, LoadingLine } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { wsClient } from '@/lib/websocket';
import { formatLongDate } from '@/lib/board';
import { plainText } from '@/lib/essay';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'pending', label: 'Waiting' },
  { id: 'approved', label: 'Published' },
  { id: 'rejected', label: 'Not approved' },
];

export default function SuperuserDashboardPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [feedbackInput, setFeedbackInput] = useState({});
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);

  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        if (!res.user?.isSuperuser) {
          toast.error('That area is for ASYV mentors.');
          router.push('/dashboard');
          return;
        }
        setUser(res.user);
        loadPosts('pending');
        wsClient.connect(res.user.id);
      })
      .catch(() => router.push('/auth/login'));

    const unsubscribeNew = wsClient.subscribe('NEW_PENDING_POST', (data) => {
      toast.info(`New submission: “${data.postTitle}”`);
      if (data.post) {
        setPosts((prev) => [data.post, ...prev.filter((p) => p.id !== data.post.id)]);
      } else {
        loadPosts(statusFilter);
      }
    });

    const unsubscribeMod = wsClient.subscribe('POST_MODERATED', (data) => {
      if (data.postId) setPosts((prev) => prev.filter((p) => p.id !== data.postId));
    });

    return () => {
      unsubscribeNew();
      unsubscribeMod();
    };
  }, [router, statusFilter]);

  const loadPosts = (status) => {
    setLoading(true);
    fetch(`/api/admin/posts?status=${status}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPosts(data.posts || []);
      })
      .catch((err) => toast.error(err.message || 'Could not load the submissions'))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    loadPosts(status);
  };

  const handleModerate = async (postId, status) => {
    setActioningId(postId);
    const feedback = feedbackInput[postId] || '';
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'That did not go through');

      setPosts((prev) => prev.filter((p) => p.id !== postId));

      if (status === 'approved') {
        toast.success('Published. It is now on the public shelves.');
      } else if (status === 'rejected' && feedback) {
        toast.success('Sent back to the writer with your note.');
      } else {
        toast.success('Marked as not approved.');
      }

      setFeedbackInput((prev) => ({ ...prev, [postId]: '' }));
      setActiveFeedbackId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That did not go through');
    } finally {
      setActioningId(null);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <main id="main" className="min-h-screen bg-paper">
          <LoadingLine>Checking you are a mentor…</LoadingLine>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main" className="pb-24">
        <section className="border-b border-rule paper-grain">
          <div className="relative mx-auto max-w-[72rem] px-4 py-12 sm:px-6 lg:px-8">
            <Link
              href="/dashboard"
              className="link-quiet inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft"
            >
              <ArrowLeft size={13} aria-hidden /> My desk
            </Link>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Kicker className="mb-2 flex items-center gap-1.5 text-accent">
                  <ShieldCheck size={13} aria-hidden /> Mentor review
                </Kicker>
                <h1 className="font-display type-4 font-semibold leading-tight text-foreground">
                  Reading what students sent in
                </h1>
                <p className="mt-3 max-w-xl font-reading type-1 leading-relaxed text-ink-soft">
                  Nothing a student writes is public until you publish it here. You can also send a
                  piece back with a note, and it returns to their drafts to work on.
                </p>
              </div>

              <nav aria-label="Submission status" className="flex items-center gap-5">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleFilterChange(item.id)}
                    aria-pressed={statusFilter === item.id}
                    className={cn(
                      'whitespace-nowrap pb-1 text-[0.8125rem] font-medium uppercase tracking-[0.1em] transition-colors',
                      statusFilter === item.id
                        ? 'border-b-2 border-accent text-foreground'
                        : 'text-ink-faint hover:text-ink-soft'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[72rem] px-4 pt-10 sm:px-6 lg:px-8">
          {loading ? (
            <ul className="divide-y divide-rule border-y border-rule">
              {[1, 2, 3].map((n) => (
                <li key={n} className="py-8">
                  <div className="h-3 w-32 skeleton-shimmer" />
                  <div className="mt-3 h-6 w-2/3 skeleton-shimmer" />
                  <div className="mt-3 h-4 w-full skeleton-shimmer" />
                </li>
              ))}
            </ul>
          ) : posts.length === 0 ? (
            <EmptyNote
              mark="✓"
              title={
                statusFilter === 'pending'
                  ? 'Nothing is waiting'
                  : `No ${statusFilter === 'approved' ? 'published' : 'declined'} pieces`
              }
            >
              {statusFilter === 'pending'
                ? 'Every submission has been read. New ones appear here the moment a student sends them.'
                : 'Switch to another status to see other submissions.'}
            </EmptyNote>
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
              <AnimatePresence initial={false}>
                {posts.map((post) => {
                  const preview = post.excerpt?.trim() || plainText(post.content || '').slice(0, 320);
                  const busy = actioningId === post.id;

                  return (
                    <motion.li
                      key={post.id}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="py-8"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <GenreTag category={post.category} />
                        <span aria-hidden className="text-ink-faint">·</span>
                        <span className="text-xs text-ink-faint">
                          Sent {formatLongDate(post.created_at)}
                        </span>
                        <span
                          className={cn(
                            'label ml-auto text-[0.5625rem]',
                            post.status === 'pending' && 'text-accent',
                            (post.status === 'approved' || post.status === 'published') &&
                              'text-primary',
                            post.status === 'rejected' && 'text-destructive'
                          )}
                        >
                          {post.status === 'pending'
                            ? 'Waiting for you'
                            : post.status === 'rejected'
                            ? 'Not approved'
                            : 'Published'}
                        </span>
                      </div>

                      <h2 className="mt-3 font-display type-3 font-semibold leading-tight text-foreground">
                        {post.title}
                      </h2>

                      <div className="mt-2 flex items-center gap-2.5">
                        {post.author?.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt=""
                            loading="lazy"
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : null}
                        <Link
                          href={`/author/${post.author?.id}`}
                          className="link-quiet text-sm font-medium text-foreground"
                        >
                          {post.author?.name}
                        </Link>
                        <span className="text-xs text-ink-faint">· {post.read_time} min read</span>
                      </div>

                      <p className="mt-4 max-w-2xl font-reading text-base leading-relaxed text-ink-soft">
                        {preview}
                        {preview.length >= 320 && '…'}
                      </p>

                      <AnimatePresence initial={false}>
                        {activeFeedbackId === post.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-5 max-w-2xl border border-rule bg-card p-4">
                              <label
                                htmlFor={`feedback-${post.id}`}
                                className="label mb-1.5 block"
                              >
                                A note to {post.author?.name || 'the writer'}
                              </label>
                              <p className="mb-3 text-xs leading-relaxed text-ink-soft">
                                Sending a note returns the piece to their drafts so they can work on
                                it. They are notified straight away.
                              </p>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                  id={`feedback-${post.id}`}
                                  type="text"
                                  placeholder="What should they change, and why?"
                                  value={feedbackInput[post.id] || ''}
                                  onChange={(e) =>
                                    setFeedbackInput({ ...feedbackInput, [post.id]: e.target.value })
                                  }
                                  className="min-w-0 flex-1 border border-rule bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                                />
                                <InkButton
                                  variant="outline"
                                  size="sm"
                                  disabled={busy || !(feedbackInput[post.id] || '').trim()}
                                  onClick={() => handleModerate(post.id, 'rejected')}
                                >
                                  <Send size={13} aria-hidden /> Send it back
                                </InkButton>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                          <Link
                            href={`/posts/${post.id}`}
                            target="_blank"
                            className="link-quiet inline-flex items-center gap-1.5 text-xs font-medium text-foreground"
                          >
                            <Eye size={14} aria-hidden /> Read the whole piece
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveFeedbackId(activeFeedbackId === post.id ? null : post.id)
                            }
                            aria-expanded={activeFeedbackId === post.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-foreground"
                          >
                            <MessageSquare size={13} aria-hidden /> Write a note
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {post.status !== 'rejected' && (
                            <InkButton
                              variant="danger"
                              size="sm"
                              disabled={busy}
                              onClick={() => handleModerate(post.id, 'rejected')}
                            >
                              <XCircle size={14} aria-hidden /> Decline
                            </InkButton>
                          )}
                          {post.status !== 'approved' && (
                            <InkButton
                              variant="solid"
                              size="sm"
                              disabled={busy}
                              onClick={() => handleModerate(post.id, 'approved')}
                            >
                              <CheckCircle2 size={14} aria-hidden /> Publish
                            </InkButton>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
