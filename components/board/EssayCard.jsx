'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { PostCover } from '@/components/editorial/GenreCover';
import { GenreTag } from '@/components/editorial/Bits';
import { boardItem, cardVariantFor, categoryMeta, formatShortDate } from '@/lib/board';
import { openingLine } from '@/lib/essay';
import { cn } from '@/lib/utils';

/**
 * One piece of writing, as it appears in a list.
 *
 * Four treatments are picked from the post's id so that a page reads like a
 * spread rather than a grid of identical boxes:
 *
 *   plain     a cover above the title
 *   ruled     no cover; a genre rule and a larger title
 *   quoted    the summary set as a pull quote
 *   numbered  the genre mark set large, like a plate number
 *
 * The public props are unchanged from the previous card, so every caller —
 * the dashboard, the explore page, the homepage — keeps working.
 */
export function EssayCard({
  post,
  onLike,
  onBookmark,
  isBookmarked = false,
  actions,
  badge,
  variant,
  // Kept for callers that still pass them; this design does not tilt paper
  // and does not tint cards, so they no longer change anything.
  tilt,
  monochrome,
  className = '',
}) {
  const meta = categoryMeta(post.category);
  const treatment = variant || cardVariantFor(post.id);
  const summary = post.excerpt?.trim() || openingLine(post.content || '');
  const showCover = Boolean(post.featured_image) || treatment === 'plain';
  const tags = post.tags || [];

  const titleSize =
    treatment === 'ruled' || treatment === 'quoted' ? 'type-3' : 'type-2';

  const titleFont =
    meta.titleFont === 'reading'
      ? 'font-reading'
      : meta.titleFont === 'sans'
      ? 'font-sans tracking-tight'
      : 'font-display';

  return (
    <motion.article
      variants={boardItem}
      className={cn(
        'group relative flex h-full flex-col border border-rule bg-card lift',
        className
      )}
    >
      {/* The genre's own rule, along the top edge */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 h-0 border-t',
          meta.rule === 'dotted' && 'border-dotted border-t-2',
          meta.rule === 'dashed' && 'border-dashed border-t-2',
          meta.rule === 'double' && 'border-double border-t-[3px]',
          meta.rule === 'bracket' && 'left-0 right-auto w-10 border-t-2',
          meta.rule === 'solid' && 'border-t-2'
        )}
        style={{ borderColor: meta.accent, opacity: 0.55 }}
      />

      {showCover && (
        <Link
          href={`/posts/${post.id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block overflow-hidden border-b border-rule"
        >
          <PostCover post={post} ratio={treatment === 'plain' ? '16 / 10' : '4 / 3'} showLabel={false} />
        </Link>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <GenreTag category={post.category} />
          {badge}
        </div>

        {treatment === 'numbered' && (
          <span
            aria-hidden
            className="mb-1 font-reading text-3xl leading-none"
            style={{ color: meta.accent, opacity: 0.4 }}
          >
            {meta.mark}
          </span>
        )}

        <h3 className={cn('font-semibold leading-tight text-foreground', titleFont, titleSize)}>
          <Link
            href={`/posts/${post.id}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            <span className="ink-underline">{post.title || 'Untitled'}</span>
          </Link>
        </h3>

        {summary && (
          <p
            className={cn(
              'mt-3 text-ink-soft',
              treatment === 'quoted'
                ? 'border-l-2 pl-3 font-reading type-1 italic leading-relaxed line-clamp-4'
                : 'font-reading text-[0.9375rem] leading-relaxed line-clamp-3'
            )}
            style={treatment === 'quoted' ? { borderColor: meta.accent } : undefined}
          >
            {summary}
          </p>
        )}

        {tags.length > 0 && treatment !== 'quoted' && (
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
            {tags.slice(0, 3).map((tag) => (
              <li key={tag} className="text-[0.6875rem] tracking-wide text-ink-faint">
                #{tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3 border-t border-rule pt-4">
          <div className="min-w-0">
            {post.author?.name && (
              <Link
                href={`/author/${post.author.id}`}
                className="link-quiet relative z-10 block truncate text-[0.8125rem] font-medium text-foreground"
              >
                {post.author.name}
              </Link>
            )}
            <p className="mt-0.5 text-[0.6875rem] text-ink-faint">
              {post.created_at && formatShortDate(post.created_at)}
              {post.read_time ? ` · ${post.read_time} min` : ''}
            </p>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-1">
            {actions ?? (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={(e) => onLike?.(post.id, e)}
                  aria-label={post.liked ? 'Remove your like' : 'Like this piece'}
                  aria-pressed={Boolean(post.liked)}
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-1 text-xs transition-colors',
                    post.liked ? 'text-accent' : 'text-ink-faint hover:text-accent'
                  )}
                >
                  <Heart size={14} className={post.liked ? 'fill-current' : ''} aria-hidden />
                  {post.likes ?? 0}
                </motion.button>

                <Link
                  href={`/posts/${post.id}#responses`}
                  className="inline-flex items-center gap-1 px-1.5 py-1 text-xs text-ink-faint transition-colors hover:text-primary"
                  aria-label={`${post.comments ?? 0} responses`}
                >
                  <MessageCircle size={14} aria-hidden />
                  {post.comments ?? 0}
                </Link>

                {onBookmark && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.88 }}
                    onClick={(e) => onBookmark(post.id, e)}
                    aria-label={isBookmarked ? 'Remove from your shelf' : 'Save to your shelf'}
                    aria-pressed={isBookmarked}
                    className={cn(
                      'p-1.5 transition-colors',
                      isBookmarked ? 'text-primary' : 'text-ink-faint hover:text-primary'
                    )}
                  >
                    <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} aria-hidden />
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </motion.article>
  );
}

export function EssayCardSkeleton({ tall = false }) {
  return (
    <div className="border border-rule bg-card p-5">
      {tall && <div className="mb-4 aspect-[4/3] skeleton-shimmer" />}
      <div className="h-3 w-24 skeleton-shimmer" />
      <div className="mt-3 h-5 w-4/5 skeleton-shimmer" />
      <div className="mt-2.5 h-4 w-full skeleton-shimmer" />
      <div className="mt-1.5 h-4 w-2/3 skeleton-shimmer" />
      <div className="mt-5 h-3 w-28 skeleton-shimmer" />
    </div>
  );
}
