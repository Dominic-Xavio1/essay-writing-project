'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Menu,
  X,
  LogOut,
  PenLine,
  Bell,
  ShieldCheck,
  AlertCircle,
  Compass,
  LayoutDashboard,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';

/**
 * The masthead.
 *
 * A printed nameplate rather than a floating app bar: solid paper, a single
 * hairline under it, and the name of the publication set large. It condenses
 * a little once the reader has started scrolling, and gets out of the way.
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [condensed, setCondensed] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setCondensed(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api
      .getMe()
      .then((data) => {
        setUser(data.user);
        if (data.user) {
          fetchNotifications();
          const { wsClient } = require('@/lib/websocket');
          wsClient.connect(data.user.id);
        }
      })
      .catch(() => setUser(null));

    let unsubscribe = () => {};
    try {
      const { wsClient } = require('@/lib/websocket');
      unsubscribe = wsClient.subscribe('NOTIFICATION', (notif) => {
        setNotifications((prev) => [notif, ...prev]);

        const isUrgent = notif.type === 'warning' || notif.type === 'moderation';
        toast.info(notif.title, {
          description: notif.message,
          duration: isUrgent ? 12000 : 6000,
          position: 'top-right',
        });
      });

      const unsubscribeFeedback = wsClient.subscribe('SUPERUSER_FEEDBACK', (data) => {
        const isRevision = data.status === 'draft';
        toast.info(isRevision ? 'A mentor asked for a revision' : 'New feedback from a mentor', {
          description: data.feedback,
          duration: 15000,
          action: {
            label: 'Open',
            onClick: () => router.push(data.notif?.link || '/dashboard'),
          },
        });
        setNotifications((prev) => [data.notif, ...prev].filter(Boolean));
      });

      return () => {
        unsubscribe();
        unsubscribeFeedback();
      };
    } catch (err) {
      return () => {};
    }
  }, []);

  // Close the notifications panel on an outside click or Escape.
  useEffect(() => {
    if (!showNotifications) return;
    const onPointerDown = (e) => {
      if (!notificationsRef.current?.contains(e.target)) setShowNotifications(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showNotifications]);

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(() => {});
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navItems = [
    { href: '/posts', label: 'Read', icon: Compass },
    { href: '/create', label: 'Write', icon: PenLine },
    { href: '/dashboard', label: 'My desk', icon: LayoutDashboard },
    ...(user?.isSuperuser
      ? [{ href: '/dashboard/admin', label: 'Review', icon: ShieldCheck, isSuper: true }]
      : []),
  ];

  const isCurrent = (href) =>
    pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-[2px] transition-[padding] duration-300',
        condensed ? 'py-1.5' : 'py-3'
      )}
    >
      <div className="mx-auto flex max-w-[84rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Nameplate */}
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-3">
          <Image
            src="/agahozo.png"
            alt=""
            width={36}
            height={36}
            className={cn(
              'rounded-full transition-all duration-300',
              condensed ? 'h-7 w-7' : 'h-9 w-9'
            )}
          />
          <span className="min-w-0">
            <span
              className={cn(
                'block whitespace-nowrap font-display font-semibold leading-none tracking-tight text-foreground transition-all duration-300',
                condensed ? 'text-lg' : 'text-xl sm:text-[1.6rem]'
              )}
            >
              ASYV&nbsp;<span className="italic text-primary">Writers</span>
            </span>
            {!condensed && (
              <span className="label mt-1.5 hidden text-[0.6rem] sm:block">
                Writing from Agahozo-Shalom
              </span>
            )}
          </span>
        </Link>

        <span aria-hidden className="hidden h-8 w-px bg-rule lg:block" />

        {/* Sections */}
        <nav aria-label="Sections" className="hidden flex-1 items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              className={cn(
                'relative py-1 text-[0.8125rem] font-medium uppercase tracking-[0.1em] transition-colors',
                isCurrent(item.href)
                  ? 'text-foreground'
                  : 'text-ink-soft hover:text-foreground'
              )}
            >
              {item.label}
              {item.isSuper && (
                <span aria-hidden className="ml-1.5 align-middle text-accent">◆</span>
              )}
              {isCurrent(item.href) && (
                <motion.span
                  layoutId="nav-rule"
                  className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-accent"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications((s) => !s)}
                  aria-label={
                    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
                  }
                  aria-expanded={showNotifications}
                  className="relative p-2 text-ink-soft transition-colors hover:text-foreground"
                >
                  <Bell size={18} aria-hidden />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-[7px] w-[7px] rounded-full bg-accent ring-2 ring-paper" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 z-50 mt-2 w-[20rem] border border-rule bg-card shadow-[var(--shadow-float)]"
                    >
                      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
                        <span className="label">Notices</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="link-quiet text-xs font-medium text-ink-soft"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 divide-y divide-rule overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-sm text-ink-faint">
                            Nothing yet.
                          </p>
                        ) : (
                          notifications.map((item) => {
                            const isUrgent =
                              item.type === 'warning' || item.type === 'moderation';
                            return (
                              <Link
                                key={item.id}
                                href={item.link || '#'}
                                onClick={() => setShowNotifications(false)}
                                className={cn(
                                  'flex gap-2.5 px-4 py-3 transition-colors hover:bg-secondary',
                                  !item.is_read && 'bg-secondary/60'
                                )}
                              >
                                {isUrgent && (
                                  <AlertCircle
                                    size={14}
                                    className="mt-0.5 shrink-0 text-accent"
                                    aria-hidden
                                  />
                                )}
                                <span className="min-w-0">
                                  <span className="block text-[0.8125rem] font-medium text-foreground">
                                    {item.title}
                                  </span>
                                  <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-ink-soft">
                                    {item.message}
                                  </span>
                                  <span className="mt-1 block text-[0.625rem] text-ink-faint">
                                    {new Date(item.created_at).toLocaleString('en-GB', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </span>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/create"
                className="hidden items-center gap-2 border border-primary bg-primary px-3.5 py-2 text-[0.8125rem] font-medium text-primary-foreground transition-colors hover:bg-forest-light sm:inline-flex"
              >
                <PenLine size={15} aria-hidden />
                Start writing
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 p-1 transition-opacity hover:opacity-80"
                aria-label="Your profile and settings"
              >
                <UserAvatar src={user.avatar} name={user.name} size="sm" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                className="hidden p-2 text-ink-faint transition-colors hover:text-destructive sm:block"
              >
                <LogOut size={17} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-3 py-2 text-[0.8125rem] font-medium text-foreground"
              >
                <span className="ink-underline">Sign in</span>
              </Link>
              <Link
                href="/auth/signup"
                className="border border-primary bg-primary px-3.5 py-2 text-[0.8125rem] font-medium text-primary-foreground transition-colors hover:bg-forest-light"
              >
                Join
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((s) => !s)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            className="p-2 text-foreground lg:hidden"
          >
            {isMenuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Small-screen menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Sections"
            className="overflow-hidden lg:hidden"
          >
            <div className="mx-auto max-w-[84rem] px-4 pb-4 pt-3 sm:px-6">
              <ul className="divide-y divide-rule border-y border-rule">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        aria-current={isCurrent(item.href) ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 py-3.5 text-sm font-medium transition-colors',
                          isCurrent(item.href) ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        <Icon size={17} className="text-ink-faint" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="mt-4 flex items-center gap-3 py-2 text-sm font-medium text-destructive"
                >
                  <LogOut size={17} aria-hidden /> Sign out
                </button>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 border border-rule-strong py-2.5 text-center text-sm font-medium text-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
