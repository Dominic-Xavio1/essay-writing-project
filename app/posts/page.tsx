'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { categories, allTags } from '@/lib/posts';
import { api } from '@/lib/api-client';
import { Heart, MessageCircle, Share2, Bookmark, Search } from 'lucide-react';
import type { Post } from '@/lib/posts';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);

  useEffect(() => {
    const params: Record<string, string> = { sort: sortBy };
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedTags.length) params.tags = selectedTags.join(',');

    setLoading(true);
    api.getPosts(params)
      .then((data: { posts: Post[] }) => setPosts(data.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory, selectedTags, sortBy]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const toggleLike = async (postId: string) => {
    try {
      const result = await api.likePost(postId) as { liked: boolean };
      setLikedPosts((prev) => result.liked ? [...prev, postId] : prev.filter((id) => id !== postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes + (result.liked ? 1 : -1) } : p));
    } catch {
      alert('Sign in to like essays');
    }
  };

  const toggleBookmark = async (postId: string) => {
    try {
      const result = await api.bookmarkPost(postId) as { bookmarked: boolean };
      setBookmarkedPosts((prev) => result.bookmarked ? [...prev, postId] : prev.filter((id) => id !== postId));
    } catch {
      alert('Sign in to bookmark essays');
    }
  };

  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">Discover Essays</h1>
            <p className="text-muted-foreground text-lg">Explore thoughtful writing from writers around the world</p>
          </div>

          <div className="mb-8 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search essays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <div className="mb-8 bg-secondary p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Sort By</h3>
                <div className="space-y-2">
                  {(['recent', 'trending'] as const).map((sort) => (
                    <label key={sort} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={sortBy === sort} onChange={() => setSortBy(sort)} className="w-4 h-4" />
                      <span className="text-sm capitalize">{sort}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-8 bg-secondary p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button key={category} onClick={() => setSelectedCategory(category)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === category ? 'bg-primary text-primary-foreground' : 'hover:bg-border'}`}>
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-xs font-medium ${selectedTags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-border hover:bg-primary hover:text-primary-foreground'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-3">
              {loading ? (
                <p className="text-center py-12 text-muted-foreground">Loading essays...</p>
              ) : posts.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No essays found.</p>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <article key={post.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors">
                      <div className="flex flex-col md:flex-row gap-6 p-6">
                        {post.featured_image && (
                          <div className="md:w-48 flex-shrink-0">
                            <img src={post.featured_image} alt={post.title} className="w-full h-32 md:h-40 object-cover rounded-lg" />
                          </div>
                        )}
                        <div className="flex-1">
                          {post.author && (
                            <div className="flex items-center gap-3 mb-3">
                              <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <p className="font-medium text-sm">{post.author.name}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(post.created_at)} • {post.read_time} min read</p>
                              </div>
                            </div>
                          )}
                          <Link href={`/posts/${post.id}`}>
                            <h2 className="text-xl font-bold mb-2 hover:text-primary">{post.title}</h2>
                          </Link>
                          <p className="text-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-secondary px-2 py-1 rounded-full">{tag}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1 hover:text-primary ${likedPosts.includes(post.id) ? 'text-primary' : ''}`}>
                                <Heart size={18} fill={likedPosts.includes(post.id) ? 'currentColor' : 'none'} />
                                <span>{post.likes}</span>
                              </button>
                              <div className="flex items-center gap-1"><MessageCircle size={18} /><span>{post.comments}</span></div>
                              <div className="flex items-center gap-1"><Share2 size={18} /><span>{post.shares}</span></div>
                            </div>
                            <button onClick={() => toggleBookmark(post.id)} className={`p-2 hover:bg-secondary rounded-lg ${bookmarkedPosts.includes(post.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                              <Bookmark size={20} fill={bookmarkedPosts.includes(post.id) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
