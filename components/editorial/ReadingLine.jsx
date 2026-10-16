'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * The reading line.
 *
 * A thin rule in the left margin of an essay, marked with the piece's own
 * section headings. The filled part tracks how far the reader has come, and
 * the current section is named. Everything shown here is read out of the
 * essay's real HTML — if a piece has no headings, only the rule appears.
 */
export function ReadingLine({ headings = [], progress = 0, className = '' }) {
  const [activeId, setActiveId] = useState(headings[0]?.id || null);

  useEffect(() => {
    if (!headings.length) return;

    const onScroll = () => {
      // The heading closest to a line a third of the way down the viewport.
      const marker = window.innerHeight * 0.33;
      let current = headings[0].id;
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= marker) current = heading.id;
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  const activeIndex = Math.max(0, headings.findIndex((h) => h.id === activeId));

  return (
    <nav
      aria-label="Sections of this piece"
      className={cn('flex gap-4 text-left', className)}
    >
      {/* The rule itself, filling as the reader descends */}
      <div
        className="relative w-px shrink-0 bg-rule"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="absolute left-0 top-0 w-px bg-accent transition-[height] duration-200 ease-out"
          style={{ height: `${Math.min(100, Math.max(0, progress))}%` }}
        />
        {headings.map((heading, i) => (
          <span
            key={heading.id}
            aria-hidden
            className={cn(
              'absolute -left-[2px] h-[5px] w-[5px] rounded-full transition-colors duration-300',
              i <= activeIndex ? 'bg-accent' : 'bg-rule-strong'
            )}
            style={{ top: `${headings.length === 1 ? 0 : (i / (headings.length - 1)) * 100}%` }}
          />
        ))}
      </div>

      {headings.length > 0 ? (
        <ol className="space-y-2.5">
          {headings.map((heading, i) => (
            <li key={heading.id} className={heading.level === 3 ? 'pl-3' : undefined}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  'block text-[0.8125rem] leading-snug transition-colors duration-300',
                  i === activeIndex
                    ? 'font-medium text-foreground'
                    : 'text-ink-faint hover:text-ink-soft'
                )}
                aria-current={i === activeIndex ? 'true' : undefined}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[0.8125rem] leading-snug text-ink-faint">
          <span className="block font-medium text-ink-soft">{Math.round(progress)}% read</span>
          One unbroken piece.
        </p>
      )}
    </nav>
  );
}
