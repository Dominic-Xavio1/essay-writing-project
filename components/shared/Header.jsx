'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { api } from '@/lib/api-client';
import Image from 'next/image';


export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const authLinks = user ? (
    <>
      <span className="text-sm text-muted-foreground hidden lg:inline">Hi, {user.name.split(' ')[0]}</span>
      <button
        onClick={handleLogout}
        className="text-sm px-4 py-2 text-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </>
  ) : (
    <>
      <Link href="/auth/login" className="text-sm px-4 py-2 text-foreground hover:text-primary transition-colors">
        Sign In
      </Link>
      <Link href="/auth/signup" className="text-sm px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
        Get Started
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/agahozo.png" alt="EssayHub" width={53} height={53} />
            <span className="font-semibold text-lg text-foreground">ASYV Writing</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/posts" className="text-sm text-foreground hover:text-primary transition-colors">Explore</Link>
            <Link href="/dashboard" className="text-sm text-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/create" className="text-sm text-foreground hover:text-primary transition-colors">Write</Link>
          </nav>

          <div className="hidden md:flex gap-4 items-center">{authLinks}</div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-secondary rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border">
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/posts" className="px-4 py-2 hover:bg-secondary rounded-lg">Explore</Link>
              <Link href="/dashboard" className="px-4 py-2 hover:bg-secondary rounded-lg">Dashboard</Link>
              <Link href="/create" className="px-4 py-2 hover:bg-secondary rounded-lg">Write</Link>
              <hr className="my-2 border-border" />
              {user ? (
                <button onClick={handleLogout} className="px-4 py-2 text-left hover:bg-secondary rounded-lg">
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
