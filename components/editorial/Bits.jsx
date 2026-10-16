'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { categoryMeta } from '@/lib/board';
import { cn } from '@/lib/utils';

/* ───────────────────────────────────────────────────────────────────────────
   The small, reusable editorial details. Everything in the interface is
   built from these, so the whole site stays in one voice.
   ─────────────────────────────────────────────────────────────────────────── */

/** A small-caps label above a heading. */
export function Kicker({ children, className = '', as: Tag = 'p' }) {
  return <Tag className={cn('label', className)}>{children}</Tag>;
}

/**
 * A section heading with a rule that draws itself when the section
 * first scrolls into view — once, never on a loop.
 */
export function SectionHead({ kicker, title, href, cta, className = '', level = 2 }) {
  const reduce = useReducedMotion();
  const Heading = `h${level}`;

  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          {kicker && <Kicker className="mb-2">{kicker}</Kicker>}
          <Heading className="font-display type-3 font-semibold text-foreground">{title}</Heading>
        </div>
        {href && (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1.5 pb-1 text-sm font-medium text-foreground"
          >
            <span className="ink-underline">{cta}</span>
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        )}
      </div>
      <motion.hr
        className="rule-hair mt-4 origin-left"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** The genre a piece belongs to, set as a quiet mark plus a name. */
export function GenreTag({ category, className = '', withMark = true, size = 'sm' }) {
  const meta = categoryMeta(category);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium uppercase tracking-[0.12em]',
        size === 'sm' ? 'text-[0.6875rem]' : 'text-xs',
        className
      )}
      style={{ color: meta.accent }}
    >
      {withMark && (
        <span aria-hidden className="font-reading text-[1.15em] leading-none">
          {meta.mark}
        </span>
      )}
      {meta.label}
    </span>
  );
}

/** Author, date and reading time, set as one line of credits. */
export function ByLine({
  author,
  date,
  readTime,
  className = '',
  linkAuthor = true,
  showAvatar = false,
}) {
  const name = author?.name;
  const nameNode = linkAuthor && author?.id ? (
    <Link href={`/author/${author.id}`} className="link-quiet font-medium text-foreground">
      {name}
    </Link>
  ) : (
    <span className="font-medium text-foreground">{name}</span>
  );

  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft', className)}>
      {showAvatar && author?.avatar && (
        <img
          src={author.avatar}
          alt=""
          loading="lazy"
          className="mr-1 h-7 w-7 rounded-full object-cover"
        />
      )}
      {name && nameNode}
      {date && (
        <>
          {name && <span aria-hidden className="text-ink-faint">·</span>}
          <time dateTime={new Date(date).toISOString()}>
            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
        </>
      )}
      {readTime ? (
        <>
          <span aria-hidden className="text-ink-faint">·</span>
          <span>{readTime} min read</span>
        </>
      ) : null}
    </p>
  );
}

/**
 * A button. Two weights only: a solid one for the single most important
 * action on a screen, and a hairline one for everything else.
 */
export function InkButton({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'solid',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xs font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45';

  const variants = {
    solid: 'bg-primary text-primary-foreground hover:bg-forest-light',
    accent: 'bg-accent text-accent-foreground hover:brightness-110',
    outline: 'border border-rule-strong bg-transparent text-foreground hover:border-primary hover:text-primary',
    quiet: 'text-ink-soft hover:bg-secondary hover:text-foreground',
    danger: 'border border-destructive/40 text-destructive hover:bg-destructive/10',
  };

  const sizes = {
    sm: 'h-8 px-3 text-[0.8125rem]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-9 w-9',
  };

  const classes = cn(base, variants[variant] || variants.solid, sizes[size] || sizes.md, className);

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}

/**
 * An empty state that says plainly what is missing and what to do about it.
 */
export function EmptyNote({ mark = '❧', title, children, action, className = '' }) {
  return (
    <div className={cn('mx-auto max-w-md border border-rule bg-card px-6 py-12 text-center', className)}>
      <span aria-hidden className="font-reading text-3xl text-ink-faint">
        {mark}
      </span>
      <h3 className="mt-4 font-display type-2 font-semibold text-foreground">{title}</h3>
      {children && <div className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/** A loading placeholder shaped like the thing it is replacing. */
export function CardSkeleton({ withCover = true }) {
  return (
    <div className="border border-rule bg-card p-5">
      {withCover && <div className="mb-4 aspect-[4/3] skeleton-shimmer" />}
      <div className="h-3 w-24 skeleton-shimmer" />
      <div className="mt-3 h-5 w-4/5 skeleton-shimmer" />
      <div className="mt-2 h-4 w-full skeleton-shimmer" />
      <div className="mt-1.5 h-4 w-2/3 skeleton-shimmer" />
    </div>
  );
}

/** A quiet spinner-free loading line, used while a page's data arrives. */
export function LoadingLine({ children = 'Fetching the page…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center" role="status">
      <span aria-hidden className="h-px w-16 animate-pulse bg-rule-strong" />
      <p className="font-reading type-1 italic text-ink-soft">{children}</p>
    </div>
  );
}
