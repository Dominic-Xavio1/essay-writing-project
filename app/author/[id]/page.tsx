'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { api } from '@/lib/api-client';
import type { Post } from '@/lib/posts';

type AuthorProfile = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
};

export default function AuthorPage() {
  const params = useParams();
  const id = params.id as string;

  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getUser(id)
      .then((data: { user: AuthorProfile; posts: Post[] }) => {
        setAuthor(data.user);
        setPosts(data.posts);
      })
      .catch(() => setAuthor(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!author) return;
    try {
      const result = await api.followUser(id) as { following: boolean };
      setAuthor({ ...author, isFollowing: result.following, followers: author.followers + (result.following ? 1 : -1) });
    } catch {
      alert('Sign in to follow authors');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!author) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Author not found</h1>
            <Link href="/posts" className="text-primary hover:underline">Back to essays</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-secondary border border-border rounded-lg p-8 mb-12 flex flex-col md:flex-row gap-6 items-start">
            <img src={author.avatar || '/placeholder-user.jpg'} alt={author.name} className="w-24 h-24 rounded-full object-cover" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{author.name}</h1>
              <p className="text-muted-foreground mb-4">{author.bio || 'No bio yet.'}</p>
              <div className="flex gap-6 text-sm mb-4">
                <span><strong>{author.posts}</strong> essays</span>
                <span><strong>{author.followers}</strong> followers</span>
                <span><strong>{author.following}</strong> following</span>
              </div>
              <button onClick={handleFollow} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90">
                {author.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">Essays by {author.name}</h2>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No published essays yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="block bg-card border border-border rounded-lg p-6 hover:border-primary">
                  <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                  <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
