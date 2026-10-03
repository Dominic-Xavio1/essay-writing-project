'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, PenLine, Sparkles, Users, Heart, StickyNote, Compass, Pin } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { NoteBuddy } from '@/components/shared/NoteBuddy';
import { EssayCard, EssayCardSkeleton } from '@/components/board/EssayCard';
import { MasonryBoard } from '@/components/board/MasonryBoard';
import { api } from '@/lib/api-client';
import { categories } from '@/lib/posts';
import { categoryMeta, boardContainer, boardItem } from '@/lib/board';
import { toast } from 'sonner';

const PROMPTS = [
  'Describe a moment at ASYV that changed how you see yourself.',
  'Write a letter to the student you were on your first day in the village.',
  'What does "Tikkun Olam" — repairing the world — mean in your daily life?',
  'Pick one sound from the village and turn it into a short story.',
];

export default function Home() {
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

  const stats = useMemo(() => {
    const writers = new Set(recent.map((p) => p.author?.id).filter(Boolean)).size;
    const hearts = recent.reduce((sum, p) => sum + (p.likes || 0), 0);
    return { notes: recent.length, writers, hearts };
  }, [recent]);

  const categoryCounts = useMemo(() => {
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
        p.id === postId ? { ...p, liked: !p.liked, likes: Math.max(0, (p.likes || 0) + (p.liked ? -1 : 1)) } : p
      );
    setTrending(flip);
    setRecent(flip);
    try {
      await api.likePost(postId);
    } catch {
      setTrending(flip);
      setRecent(flip);
      toast.error('Sign in to send some love 💚');
    }
  };

  const firstName = user?.name?.split(' ')[0];
  const heroNotes = trending.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section>
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <motion.div variants={boardContainer} initial="hidden" animate="show" className="lg:pt-8">
              <motion.div variants={boardItem} className="mb-7 flex items-center gap-3">
                <NoteBuddy />
                <div>
                  <p className="text-xs font-extrabold uppercase text-primary">ASYV Writing</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {firstName ? `Muraho, ${firstName}` : 'Stories from the village'}
                  </p>
                </div>
              </motion.div>

              <motion.h1
                variants={boardItem}
                className="max-w-xl font-display text-4xl font-extrabold leading-[1.06] text-foreground sm:text-5xl lg:text-6xl"
              >
                Pin your <span className="font-hand text-[1.16em] font-semibold text-primary">story</span>
                <br />to the village wall.
              </motion.h1>

              <motion.p variants={boardItem} className="mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                A shared wall for Agahozo-Shalom students to leave essays, poems and big ideas. Read a friend&apos;s note,
                leave a reaction, or add your own voice.
              </motion.p>

              <motion.div variants={boardItem} className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/create"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <PenLine size={17} className="transition-transform group-hover:-rotate-12" />
                  Start a note
                </Link>
                <Link
                  href="/posts"
                  className="group inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Compass size={17} />
                  Explore the wall
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              <motion.div variants={boardItem} className="mt-12 max-w-xl">
                <p className="mb-3 text-[10px] font-extrabold uppercase text-muted-foreground">A little life on the wall</p>
                <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-4">
                {[
                  { icon: StickyNote, value: stats.notes, label: 'notes pinned' },
                  { icon: Users, value: stats.writers, label: 'student writers' },
                  { icon: Heart, value: stats.hearts, label: 'hearts given' },
                ].map(({ icon: Icon, value, label }, index) => (
                  <div key={label} className={`flex items-center gap-3 px-3 first:pl-0 sm:px-5 ${index === 2 ? 'pr-0' : ''}`}>
                    <Icon size={17} strokeWidth={1.8} className="shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-display text-xl font-extrabold leading-none text-foreground sm:text-2xl">{loading ? '–' : value}</p>
                      <p className="mt-1.5 text-[10px] font-bold leading-tight text-muted-foreground sm:text-xs">{label}</p>
                    </div>
                  </div>
                ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Trending cluster */}
            <div className="relative">
              <div className="mb-5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Flame size={14} className="text-primary" /> Trending at ASYV
                </span>
                <span className="text-xs text-muted-foreground">/ this week</span>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <EssayCardSkeleton tall />
                  <EssayCardSkeleton />
                </div>
              ) : heroNotes.length === 0 ? (
                <EmptyWall />
              ) : (
                <motion.div
                  variants={boardContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2"
                >
                  <div className="space-y-6 sm:pt-6">
                    {heroNotes[0] && <EssayCard post={heroNotes[0]} onLike={handleLike} monochrome />}
                  </div>
                  <div className="space-y-6">
                    {heroNotes.slice(1).map((p) => (
                      <EssayCard key={p.id} post={{ ...p, featured_image: '' }} onLike={handleLike} monochrome />
                    ))}
                    <PromptNote prompt={PROMPTS[promptIndex]} />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Creative boards */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        <SectionTitle kicker="Boards" title="Pick a board, find your people" href="/posts" cta="All boards" />
        <motion.div
          variants={boardContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {categories
            .filter((c) => c !== 'All')
            .map((cat, i) => {
              const meta = categoryMeta(cat);
              const Icon = meta.icon;
              return (
                <motion.div key={cat} variants={boardItem} whileHover={{ y: -3 }}>
                  <Link
                    href={`/posts?category=${encodeURIComponent(cat)}`}
                    className="relative flex h-36 flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-colors hover:border-primary/50"
                  >
                    <span className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/5 text-primary">
                        <Icon size={20} strokeWidth={1.8} />
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                    </span>
                    <div>
                      <p className="font-display text-base font-extrabold leading-tight text-foreground">{meta.label}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {categoryCounts[cat] || 0} {categoryCounts[cat] === 1 ? 'note' : 'notes'}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
        </motion.div>
      </section>

      {/* Fresh notes masonry */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        <SectionTitle kicker="Fresh ink" title="Just pinned by students" href="/posts" cta="Open the full wall" />
        {loading ? (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {[1, 2, 3, 4].map((n) => (
              <EssayCardSkeleton key={n} tall={n % 2 === 0} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyWall />
        ) : (
          <MasonryBoard>
            {recent.slice(0, 8).map((post) => (
              <EssayCard key={post.id} post={post} onLike={handleLike} monochrome />
            ))}
          </MasonryBoard>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pt-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-white px-6 py-9 sm:px-10 md:flex-row md:items-center sm:py-11">
            <div>
              <p className="text-xs font-extrabold uppercase text-primary">Your voice matters here</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground sm:text-3xl">Got something to say? Pin it.</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Every note is reviewed by an ASYV mentor before it goes live on the wall.
              </p>
            </div>
            <Link
              href={user ? '/create' : '/auth/signup'}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Sparkles size={17} />
              {user ? 'Write a new note' : 'Join the wall'}
            </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
function SectionTitle({ kicker, title, href, cta }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-xs font-bold uppercase text-primary">{kicker}</p>
        <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-extrabold text-foreground transition-all hover:border-primary/40 hover:text-primary sm:inline-flex"
        >
          {cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function PromptNote({ prompt }) {
  return (
    <motion.div
      variants={boardItem}
      whileHover={{ y: -6, scale: 1.03, rotate: 0 }}
      style={{ rotate: 1.5 }}
      className="relative rounded-2xl border border-dashed border-primary/40 bg-white p-5"
    >
      <p className="text-xs font-bold uppercase text-primary">Today&apos;s prompt</p>
      <p className="mt-3 font-display text-lg font-semibold leading-snug text-foreground">{prompt}</p>
      <Link
        href="/create"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
      >
        <PenLine size={13} /> Answer it
      </Link>
    </motion.div>
  );
}

function EmptyWall() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border bg-card/70 p-10 text-center">
      <Pin size={40} className="mx-auto -rotate-12 text-primary" />
      <h3 className="mt-3 font-display text-xl font-extrabold">The wall is waiting</h3>
      <p className="mt-1 text-sm text-muted-foreground">Be the first ASYV student to pin a note.</p>
      <Link
        href="/create"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <PenLine size={16} /> Start a note
      </Link>
    </div>
  );
}

