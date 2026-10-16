'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Kicker, InkButton } from '@/components/editorial/Bits';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'profile', label: 'Your page' },
  { id: 'account', label: 'Account' },
  { id: 'privacy', label: 'Privacy & notices' },
];

const fieldClass =
  'w-full border border-rule bg-input px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    api
      .getMe()
      .then((data) => {
        const u = data.user;
        setName(u.name || '');
        setBio(u.bio || '');
        setAvatar(u.avatar || '');
        setEmail(u.email || '');
        setIsPrivate(u.isPrivate ?? false);
        setEmailNotifications(u.emailNotifications ?? true);
        setNotifications(u.pushNotifications ?? true);
      })
      .catch(() => router.push('/auth/login'));
  }, [router]);

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please choose a JPEG, PNG, WebP or GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('That file is larger than 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploadingAvatar(true);
    try {
      const res = await fetch('/api/users/me/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'That upload did not work');

      setAvatar(data.avatarUrl || data.user?.avatar || '');
      toast.success('Picture updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That upload did not work');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.updateMe({ name, bio, avatar });
      toast.success('Your page is updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save that');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both passwords.');
      return;
    }
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast.success('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change the password');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    router.push('/auth/login');
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Delete your account and everything you have written? This cannot be undone.'
      )
    )
      return;
    try {
      await api.deleteMe();
      toast.success('Your account has been deleted.');
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete the account');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await api.updateSettings({ isPrivate, emailNotifications, pushNotifications: notifications });
      toast.success('Saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save that');
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main" className="pb-24">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-[60rem] px-4 py-10 sm:px-6 lg:px-8">
            <Link
              href="/dashboard"
              className="link-quiet inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft"
            >
              <ArrowLeft size={13} aria-hidden /> My desk
            </Link>
            <Kicker className="mb-2 mt-5">Settings</Kicker>
            <h1 className="font-display type-4 font-semibold leading-tight text-foreground">
              Your page and your account
            </h1>
          </div>
        </section>

        <div className="mx-auto max-w-[60rem] px-4 pt-8 sm:px-6 lg:px-8">
          <nav aria-label="Settings sections" className="mb-10 flex items-center gap-6 border-b border-rule">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveTab(section.id)}
                aria-current={activeTab === section.id ? 'true' : undefined}
                className={cn(
                  'relative -mb-px whitespace-nowrap pb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] transition-colors',
                  activeTab === section.id
                    ? 'border-b-2 border-accent text-foreground'
                    : 'text-ink-faint hover:text-ink-soft'
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-8">
              <div>
                <p className="label mb-3">Your picture</p>
                <div className="flex flex-wrap items-center gap-6">
                  <UserAvatar src={avatar} name={name} size="xl" />
                  <div>
                    <div className="flex items-center gap-3">
                      <label
                        className={cn(
                          'inline-flex cursor-pointer items-center gap-2 border border-rule-strong px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary',
                          isUploadingAvatar && 'pointer-events-none opacity-50'
                        )}
                      >
                        <Upload size={14} aria-hidden />
                        {isUploadingAvatar ? 'Uploading…' : 'Choose a file'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleAvatarFileUpload}
                          disabled={isUploadingAvatar}
                          className="hidden"
                        />
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="text-sm text-ink-soft transition-colors hover:text-destructive"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-ink-faint">
                      JPEG, PNG, WebP or GIF, up to 5MB. Without one, your initials are used.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="avatar-url" className="label mb-2 block">
                  Or paste a picture address
                </label>
                <input
                  id="avatar-url"
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://…"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="display-name" className="label mb-2 block">
                  Name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                />
                <p className="mt-1.5 text-xs text-ink-faint">
                  This appears on every piece you publish.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="bio" className="label">
                    A note about you
                  </label>
                  <span className="text-[0.6875rem] tabular-nums text-ink-faint">
                    {bio.length}/500
                  </span>
                </div>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="What you write about, what you are reading, what you are working towards."
                  className={cn(fieldClass, 'resize-none font-reading text-base')}
                />
              </div>

              <InkButton variant="solid" onClick={handleSaveProfile}>
                Save your page
              </InkButton>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="max-w-xl space-y-10">
              <div>
                <p className="label mb-2">Email</p>
                <p className="font-reading type-1 text-foreground">{email}</p>
                <p className="mt-1.5 text-xs text-ink-faint">
                  This is how you sign in. Ask a mentor if you need it changed.
                </p>
              </div>

              <div className="border-t border-rule pt-8">
                <p className="label mb-4">Change your password</p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="current-password" className="sr-only">
                      Current password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="sr-only">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <InkButton variant="outline" onClick={handleChangePassword}>
                    Change password
                  </InkButton>
                </div>
              </div>

              <div className="border-t border-rule pt-8">
                <p className="label mb-4">This device</p>
                <InkButton variant="quiet" onClick={handleLogout}>
                  Sign out
                </InkButton>
              </div>

              <div className="border border-destructive/40 p-5">
                <div className="flex gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete your account</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                      This removes your account and everything you have written, including published
                      pieces. It cannot be undone.
                    </p>
                    <div className="mt-4">
                      <InkButton variant="danger" size="sm" onClick={handleDeleteAccount}>
                        Delete my account
                      </InkButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="max-w-xl">
              <ul className="divide-y divide-rule border-y border-rule">
                {[
                  {
                    label: 'Keep my profile private',
                    desc: 'Your published pieces stay on the shelves; your profile page is kept quiet.',
                    value: isPrivate,
                    set: setIsPrivate,
                  },
                  {
                    label: 'Email me',
                    desc: 'About new followers and responses to your writing.',
                    value: emailNotifications,
                    set: setEmailNotifications,
                  },
                  {
                    label: 'Notices in the site',
                    desc: 'Mentor decisions and responses, shown while you are here.',
                    value: notifications,
                    set: setNotifications,
                  },
                ].map((item) => (
                  <li key={item.label} className="flex items-start justify-between gap-6 py-5">
                    <label className="flex-1 cursor-pointer">
                      <span className="block text-sm font-medium text-foreground">{item.label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                        {item.desc}
                      </span>
                    </label>
                    <input
                      type="checkbox"
                      checked={item.value}
                      onChange={(e) => item.set(e.target.checked)}
                      aria-label={item.label}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--forest)]"
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <InkButton variant="solid" onClick={handleSavePrivacy}>
                  Save these settings
                </InkButton>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
