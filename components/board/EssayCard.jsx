'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Clock } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { boardItem, noteStyleFor, noteTiltFor, categoryMeta, formatShortDate } from '@/lib/board';
import { cn } from '@/lib/utils';

export function EssayCard({
  post,
  onLike,
  onBookmark,
  isBookmarked = false,
  actions,
  badge,
  tilt = true,
  monochrome = false,
  className = '',
}) {
  const style = noteStyleFor(post.id);
  const cardStyle = monochrome
    ? { bg: 'bg-white', tape: 'bg-primary/20', chip: 'bg-primary/5 text-primary' }
    : style;
  const rotate = tilt ? noteTiltFor(post.id) : 0;
  const CategoryIcon = categoryMeta(post.category).icon;
  const tags = post.tags || [];

  return (
    <motion.article
      variants={boardItem}
      style={{ rotate }}
      whileHover={{ y: -6, scale: 1.03, rotate: 0 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn(
        'group relative rounded-3xl border border-black/5 dark:border-white/5 p-4 sm:p-5',
        'shadow-[var(--shadow-note)] hover:shadow-[var(--shadow-float)] transition-shadow duration-300',
        cardStyle.bg,
        className
      )}
    >
      <span aria-hidden className={cn('tape', cardStyle.tape)} />

      {post.featured_image && (
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-secondary aspect-[4/3]">
          <img
            src={post.featured_image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold', cardStyle.chip)}>
          <CategoryIcon size={12} strokeWidth={2.75} aria-hidden />
          {post.category}
        </span>
        {post.read_time ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-black/20 px-2 py-1 text-[11px] font-bold text-muted-foreground">
            <Clock size={11} /> {post.read_time} min
          </span>
        ) : null}
        {badge}
      </div>

      <h3 className="font-display text-lg sm:text-xl font-extrabold leading-snug text-foreground mb-1.5">
        <Link
          href={`/posts/${post.id}`}
          className="outline-none after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:underline"
        >
          {post.title || 'Untitled'}
        </Link>
      </h3>

      {post.excerpt && (
        <p className="text-sm leading-relaxed text-foreground/70 line-clamp-3 mb-3">{post.excerpt}</p>
      )}

      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-primary/25 bg-white/60 dark:bg-black/20 px-2 py-0.5 text-[11px] font-bold text-primary"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/10 pt-3">
        {post.author ? (
          <Link
            href={`/author/${post.author.id}`}
            className="relative z-10 flex min-w-0 items-center gap-2 rounded-full pr-2 hover:bg-white/60 dark:hover:bg-black/20 transition-colors"
          >
            <UserAvatar src={post.author.avatar} name={post.author.name} size="xs" />
            <span className="truncate text-xs font-extrabold text-foreground">{post.author.name}</span>
            {post.created_at && (
              <span className="hidden shrink-0 whitespace-nowrap text-[11px] font-semibold text-muted-foreground 2xl:inline">
                · {formatShortDate(post.created_at)}
              </span>
            )}
          </Link>
        ) : (
          <span />
        )}

        <div className="relative z-10 flex items-center gap-1">
          {actions ?? (
            <>
              <motion.button
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={(e) => onLike?.(post.id, e)}
                aria-label={post.liked ? 'Unlike' : 'Like'}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold transition-colors',
                  post.liked
                    ? monochrome ? 'text-primary bg-primary/10' : 'text-rose-500 bg-rose-500/10'
                    : `text-muted-foreground ${monochrome ? 'hover:text-primary hover:bg-primary/5' : 'hover:text-rose-500 hover:bg-white/70 dark:hover:bg-black/20'}`
                )}
              >
                <Heart size={14} className={post.liked ? 'fill-rose-500' : ''} />
                {post.likes ?? 0}
              </motion.button>
              <Link
                href={`/posts/${post.id}#comments`}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold text-muted-foreground hover:text-primary hover:bg-white/70 dark:hover:bg-black/20 transition-colors"
                aria-label="Comments"
              >
                <MessageCircle size={14} />
                {post.comments ?? 0}
              </Link>
              {onBookmark && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => onBookmark(post.id, e)}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Save'}
                  className={cn(
                    'rounded-full p-1.5 transition-colors',
                    isBookmarked
                      ? 'text-primary bg-primary/10'
                      : `text-muted-foreground ${monochrome ? 'hover:text-primary hover:bg-primary/5' : 'hover:text-accent hover:bg-white/70 dark:hover:bg-black/20'}`
                  )}
                >
                  <Bookmark size={14} className={isBookmarked ? 'fill-accent' : ''} />
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function EssayCardSkeleton({ tall = false }) {
  return (
    <div className="mb-5 break-inside-avoid rounded-3xl border border-border bg-card p-5 space-y-3">
      {tall && <div className="aspect-[4/3] rounded-2xl skeleton-shimmer" />}
      <div className="h-5 w-24 rounded-full skeleton-shimmer" />
      <div className="h-6 w-4/5 rounded-lg skeleton-shimmer" />
      <div className="h-4 w-full rounded-lg skeleton-shimmer" />
      <div className="h-4 w-2/3 rounded-lg skeleton-shimmer" />
    </div>
  );
}
