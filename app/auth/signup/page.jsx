'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';
import { toast } from 'sonner';

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      const message = 'Please fill in all fields';
      setError(message);
      toast.error(message);
      return;
    }
    if (!passwordStrong) {
      const message = 'Password does not meet requirements';
      setError(message);
      toast.error(message);
      return;
    }
    if (!passwordsMatch) {
      const message = 'Passwords do not match';
      setError(message);
      toast.error(message);
      return;
    }
    if (!formData.agreeToTerms) {
      const message = 'Please agree to terms and conditions';
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
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground mb-6">Join our community of writers</p>

            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-xl bg-secondary hover:bg-muted font-semibold text-sm transition-all shadow-xs mb-6 text-foreground"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Sign up with Google</span>
            </a>

            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-xs font-semibold text-muted-foreground uppercase">
                or email
              </span>
            </div>

            {error && (
              <p className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Eric Dupfitii"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rus@example.com"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <div className="relative mb-3">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {formData.password && (
                  <div className="space-y-2 text-sm mb-4 p-3 bg-secondary rounded-lg">
                    {Object.entries({
                      length: 'At least 8 characters',
                      uppercase: 'One uppercase letter',
                      lowercase: 'One lowercase letter',
                      number: 'One number',
                      special: 'One special character (!@#$%^&*)',
                    }).map(([key, label]) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 ${
                          passwordRequirements[key]
                            ? 'text-green-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {passwordRequirements[key] ? (
                          <Check size={16} />
                        ) : (
                          <X size={16} />
                        )}
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 border rounded-lg bg-secondary focus:outline-none focus:ring-2 pr-10 ${
                      formData.confirmPassword && !passwordsMatch
                        ? 'border-destructive focus:ring-destructive'
                        : 'border-border focus:ring-primary'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-destructive mt-1">Passwords do not match</p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border mt-1"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>

              <Button
                type="submit"
                disabled={isLoading || !passwordStrong || !passwordsMatch}
                variant="accent"
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="my-6 border-t border-border"></div>

            <p className="text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
