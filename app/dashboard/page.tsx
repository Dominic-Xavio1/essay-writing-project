'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import { Edit2, Trash2, Eye, Grid, List } from 'lucide-react';
import type { Post } from '@/lib/posts';
import type { User } from '@/lib/user';

export default function DashboardPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMe(), api.getMyPosts()])
      .then(([me, posts]) => {
        setUser(me.user as User);
        setUserPosts(posts.posts as Post[]);
      })
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this essay?')) return;
    try {
      await api.deletePost(postId);
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage your essays and track your success</p>
          </div>

          <section className="mb-12 bg-secondary border border-border rounded-lg p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <img src={user.avatar || '/placeholder-user.jpg'} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
                <p className="text-muted-foreground mb-4">{user.bio}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><p className="text-sm text-muted-foreground">Essays</p><p className="text-2xl font-bold">{user.posts}</p></div>
                  <div><p className="text-sm text-muted-foreground">Total Likes</p><p className="text-2xl font-bold">{user.likes.toLocaleString()}</p></div>
                  <div><p className="text-sm text-muted-foreground">Followers</p><p className="text-2xl font-bold">{user.followers}</p></div>
                  <div><p className="text-sm text-muted-foreground">Following</p><p className="text-2xl font-bold">{user.following}</p></div>
                </div>
              </div>
              <Link href="/dashboard/settings" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90">
                Edit Profile
              </Link>
            </div>
          </section>

          <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/create" className="bg-primary text-primary-foreground p-6 rounded-lg font-semibold hover:opacity-90 text-center">
              Write New Essay
            </Link>
            <Link href="/posts" className="bg-secondary border border-border p-6 rounded-lg font-semibold hover:bg-border text-center">
              Explore Essays
            </Link>
          </section>

          <section>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Your Essays</h3>
              <div className="flex gap-2">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                  <Grid size={20} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                  <List size={20} />
                </button>
              </div>
            </div>

            {userPosts.length === 0 ? (
              <div className="text-center py-12 bg-secondary border border-border rounded-lg">
                <p className="text-muted-foreground mb-4">No essays yet. Start writing!</p>
                <Link href="/create" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90">
                  Write Your First Essay
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPosts.map((post) => (
                  <article key={post.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors">
                    {post.featured_image && <img src={post.featured_image} alt={post.title} className="w-full h-40 object-cover" />}
                    <div className="p-6">
                      <h4 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h4>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">{post.category}</span>
                        <span className="text-xs text-muted-foreground capitalize">{(post as Post & { status?: string }).status || 'published'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/posts/${post.id}`} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-border rounded-lg text-sm">
                          <Eye size={16} /> View
                        </Link>
                        <Link href={`/create?edit=${post.id}`} className="px-3 py-2 hover:bg-secondary rounded-lg">
                          <Edit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(post.id)} className="px-3 py-2 hover:bg-destructive hover:text-destructive-foreground rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <div key={post.id} className="bg-card border border-border rounded-lg p-6 flex items-center justify-between hover:border-primary">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{post.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/posts/${post.id}`} className="p-2 hover:bg-secondary rounded-lg"><Eye size={20} /></Link>
                      <Link href={`/create?edit=${post.id}`} className="p-2 hover:bg-secondary rounded-lg"><Edit2 size={20} /></Link>
                      <button onClick={() => handleDelete(post.id)} className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-lg"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
