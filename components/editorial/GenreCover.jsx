'use client';

import { categoryMeta, hashString } from '@/lib/board';
import { cn } from '@/lib/utils';

/**
 * A typographic cover for pieces with no image of their own.
 *
 * It is drawn entirely from the post's real title and genre — an initial set
 * in the display serif over a paper pattern that belongs to that genre. No
 * stock photography, no network request, and it scales to any size.
 */

const PATTERNS = {
  grid: (id, accent) => (
    <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M16 0H0v16" fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="0.75" />
    </pattern>
  ),
  rule: (id, accent) => (
    <pattern id={id} width="24" height="13" patternUnits="userSpaceOnUse">
      <path d="M0 12.5h24" fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="0.75" />
    </pattern>
  ),
  dots: (id, accent) => (
    <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill={accent} fillOpacity="0.22" />
    </pattern>
  ),
  swatch: (id, accent) => (
    <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="13" cy="13" r="8" fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="0.75" />
    </pattern>
  ),
  frame: (id, accent) => (
    <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
      <path
        d="M4 1h-3v3M26 1h3v3M4 29H1v-3M26 29h3v-3"
        fill="none"
        stroke={accent}
        strokeOpacity="0.22"
        strokeWidth="0.75"
      />
    </pattern>
  ),
};

const TINTS = ['var(--note-mint)', 'var(--note-peach)', 'var(--note-butter)', 'var(--note-sky)', 'var(--note-lilac)'];

function initialsFrom(title = '') {
  const clean = title.trim();
  if (!clean) return '¶';
  const first = clean[0].toUpperCase();
  // A second letter only if the title has a clear second word — keeps short
  // titles monumental and long ones from feeling cramped.
  const words = clean.split(/\s+/);
  if (words.length > 1 && clean.length > 14) {
    const second = words[1][0];
    if (/[a-z]/i.test(second)) return `${first}${second.toLowerCase()}`;
  }
  return first;
}

export function GenreCover({
  title = '',
  category,
  seed,
  ratio = '4 / 3',
  className = '',
  showLabel = true,
}) {
  const meta = categoryMeta(category);
  const h = hashString(`${seed || title || category || 'asyv'}`);
  const patternId = `cover-${meta.key}-${h % 9999}`;
  const pattern = PATTERNS[meta.pattern] || PATTERNS.rule;
  const tint = TINTS[h % TINTS.length];
  const initials = initialsFrom(title);

  // Three compositions, picked deterministically, so a page of covers varies.
  const layout = h % 3;
  const letterX = layout === 1 ? '50%' : layout === 2 ? '88%' : '12%';
  const letterY = layout === 1 ? '58%' : '82%';
  const anchor = layout === 1 ? 'middle' : layout === 2 ? 'end' : 'start';

  return (
    <div
      className={cn('relative overflow-hidden bg-paper-deep', className)}
      style={{ aspectRatio: ratio, backgroundColor: tint }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 320 240"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="presentation"
      >
        <defs>{pattern(patternId, meta.accent)}</defs>
        <rect width="320" height="240" fill={`url(#${patternId})`} />

        {/* Hairline frame, inset like a printed plate */}
        <rect
          x="10"
          y="10"
          width="300"
          height="220"
          fill="none"
          stroke="var(--ink)"
          strokeOpacity="0.14"
          strokeWidth="1"
        />

        <text
          x={letterX}
          y={letterY}
          textAnchor={anchor}
          fill="var(--ink)"
          fillOpacity="0.17"
          style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontSize: initials.length > 1 ? '150px' : '185px',
            fontWeight: 600,
          }}
        >
          {initials}
        </text>

        <text
          x="22"
          y="38"
          fill={meta.accent}
          fillOpacity="0.75"
          style={{ fontFamily: 'var(--font-reading), Georgia, serif', fontSize: '22px' }}
        >
          {meta.mark}
        </text>
      </svg>

      {showLabel && (
        <span className="label absolute bottom-3 right-3 text-[0.6rem] text-ink-soft/70">
          {meta.kicker}
        </span>
      )}
    </div>
  );
}

/**
 * A post's image when it has one, and a typographic cover when it does not.
 * Images are always lazy and never block first paint.
 */
export function PostCover({
  post,
  className = '',
  ratio = '4 / 3',
  showLabel = true,
  priority = false,
}) {
  if (post?.featured_image) {
    return (
      <div className={cn('relative overflow-hidden bg-paper-deep', className)} style={{ aspectRatio: ratio }}>
        <img
          src={post.featured_image}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <GenreCover
      title={post?.title}
      category={post?.category}
      seed={post?.id}
      ratio={ratio}
      className={className}
      showLabel={showLabel}
    />
  );
}
