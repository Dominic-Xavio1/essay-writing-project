'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, Flame, BookOpen, Sparkles, PenSquare, Trophy, Bell, ShieldCheck, Check } from 'lucide-react';
import { api } from '@/lib/api-client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/customButton';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.getMe()
      .then((data) => {
        setUser(data.user);
        if (data.user) {
          fetchNotifications();
        }
      })
      .catch(() => setUser(null));
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

  const authLinks = user ? (
    <div className="flex items-center gap-3">
      {/* Notifications Popover */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowAchievements(false);
          }}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors relative"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-background animate-pulse" />
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-xl rounded-xl p-4 z-50 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <span className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                  <Bell size={15} className="text-primary" /> Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No notifications yet</p>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg transition-colors ${
                        item.is_read ? 'bg-secondary/40' : 'bg-primary/10 border border-primary/20'
                      }`}
                    >
                      <Link
                        href={item.link || '#'}
                        onClick={() => setShowNotifications(false)}
                        className="block"
                      >
                        <p className="font-bold text-foreground text-xs">{item.title}</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{item.message}</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Achievements Popover Button */}
      <div className="relative hidden sm:block">
        <button
          onClick={() => {
            setShowAchievements(!showAchievements);
            setShowNotifications(false);
          }}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors relative"
          title="Achievements & Badges"
        >
          <Trophy size={18} className="text-amber-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        <AnimatePresence>
          {showAchievements && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-72 bg-card border border-border shadow-xl rounded-xl p-4 z-50 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <span className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                  <Sparkles size={16} className="text-amber-500" /> Reader Achievements
                </span>
                <span className="text-xs text-muted-foreground font-medium">3 Unlocked</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2 bg-secondary/60 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    ✍️
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">First Essay Written</p>
                    <p className="text-muted-foreground text-[11px]">Published your story</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-secondary/60 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                    📚
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Avid Reader</p>
                    <p className="text-muted-foreground text-[11px]">Read 10+ essays</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-secondary/60 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-sm">
                    👏
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">100 Claps Received</p>
                    <p className="text-muted-foreground text-[11px]">Community appreciation</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link href="/dashboard/settings" className="flex items-center gap-2 group">
        <UserAvatar src={user.avatar} name={user.name} size="sm" />
        <span className="text-sm font-semibold text-foreground hidden lg:inline group-hover:text-primary transition-colors">
          {user.name.split(' ')[0]}
        </span>
      </Link>

      <Button variant="accent" size="sm" href="/create" className="hidden sm:inline-flex">
        <PenSquare size={14} /> Write
      </Button>

      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut size={15} /> <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Button variant="green" href="/auth/login">
        Sign In
      </Button>
      <Button variant="accent" href="/auth/signup">
        Get Started
      </Button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Image src="/agahozo.png" alt="ASYV Writing" width={42} height={42} className="rounded-md" />
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold text-foreground leading-tight">ASYV Writing</span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-700 dark:text-emerald-400">Publishing Platform</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <Link href="/posts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            {user?.isSuperuser && (
              <Link href="/dashboard/admin" className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline transition-all">
                <ShieldCheck size={15} /> Moderation
              </Link>
            )}
            <Link href="/create" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Write
            </Link>
          </nav>

          <div className="hidden md:flex gap-4 items-center">{authLinks}</div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-secondary rounded-lg">
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border">
            <div className="flex flex-col gap-2 pt-4 text-sm font-medium">
              <Link href="/posts" className="px-4 py-2 hover:bg-secondary rounded-lg">Explore</Link>
              <Link href="/dashboard" className="px-4 py-2 hover:bg-secondary rounded-lg">Dashboard</Link>
              {user?.isSuperuser && (
                <Link href="/dashboard/admin" className="px-4 py-2 text-amber-600 dark:text-amber-400 font-bold hover:bg-secondary rounded-lg flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Moderation Studio
                </Link>
              )}
              <Link href="/create" className="px-4 py-2 hover:bg-secondary rounded-lg">Write</Link>
              <hr className="my-2 border-border" />
              {user ? (
                <button onClick={handleLogout} className="px-4 py-2 text-left hover:bg-secondary rounded-lg text-rose-500">
                  Sign Out
                </button>
              ) : (
                <>
                  <Link href="/auth/login" className="px-4 py-2 hover:bg-secondary rounded-lg">Sign In</Link>
                  <Link href="/auth/signup" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Get Started</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

