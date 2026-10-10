'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  Sparkles,
  PenSquare,
  Trophy,
  Bell,
  ShieldCheck,
  AlertCircle,
  Compass,
  LayoutDashboard,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Button } from '@/components/ui/customButton';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  // Scroll listener for dynamic header glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
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
        toast.info(`🔔 ${notif.title}`, {
          description: notif.message,
          duration: isUrgent ? 12000 : 6000,
          position: 'top-right',
        });

        if (isUrgent && typeof Audio !== 'undefined') {
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {}
        }
      });

      const unsubscribeFeedback = wsClient.subscribe('SUPERUSER_FEEDBACK', (data) => {
        const isRevision = data.status === 'draft';
        toast.info(isRevision ? '📝 Revision Required' : '💬 New Feedback', {
          description: data.feedback,
          duration: 15000,
          action: {
            label: 'View',
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
    { href: '/posts', label: 'Explore', icon: Compass },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(user?.isSuperuser
      ? [{ href: '/dashboard/admin', label: 'Moderation', icon: ShieldCheck, isSuper: true }]
      : []),
    { href: '/create', label: 'Write', icon: PenSquare },
  ];

  const authLinks = user ? (
    <div className="flex items-center gap-2">
      {/* Quick Search Launcher Button */}
      {/* <form action="/posts" className="relative hidden xl:block">
        <Search size={18} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="search"
          placeholder="Search..."
          aria-label="Search the writing wall"
          className="h-11 w-44 rounded-full border border-primary/40 bg-background/50 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary xl:w-48 2xl:w-56"
        />
      </form> */}

      {/* Glass Notifications Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.12, y: -2, rotate: [0, -8, 8, 0] }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowAchievements(false);
          }}
          className="relative rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-black text-white ring-2 ring-background animate-bounce shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 mt-3 w-80 sm:w-88 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 z-50 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-3">
                <span className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <Bell size={16} className="text-primary animate-pulse" /> Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No notifications yet</p>
                ) : (
                  notifications.map((item) => {
                    const isUrgent = item.type === 'warning' || item.type === 'moderation';
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl transition-all relative ${
                          item.is_read
                            ? 'bg-secondary/40'
                            : isUrgent
                            ? 'bg-rose-500/10 border border-rose-500/30'
                            : 'bg-primary/10 border border-primary/20'
                        }`}
                      >
                        {!item.is_read && isUrgent && (
                          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        )}
                        <Link
                          href={item.link || '#'}
                          onClick={() => setShowNotifications(false)}
                          className="block"
                        >
                          <div className="flex items-start gap-2.5">
                            {isUrgent && (
                              <AlertCircle size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-foreground text-xs">{item.title}</p>
                              <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2">
                                {item.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/80 mt-1">
                                {new Date(item.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Achievements Trophy Button */}
      <div className="relative hidden sm:block">
        <motion.button
          whileHover={{ scale: 1.12, y: -2, rotate: [0, -8, 8, 0] }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setShowAchievements(!showAchievements);
            setShowNotifications(false);
          }}
          className="relative rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-amber-600"
          title="Achievements & Badges"
        >
          <Trophy size={19} className="text-amber-500" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse ring-2 ring-background" />
        </motion.button>

        <AnimatePresence>
          {showAchievements && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 mt-3 w-76 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 z-50 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-3">
                <span className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                  <Sparkles size={16} className="text-amber-500" /> Reader Achievements
                </span>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  3 Unlocked
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 bg-secondary/60 rounded-xl border border-border/50">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-base shadow-xs">
                    ✍️
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xs">First Essay Written</p>
                    <p className="text-muted-foreground text-[11px]">Published your story</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-secondary/60 rounded-xl border border-border/50">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-base shadow-xs">
                    📚
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xs">Avid Reader</p>
                    <p className="text-muted-foreground text-[11px]">Read 10+ essays</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-secondary/60 rounded-xl border border-border/50">
                  <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-base shadow-xs">
                    👏
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xs">100 Claps Received</p>
                    <p className="text-muted-foreground text-[11px]">Community appreciation</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile Glass Pill */}
      <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-full px-1.5 py-1 text-foreground transition-colors hover:bg-secondary/70 group"
        >
          <UserAvatar src={user.avatar} name={user.name} size="sm" />
          <span className="hidden text-sm font-bold text-foreground transition-colors group-hover:text-primary 2xl:inline">
            {user.name.split(' ')[0]}
          </span>
        </Link>
      </motion.div>

      {/* Innovative Glowing Glass "Write" Button */}
      <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.92 }}>
        <Link
          href="/create"
          className="hidden sm:inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-amber-700/20 bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-emerald-950 shadow-sm transition-colors hover:bg-amber-400 group"
        >
          <PenSquare size={16} className="group-hover:rotate-12 transition-transform duration-300" />
          <span className="hidden xl:inline">Pin a note</span>
        </Link>
      </motion.div>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.12, y: -2 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleLogout}
        className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
        title="Sign Out"
      >
        <LogOut size={18} />
      </motion.button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Button variant="green" href="/auth/login" className="rounded-full px-5 py-2.5 text-sm font-bold shadow-sm">
          Sign In
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/auth/signup"
          className="inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Join the wall
        </Link>
      </motion.div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 px-2 pt-2 sm:px-4">
      <div className={`mx-auto max-w-[1720px] rounded-[1.75rem] border border-border/80 backdrop-blur-xl transition-all duration-300 ${scrolled ? 'bg-card/95 shadow-[var(--shadow-float)]' : 'bg-card/85 shadow-sm'}`}>
        <div className="mx-auto max-w-[1660px] px-3 sm:px-5 xl:px-7">
        <div className="flex min-h-[76px] items-center justify-between gap-3">
          {/* Logo Branding */}
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            >
              <Image
                src="/agahozo.png"
                alt="ASYV Writing"
                width={54}
                height={54}
                className="rounded-full border border-border/70 shadow-sm transition-shadow group-hover:shadow-md"
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="whitespace-nowrap font-display text-xl font-extrabold leading-none text-primary transition-colors sm:text-2xl">
                ASYV Writing
              </span>
              <span className="mt-1 hidden whitespace-nowrap text-sm leading-none text-muted-foreground xl:block">
                the village writing wall
              </span>
            </div>
          </Link>

          {/* Liquid Glass Navigation Pill Items */}
          <nav aria-label="Main navigation" className="hidden items-center gap-5 xl:flex 2xl:gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 whitespace-nowrap py-3 text-[13px] font-bold uppercase text-foreground/75 transition-colors hover:text-foreground after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform hover:after:scale-x-100 ${isActive ? 'text-foreground after:scale-x-100' : ''}`}
                >
                  <Icon size={17} aria-hidden className={item.isSuper ? 'text-amber-600' : isActive ? 'text-primary' : 'text-muted-foreground'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="hidden items-center gap-2 lg:flex 2xl:gap-3">{authLinks}</div>

          {/* Mobile Menu Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="rounded-full p-2.5 text-foreground transition-colors hover:bg-secondary xl:hidden"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </motion.button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              aria-label="Mobile navigation"
              className="xl:hidden pb-5 border-t border-border/80 pt-3"
            >
              <div className="flex flex-col gap-2.5 text-sm font-medium">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3.5 rounded-xl px-4 py-3 font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <hr className="my-2 border-border" />

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3.5 text-left hover:bg-rose-500/10 rounded-2xl text-rose-500 font-bold flex items-center gap-3"
                  >
                    <LogOut size={19} />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2.5 pt-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3.5 text-center rounded-2xl bg-secondary font-extrabold text-foreground"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3.5 text-center rounded-2xl bg-accent text-accent-foreground font-extrabold shadow-md"
                    >
                      Join the wall
                    </Link>
                  </div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
      </div>
    </header>
  );
}
