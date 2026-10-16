'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { EssayCard, EssayCardSkeleton } from '@/components/board/EssayCard';
import { PostCover } from '@/components/editorial/GenreCover';
import { SectionHead, Kicker, GenreTag, ByLine, EmptyNote, InkButton } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { categories } from '@/lib/posts';
import { categoryMeta, boardContainer, boardItem, riseIn } from '@/lib/board';
import { openingLine } from '@/lib/essay';

/* Prompts written for ASYV students — editorial copy, rotated by the date
   so the page feels alive without anything being invented about the data. */
const PROMPTS = [
  'Describe a moment at ASYV that changed how you see yourself.',
  'Write a letter to the student you were on your first day in the village.',
  'What does Tikkun Olam — repairing the world — mean in your ordinary Tuesday?',
  'Pick one sound from the village and build a short story around it.',
  'Argue for something most people in your class disagree with.',
];

export default function Home() {
  const reduce = useReducedMotion();
  const [user, setUser] = useState(null);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    setPromptIndex(new Date().getDate() % PROMPTS.length);
    api.getMe().then((d) => setUser(d.user)).catch(() => {});
    Promise.all([api.getPosts({ sort: 'trending' }), api.getPosts({ sort: 'recent' })])
      .then(([t, r]) => {
        setTrending(t.posts || []);
        setRecent(r.posts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* The issue line. Every number here is counted from the published pieces
     that came back from the API — nothing is estimated. */
  const issue = useMemo(() => {
    const writers = new Set(recent.map((p) => p.author?.id).filter(Boolean)).size;
    return { pieces: recent.length, writers };
  }, [recent]);

  const genreCounts = useMemo(() => {
    const counts = {};
    recent.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [recent]);

  const handleLike = async (postId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const flip = (list) =>
      list.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: Math.max(0, (p.likes || 0) + (p.liked ? -1 : 1)) }
          : p
      );
    setTrending(flip);
    setRecent(flip);
    try {
      await api.likePost(postId);
    } catch {
      setTrending(flip);
      setRecent(flip);
      toast.error('Sign in to leave a mark on a piece.');
    }
  };

  const firstName = user?.name?.split(' ')[0];
  const lead = trending[0] || recent[0];
  const seconds = (trending.length ? trending : recent).slice(1, 4);
  const restOfRecent = recent.filter((p) => p.id !== lead?.id).slice(0, 9);
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main">
        {/* ── Opening statement ──────────────────────────────────────────── */}
        <section className="relative border-b border-rule paper-grain">
          <div className="relative mx-auto max-w-[84rem] px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
            <motion.div
              initial={reduce ? false : 'hidden'}
              animate="show"
              variants={boardContainer}
              className="max-w-4xl"
            >
              <motion.div variants={boardItem} className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Kicker as="p">
                  {firstName ? `Muraho, ${firstName}` : 'The student magazine of Agahozo-Shalom'}
                </Kicker>
                <span aria-hidden className="h-px w-8 bg-rule-strong" />
                <p className="label text-ink-soft">{today}</p>
              </motion.div>

              <motion.h1
                variants={boardItem}
                className="font-display type-6 font-semibold leading-[0.98] tracking-[-0.025em] text-foreground"
              >
                We write it down
                <br />
                so it <span className="italic text-primary">stays</span>.
              </motion.h1>

              <motion.p
                variants={boardItem}
                className="mt-8 max-w-xl font-reading type-2 leading-relaxed text-ink-soft"
              >
                Essays, stories, poems and research by students at Agahozo-Shalom Youth Village.
                Written here, read by a mentor, then printed for everyone.
              </motion.p>

              <motion.div variants={boardItem} className="mt-10 flex flex-wrap items-center gap-6">
                <InkButton href="/posts" variant="solid" size="lg">
                  Start reading
                  <ArrowRight size={16} aria-hidden />
                </InkButton>
                <Link href="/create" className="group inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <PenLine size={15} className="text-accent" aria-hidden />
                  <span className="ink-underline">Add your own piece</span>
                </Link>
              </motion.div>

              {/* Issue line — real counts only */}
              <motion.dl
                variants={boardItem}
                className="mt-14 flex flex-wrap items-baseline gap-x-8 gap-y-4 border-t border-rule pt-6 text-sm"
              >
                {[
                  { term: 'Pieces published', value: issue.pieces },
                  { term: 'Student writers', value: issue.writers },
                  { term: 'Genres', value: categories.length - 1 },
                ].map((stat) => (
                  <div key={stat.term} className="flex items-baseline gap-2.5">
                    <dd className="font-display type-3 font-semibold leading-none text-foreground">
                      {loading ? '—' : stat.value}
                    </dd>
                    <dt className="label">{stat.term}</dt>
                  </div>
                ))}
              </motion.dl>
            </motion.div>
          </div>
        </section>

        {/* ── The lead piece ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          {loading ? (
            <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
              <div className="aspect-[16/10] skeleton-shimmer" />
              <div className="space-y-4">
                <div className="h-3 w-28 skeleton-shimmer" />
                <div className="h-10 w-full skeleton-shimmer" />
                <div className="h-4 w-full skeleton-shimmer" />
                <div className="h-4 w-4/5 skeleton-shimmer" />
              </div>
            </div>
          ) : !lead ? (
            <EmptyNote
              title="Nothing is printed yet"
              action={
                <InkButton href="/create" variant="solid">
                  <PenLine size={15} aria-hidden /> Write the first piece
                </InkButton>
              }
            >
              The first published piece will open this page. It could be yours.
            </EmptyNote>
          ) : (
            <>
              <motion.article
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="group grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14"
              >
                <Link href={`/posts/${lead.id}`} className="block overflow-hidden border border-rule" tabIndex={-1} aria-hidden="true">
                  <PostCover post={lead} ratio="16 / 10" priority showLabel={false} />
                </Link>

                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <Kicker>Lead piece</Kicker>
                    <span aria-hidden className="h-px w-6 bg-rule-strong" />
                    <GenreTag category={lead.category} />
                  </div>

                  <h2 className="font-display type-5 font-semibold leading-[1.04] tracking-[-0.02em] text-foreground">
                    <Link href={`/posts/${lead.id}`}>
                      <span className="ink-underline">{lead.title}</span>
                    </Link>
                  </h2>

                  <p className="mt-5 font-reading type-2 leading-relaxed text-ink-soft">
                    {lead.excerpt?.trim() || openingLine(lead.content || '', 220)}
                  </p>

                  <ByLine
                    author={lead.author}
                    date={lead.created_at}
                    readTime={lead.read_time}
                    className="mt-7 border-t border-rule pt-5"
                  />
                </div>
              </motion.article>

              {/* Three more, in a row of hairline columns */}
              {seconds.length > 0 && (
                <motion.div
                  variants={boardContainer}
                  initial={reduce ? false : 'hidden'}
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  className="mt-16 grid gap-px border-t border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3"
                >
                  {seconds.map((post, i) => (
                    <motion.article
                      key={post.id}
                      variants={boardItem}
                      className="group bg-paper px-0 pt-7 sm:px-6 lg:px-8"
                    >
                      <div className="flex items-baseline gap-3">
                        <span aria-hidden className="font-reading text-sm text-ink-faint">
                          {String(i + 2).padStart(2, '0')}
                        </span>
                        <GenreTag category={post.category} withMark={false} />
                      </div>
                      <h3 className="mt-3 font-display type-2 font-semibold leading-snug text-foreground">
                        <Link href={`/posts/${post.id}`}>
                          <span className="ink-underline">{post.title}</span>
                        </Link>
                      </h3>
                      <p className="mt-2.5 font-reading text-[0.9375rem] leading-relaxed text-ink-soft line-clamp-3">
                        {post.excerpt?.trim() || openingLine(post.content || '')}
                      </p>
                      <ByLine
                        author={post.author}
                        readTime={post.read_time}
                        className="mt-4 pb-7 text-[0.8125rem]"
                      />
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </section>

        {/* ── Genre index ────────────────────────────────────────────────── */}
        <section className="border-y border-rule bg-card">
          <div className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <SectionHead
              kicker="The shelves"
              title="Find the kind of writing you came for"
              href="/posts"
              cta="Browse everything"
            />

            <ul className="divide-y divide-rule border-y border-rule">
              {categories
                .filter((c) => c !== 'All')
                .map((cat, i) => {
                  const meta = categoryMeta(cat);
                  const count = genreCounts[cat] || 0;
                  return (
                    <li key={cat}>
                      <Link
                        href={`/posts?category=${encodeURIComponent(cat)}`}
                        className="group flex items-center gap-4 py-5 transition-colors sm:gap-6"
                      >
                        <span
                          aria-hidden
                          className="w-6 shrink-0 font-reading text-xl leading-none transition-transform duration-500 group-hover:-translate-y-0.5"
                          style={{ color: meta.accent }}
                        >
                          {meta.mark}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display type-2 font-semibold text-foreground">
                            <span className="ink-underline">{meta.label}</span>
                          </span>
                          <span className="mt-1 block font-reading text-[0.9375rem] text-ink-soft">
                            {meta.blurb}
                          </span>
                        </span>
                        <span className="label shrink-0 tabular-nums">
                          {loading ? '—' : `${count} ${count === 1 ? 'piece' : 'pieces'}`}
                        </span>
                        <ArrowRight
                          size={16}
                          aria-hidden
                          className="hidden shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent sm:block"
                        />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        </section>

        {/* ── Recently published ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHead
            kicker="Fresh ink"
            title="Just published"
            href="/posts"
            cta="All pieces"
          />

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <EssayCardSkeleton key={n} tall={n === 1} />
              ))}
            </div>
          ) : restOfRecent.length === 0 ? (
            <EmptyNote
              title="No new pieces this week"
              action={
                <InkButton href="/create" variant="outline">
                  <PenLine size={15} aria-hidden /> Write something
                </InkButton>
              }
            >
              When students publish, their work appears here first.
            </EmptyNote>
          ) : (
            <motion.div
              variants={boardContainer}
              initial={reduce ? false : 'hidden'}
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {restOfRecent.map((post) => (
                <EssayCard key={post.id} post={post} onLike={handleLike} />
              ))}
            </motion.div>
          )}
        </section>

        {/* ── The prompt box ─────────────────────────────────────────────── */}
        <section className="border-t border-rule bg-card">
          <div className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
            <motion.div
              variants={riseIn}
              initial={reduce ? false : 'hidden'}
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]"
            >
              <div>
                <Kicker className="mb-4">From the prompt box</Kicker>
                <p className="font-display type-4 font-normal italic leading-[1.2] text-foreground">
                  “{PROMPTS[promptIndex]}”
                </p>
                <p className="mt-5 font-reading text-[0.9375rem] text-ink-soft">
                  A new prompt appears here each day. You are not obliged to use it.
                </p>
              </div>

              <div className="lg:text-right">
                <p className="font-reading type-1 leading-relaxed text-ink-soft">
                  Write a draft, keep it as long as you like, then send it to a mentor when it is
                  ready. Nothing is published until they have read it.
                </p>
                <div className="mt-6 lg:flex lg:justify-end">
                  <InkButton href={user ? '/create' : '/auth/signup'} variant="accent" size="lg">
                    <PenLine size={16} aria-hidden />
                    {user ? 'Open a blank page' : 'Join and start writing'}
                  </InkButton>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
