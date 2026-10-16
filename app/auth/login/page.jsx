'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Kicker, InkButton, LoadingLine } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState(urlError || '');

  useEffect(() => {
    if (urlError) setError(urlError);
  }, [urlError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.login({ email, password, rememberMe });
      setIsRedirecting(true);
      // A full navigation makes sure the session cookie is in place first.
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That sign-in did not work');
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return <LoadingLine>Opening your desk…</LoadingLine>;
  }

  return (
    <div className="w-full max-w-sm">
      <Kicker className="mb-3">Welcome back</Kicker>
      <h1 className="font-display type-4 font-semibold leading-tight text-foreground">
        Sign in to keep writing
      </h1>
      <p className="mt-3 font-reading text-[0.9375rem] leading-relaxed text-ink-soft">
        Your drafts are waiting exactly where you left them.
      </p>

      <a
        href="/api/auth/google"
        className="mt-8 flex w-full items-center justify-center gap-3 border border-rule-strong px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </a>

      <div className="my-7 flex items-center gap-4">
        <span aria-hidden className="h-px flex-1 bg-rule" />
        <span className="label text-[0.5625rem]">or with your email</span>
        <span aria-hidden className="h-px flex-1 bg-rule" />
      </div>

      {error && (
        <p
          role="alert"
          className="mb-5 border-l-2 border-destructive bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label mb-2 block">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full border border-rule bg-input px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="label mb-2 block">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-rule bg-input px-3.5 py-2.5 pr-11 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide the password' : 'Show the password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-faint hover:text-foreground"
            >
              {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 accent-[var(--forest)]"
          />
          Keep me signed in on this device
        </label>

        <InkButton type="submit" variant="solid" size="lg" disabled={isLoading} className="w-full">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </InkButton>
      </form>

      <p className="mt-7 border-t border-rule pt-5 text-sm text-ink-soft">
        No account yet?{' '}
        <Link href="/auth/signup" className="link-quiet font-medium text-foreground">
          Join ASYV Writers
        </Link>
      </p>
      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Forgotten your password? Ask an ASYV mentor to help you reset it — there is no automatic
        reset yet.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main" className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6">
        <Suspense fallback={<LoadingLine>Loading…</LoadingLine>}>
          <LoginContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
