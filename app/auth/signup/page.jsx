'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Check, Minus } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Kicker, InkButton } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const RULES = {
  length: 'At least 8 characters',
  uppercase: 'One capital letter',
  lowercase: 'One small letter',
  number: 'One number',
  special: 'One symbol, like ! @ # $',
};

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
  };

  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.password.length > 0;
  const passwordStrong = Object.values(passwordRequirements).filter(Boolean).length >= 4;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      const message = 'Please fill in every field';
      setError(message);
      toast.error(message);
      return;
    }
    if (!passwordStrong) {
      const message = 'That password does not meet the requirements yet';
      setError(message);
      toast.error(message);
      return;
    }
    if (!passwordsMatch) {
      const message = 'The two passwords are not the same';
      setError(message);
      toast.error(message);
      return;
    }
    if (!formData.agreeToTerms) {
      const message = 'Please agree to the village writing rules';
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    try {
      await api.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast.success('Welcome to ASYV Writers.');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'That account could not be created';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass =
    'w-full border border-rule bg-input px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none';

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main" className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-[60rem] gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
          {/* What you are joining */}
          <div className="lg:sticky lg:top-32">
            <Kicker className="mb-3">Join</Kicker>
            <h1 className="font-display type-4 font-semibold leading-tight text-foreground">
              A shelf with room for your writing
            </h1>
            <p className="mt-5 font-reading type-1 leading-relaxed text-ink-soft">
              Write drafts nobody else can see, send them to a mentor when you are ready, and read
              what everyone else at Agahozo-Shalom has published.
            </p>
            <ul className="mt-8 divide-y divide-rule border-y border-rule">
              {[
                'Your drafts stay private until you send them.',
                'A mentor reads every piece before it goes up.',
                'You keep your work, and can edit or delete it at any time.',
              ].map((line) => (
                <li key={line} className="flex gap-3 py-3.5">
                  <span aria-hidden className="font-reading text-accent">
                    ❧
                  </span>
                  <span className="text-sm leading-relaxed text-ink-soft">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The form */}
          <div className="w-full">
            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-3 border border-rule-strong px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
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
                <label htmlFor="name" className="label mb-2 block">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="The name readers will see"
                  required
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="label mb-2 block">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="label mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className={cn(fieldClass, 'pr-11')}
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

                {formData.password && (
                  <ul className="mt-3 space-y-1.5">
                    {Object.entries(RULES).map(([key, label]) => {
                      const met = passwordRequirements[key];
                      return (
                        <li
                          key={key}
                          className={cn(
                            'flex items-center gap-2 text-xs',
                            met ? 'text-primary' : 'text-ink-faint'
                          )}
                        >
                          {met ? (
                            <Check size={13} aria-hidden />
                          ) : (
                            <Minus size={13} aria-hidden />
                          )}
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="label mb-2 block">
                  Password again
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    aria-invalid={Boolean(formData.confirmPassword && !passwordsMatch)}
                    className={cn(
                      fieldClass,
                      'pr-11',
                      formData.confirmPassword && !passwordsMatch && 'border-destructive'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={showConfirmPassword ? 'Hide the password' : 'Show the password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-faint hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} aria-hidden />
                    ) : (
                      <Eye size={17} aria-hidden />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="mt-1.5 text-xs text-destructive">
                    These two are not the same yet.
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 accent-[var(--forest)]"
                />
                <span className="text-sm leading-relaxed text-ink-soft">
                  I will write my own work, keep it kind, and accept that a mentor reads everything
                  before it is published.
                </span>
              </label>

              <InkButton
                type="submit"
                variant="solid"
                size="lg"
                disabled={isLoading || !passwordStrong || !passwordsMatch}
                className="w-full"
              >
                {isLoading ? 'Creating your account…' : 'Create my account'}
              </InkButton>
            </form>

            <p className="mt-7 border-t border-rule pt-5 text-sm text-ink-soft">
              Already have an account?{' '}
              <Link href="/auth/login" className="link-quiet font-medium text-foreground">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
