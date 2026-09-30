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
    <div className="flex items-center gap-3">
      {/* Quick Search Launcher Button */}
      <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/posts"
          className="hidden xl:flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary/80 border border-border/80 text-muted-foreground hover:text-foreground text-xs font-bold hover:border-primary/50 transition-all cursor-pointer group shadow-xs"
          title="Search essays (Ctrl+K)"
        >
          <Search size={16} className="group-hover:text-primary transition-colors" />
          <span>Search</span>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-background border border-border rounded-md text-muted-foreground">
            ⌘K
          </kbd>
        </Link>
      </motion.div>

      {/* Glass Notifications Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.12, y: -2, rotate: [0, -8, 8, 0] }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowAchievements(false);
          }}
          className="p-3 text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border border-border/80 rounded-full transition-all relative cursor-pointer shadow-xs hover:border-primary/50 hover:shadow-md"
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
          className="p-3 text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border border-border/80 rounded-full transition-all relative cursor-pointer shadow-xs hover:border-amber-500/50 hover:shadow-md"
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
          className="flex items-center gap-3 px-3.5 py-2 rounded-full bg-secondary/70 hover:bg-secondary border border-border/80 hover:border-primary/50 transition-all group cursor-pointer shadow-xs"
        >
          <UserAvatar src={user.avatar} name={user.name} size="sm" />
          <span className="text-xs font-extrabold text-foreground hidden lg:inline group-hover:text-primary transition-colors pr-1">
            {user.name.split(' ')[0]}
          </span>
        </Link>
      </motion.div>

      {/* Innovative Glowing Glass "Write" Button */}
      <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.92 }}>
        <Link
          href="/create"
          className="hidden sm:inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-black text-sm shadow-[0_0_22px_rgba(16,185,129,0.4)] hover:shadow-[0_0_32px_rgba(16,185,129,0.65)] border border-white/30 transition-all duration-300 group cursor-pointer"
        >
          <PenSquare size={16} className="group-hover:rotate-12 transition-transform duration-300" />
          <span>Write</span>
        </Link>
      </motion.div>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.12, y: -2 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleLogout}
        className="p-3 text-muted-foreground hover:text-rose-500 bg-secondary/60 hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 rounded-full transition-all cursor-pointer shadow-xs"
        title="Sign Out"
      >
        <LogOut size={18} />
      </motion.button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Button variant="green" href="/auth/login" className="rounded-full px-6 py-2.5 text-sm font-extrabold shadow-md">
          Sign In
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/auth/signup"
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-black shadow-[0_0_22px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_rgba(16,185,129,0.7)] transition-all border border-white/20 inline-block"
        >
          Get Started
        </Link>
      </motion.div>
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-card/90 backdrop-blur-2xl border-b border-border/80 shadow-xl'
          : 'bg-background/95 backdrop-blur-xl border-b border-border/60'
      }`}
    >
      {/* Top Ambient Glass Highlight Gradient Accent Line */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-emerald-500/40 via-primary to-amber-500/40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Branding */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            >
              <Image
                src="/agahozo.png"
                alt="ASYV Writing"
                width={46}
                height={46}
                className="rounded-xl ring-2 ring-primary/30 group-hover:ring-primary transition-all shadow-md"
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-none mb-1">
                ASYV Writing
              </span>
              <span className="text-[9.5px] tracking-widest uppercase font-extrabold text-emerald-700 dark:text-emerald-400">
                Publishing Platform
              </span>
            </div>
          </Link>

          {/* Liquid Glass Navigation Pill Items */}
          <nav className="hidden md:flex items-center gap-2 bg-secondary/70 backdrop-blur-xl p-2 rounded-full border border-border/80 shadow-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Link
                    href={item.href}
                    className={`relative px-5 py-2.5 rounded-full text-sm font-extrabold transition-all flex items-center gap-2 select-none ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/90'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="header-active-pill"
                        className={`absolute inset-0 rounded-full border shadow-sm ${
                          item.isSuper
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                            : 'bg-card border-border/90'
                        }`}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon
                        size={17}
                        className={
                          item.isSuper
                            ? 'text-amber-500'
                            : isActive
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }
                      />
                      <span>{item.label}</span>
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="hidden md:flex gap-4 items-center">{authLinks}</div>

          {/* Mobile Menu Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 text-foreground bg-secondary/80 hover:bg-secondary rounded-full border border-border/80 shadow-xs"
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
              className="md:hidden pb-5 border-t border-border/80 pt-3"
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
                      className={`px-4 py-3.5 rounded-2xl flex items-center gap-3.5 font-bold transition-all ${
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
                      className="px-4 py-3.5 text-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold shadow-md"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
