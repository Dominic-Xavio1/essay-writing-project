'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/customButton';
import { AlertCircle } from 'lucide-react';
import type { User } from '@/lib/user';

type Tab = 'profile' | 'account' | 'privacy';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    api.getMe()
      .then((data: { user: User & { isPrivate?: boolean; emailNotifications?: boolean; pushNotifications?: boolean } }) => {
        const u = data.user;
        setName(u.name);
        setBio(u.bio);
        setEmail(u.email);
        setIsPrivate(u.isPrivate ?? false);
        setEmailNotifications(u.emailNotifications ?? true);
        setNotifications(u.pushNotifications ?? true);
      })
      .catch(() => router.push('/auth/login'));
  }, [router]);

  const handleSaveProfile = async () => {
    try {
      await api.updateMe({ name, bio });
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      alert('Enter current and new password');
      return;
    }
    try {
      await api.changePassword({ currentPassword, newPassword });
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Password change failed');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    router.push('/auth/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.deleteMe();
      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await api.updateSettings({ isPrivate, emailNotifications, pushNotifications: notifications });
      alert('Privacy settings saved!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your account and preferences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1 space-y-2">
              {(['profile', 'account', 'privacy'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold capitalize ${
                    activeTab === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </aside>

            <div className="md:col-span-3">
              {activeTab === 'profile' && (
                <div className="bg-card border border-border rounded-lg p-8 space-y-6">
                  <h2 className="text-2xl font-bold">Edit Profile</h2>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full px-4 py-3 border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                    <p className="text-xs text-muted-foreground mt-1">{bio.length}/500 characters</p>
                  </div>
                  <Button variant="accent" onClick={handleSaveProfile}>
                    Save Changes
                  </Button>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-8">
                    <h3 className="text-xl font-bold mb-4">Email</h3>
                    <p className="text-muted-foreground">{email}</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-8 space-y-4">
                    <h3 className="text-xl font-bold">Change Password</h3>
                    <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-secondary" />
                    <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-secondary" />
                    <Button variant="green" onClick={handleChangePassword}>
                      Change Password
                    </Button>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-8">
                    <h3 className="text-xl font-bold mb-4">Session</h3>
                    <Button variant="outline" onClick={handleLogout}>
                      Sign Out
                    </Button>
                  </div>
                  <div className="bg-card border border-destructive rounded-lg p-8">
                    <div className="flex gap-4 items-start">
                      <AlertCircle className="text-destructive flex-shrink-0 mt-1" size={24} />
                      <div>
                        <h3 className="text-xl font-bold mb-2">Delete Account</h3>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="bg-card border border-border rounded-lg p-8 space-y-6">
                  <h2 className="text-2xl font-bold">Privacy Settings</h2>
                  {[
                    { label: 'Private Account', desc: 'Only approved followers can see your essays', value: isPrivate, set: setIsPrivate },
                    { label: 'Email Notifications', desc: 'Receive emails about new followers and comments', value: emailNotifications, set: setEmailNotifications },
                    { label: 'Push Notifications', desc: 'Get real-time notifications on this device', value: notifications, set: setNotifications },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between pb-6 border-b border-border last:border-0">
                      <div>
                        <h3 className="font-semibold mb-1">{item.label}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <input type="checkbox" checked={item.value} onChange={(e) => item.set(e.target.checked)} className="w-5 h-5" />
                    </div>
                  ))}
                  <Button variant="accent" onClick={handleSavePrivacy}>
                    Save Privacy Settings
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Link href="/dashboard" className="mt-8 inline-block text-primary hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
