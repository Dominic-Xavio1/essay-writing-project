'use client';

import Link from 'next/link';
import { categories } from '@/lib/posts';
import { categoryMeta } from '@/lib/board';
import { cn } from '@/lib/utils';

/**
 * The colophon — who made this, what is in it, and where to go next.
 * Set like the back page of a magazine.
 */
export function Footer({ water = false }) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('border-t border-rule bg-paper', water && 'bg-card')}>
      <div className="mx-auto max-w-[84rem] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="font-display text-xl font-semibold tracking-tight text-foreground">
              ASYV&nbsp;<span className="italic text-primary">Writers</span>
            </Link>
            <p className="mt-3 font-reading text-[0.9375rem] leading-relaxed text-ink-soft">
              A quiet creative world where young minds find their voice. Stories, essays, articles and
              research by the students of Agahozo-Shalom Youth Village, Rwanda.
            </p>
            <p className="mt-5 font-reading text-sm italic text-ink-faint">
              Every piece here is read by a mentor before it is published.
            </p>
          </div>

          <nav aria-label="Genres">
            <p className="label mb-4">Genres</p>
            <ul className="space-y-2.5">
              {categories
                .filter((c) => c !== 'All')
                .map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/posts?category=${encodeURIComponent(cat)}`}
                      className="link-quiet text-sm text-ink-soft hover:text-foreground"
                    >
                      {categoryMeta(cat).label}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          <nav aria-label="Elsewhere">
            <p className="label mb-4">Elsewhere</p>
            <ul className="space-y-2.5">
              {[
                { href: '/posts', label: 'Read everything' },
                { href: '/create', label: 'Start writing' },
                { href: '/dashboard', label: 'My desk' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-quiet text-sm text-ink-soft hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-rule pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ASYV Writers · Agahozo-Shalom Youth Village, Rwanda</p>
          <p className="font-reading italic">Set in Fraunces, Newsreader and Inter.</p>
        </div>
      </div>
    </footer>
  );
}
