'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { UserPlus, Check } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  Kicker,
  GenreTag,
  EmptyNote,
  InkButton,
  LoadingLine,
} from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { formatShortDate } from '@/lib/board';
import { openingLine } from '@/lib/essay';
import { cn } from '@/lib/utils';

export default function AuthorPage() {
  const params = useParams();
  const id = params.id;
  const reduce = useReducedMotion();

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
      setAuthor((prev) => ({ ...prev, isFollowing: result.following }));
      toast.success(
        result.following ? `Following ${author.name}` : `No longer following ${author.name}`
      );
    } catch {
      setAuthor((prev) => ({
        ...prev,
        isFollowing: !nextFollowing,
        followers: Math.max(0, prev.followers + (nextFollowing ? -1 : 1)),
      }));
      toast.error('Sign in to follow writers.');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main id="main" className="min-h-screen bg-paper">
          <LoadingLine>Finding the writer…</LoadingLine>
        </main>
        <Footer />
      </>
    );
  }

  if (!author) {
    return (
      <>
        <Header />
        <main id="main" className="flex min-h-screen items-center justify-center bg-paper px-6 py-24">
          <EmptyNote
            mark="⁂"
            title="No such writer"
            action={
              <InkButton href="/posts" variant="outline">
                Back to the shelves
              </InkButton>
            }
          >
            This page may have been removed, or the address may be wrong.
          </EmptyNote>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main" className="pb-24">
        <section className="border-b border-rule paper-grain">
          <div className="relative mx-auto max-w-[60rem] px-4 py-14 sm:px-6 lg:px-8">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-7 sm:flex-row sm:items-start"
            >
              <UserAvatar src={author.avatar} name={author.name} size="xl" />

              <div className="min-w-0 flex-1">
                <Kicker className="mb-2">Writer</Kicker>
                <h1 className="font-display type-4 font-semibold leading-tight text-foreground">
                  {author.name}
                </h1>

                <p className="mt-4 max-w-xl font-reading type-1 leading-relaxed text-ink-soft">
                  {author.bio || 'This writer has not added a note about themselves yet.'}
                </p>

                <dl className="mt-6 flex flex-wrap items-baseline gap-x-7 gap-y-2 border-t border-rule pt-5 text-sm">
                  {[
                    { term: 'Published', value: author.posts },
                    { term: 'Followers', value: author.followers },
                    { term: 'Following', value: author.following },
                  ].map((stat) => (
                    <div key={stat.term} className="flex items-baseline gap-2">
                      <dd className="font-display type-2 font-semibold leading-none tabular-nums text-foreground">
                        {stat.value}
                      </dd>
                      <dt className="label">{stat.term}</dt>
                    </div>
                  ))}
                </dl>

                <button
                  type="button"
                  onClick={handleFollow}
                  aria-pressed={Boolean(author.isFollowing)}
                  className={cn(
                    'mt-6 inline-flex items-center gap-2 border px-4 py-2 text-sm font-medium transition-colors',
                    author.isFollowing
                      ? 'border-rule-strong text-ink-soft hover:text-foreground'
                      : 'border-primary bg-primary text-primary-foreground hover:bg-forest-light'
                  )}
                >
                  {author.isFollowing ? (
                    <>
                      <Check size={14} aria-hidden /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} aria-hidden /> Follow
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-[60rem] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-rule pb-4">
            <h2 className="font-display type-3 font-semibold text-foreground">
              Published work
            </h2>
            <span className="label tabular-nums">
              {posts.length} {posts.length === 1 ? 'piece' : 'pieces'}
            </span>
          </div>

          {posts.length === 0 ? (
            <EmptyNote mark="❧" title="Nothing published yet">
              When a mentor approves something by this writer, it appears here.
            </EmptyNote>
          ) : (
            <ul className="divide-y divide-rule border-b border-rule">
              {posts.map((post, i) => (
                <li key={post.id} className="group relative">
                  <div className="flex gap-4 py-6 sm:gap-7">
                    <span
                      aria-hidden
                      className="hidden w-8 shrink-0 pt-1 font-reading text-sm tabular-nums text-ink-faint sm:block"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <GenreTag category={post.category} />
                        <span aria-hidden className="text-ink-faint">·</span>
                        <span className="text-[0.6875rem] text-ink-faint">
                          {formatShortDate(post.created_at)}
                          {post.read_time ? ` · ${post.read_time} min` : ''}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display type-2 font-semibold leading-snug text-foreground">
                        <Link
                          href={`/posts/${post.id}`}
                          className="after:absolute after:inset-0 after:content-['']"
                        >
                          <span className="ink-underline">{post.title}</span>
                        </Link>
                      </h3>
                      <p className="mt-2 font-reading text-[0.9375rem] leading-relaxed text-ink-soft line-clamp-2">
                        {post.excerpt?.trim() || openingLine(post.content || '')}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
