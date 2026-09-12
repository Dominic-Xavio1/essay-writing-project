'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      const message = 'Please fill in all fields';
      setError(message);
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
      return;
    }
    if (!passwordStrong) {
      const message = 'Password does not meet requirements';
      setError(message);
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
      return;
    }
    if (!passwordsMatch) {
      const message = 'Passwords do not match';
      setError(message);
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
      return;
    }
    if (!formData.agreeToTerms) {
      const message = 'Please agree to terms and conditions';
      setError(message);
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await api.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast({
        title: 'Account created',
        description: 'Your account has been successfully created.',
      });
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      toast({
        title: 'Signup failed',
        description: message,
        variant: 'destructive',
      });
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
            <p className="text-muted-foreground mb-8">Join our community of writers</p>

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
                          passwordRequirements[key as keyof typeof passwordRequirements]
                            ? 'text-green-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {passwordRequirements[key as keyof typeof passwordRequirements] ? (
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
