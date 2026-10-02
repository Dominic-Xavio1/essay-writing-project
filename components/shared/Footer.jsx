'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Compass, PenLine, LayoutDashboard, Heart } from 'lucide-react';

const links = [
  { href: '/posts', label: 'Explore the wall', icon: Compass },
  { href: '/create', label: 'Pin a note', icon: PenLine },
  { href: '/dashboard', label: 'My board', icon: LayoutDashboard },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/agahozo.png" alt="ASYV" width={40} height={40} className="rounded-xl" />
              <span className="font-display text-xl font-extrabold text-foreground">
                ASYV Writing
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The creative wall of Agahozo-Shalom Youth Village — where students pin essays, poems and ideas, and lift
              each other up.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-5 text-xs font-medium text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ASYV Writing · Agahozo-Shalom Youth Village, Rwanda</p>
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart size={13} className="text-primary" /> by ASYV students
          </p>
        </div>
      </div>
    </footer>
  );
}
