'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { categories } from '@/lib/posts';
import { api } from '@/lib/api-client';
import { Upload, X } from 'lucide-react';

export function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    api.getPost(editId).then((data: { post: Record<string, unknown> }) => {
      const p = data.post;
      setTitle(p.title as string);
      setExcerpt(p.excerpt as string);
      setContent(p.content as string);
      setCategory(p.category as string);
      setTags((p.tags as string[]) || []);
      setFeaturedImage((p.featured_image as string) || null);
    }).catch(() => alert('Failed to load essay'));
  }, [editId]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setFeaturedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submit = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('Please add a title');
      return;
    }
    if (status === 'published' && (!excerpt.trim() || !content.trim())) {
      alert('Please fill in title, excerpt, and content');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        excerpt,
        content,
        category,
        tags,
        featured_image: featuredImage || '',
        status,
      };
      if (editId) {
        await api.updatePost(editId, body);
        alert(status === 'draft' ? 'Draft saved!' : 'Essay updated!');
      } else {
        await api.createPost(body);
        alert(status === 'draft' ? 'Draft saved!' : 'Essay published successfully!');
        if (status === 'published') {
          setTitle('');
          setExcerpt('');
          setContent('');
          setCategory('Technology');
          setTags([]);
          setFeaturedImage(null);
        }
      }
      if (status === 'published') router.push('/dashboard');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4">{editId ? 'Edit Essay' : 'Write an Essay'}</h1>
            <p className="text-muted-foreground text-lg">Share your thoughts, stories, and expertise with the world</p>
          </div>

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-semibold mb-2">Essay Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your compelling title here..." className="w-full px-4 py-3 text-lg font-semibold border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Excerpt</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A brief summary..." rows={2} className="w-full px-4 py-3 border border-border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              <p className="text-xs text-muted-foreground mt-1">{excerpt.length}/200 characters</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Featured Image</label>
              {featuredImage ? (
                <div className="relative inline-block mb-4 w-full">
                  <img src={featuredImage} alt="Featured" className="h-48 w-full object-cover rounded-lg" />
                  <button type="button" onClick={() => setFeaturedImage(null)} className="absolute top-2 right-2 p-1 bg-primary text-primary-foreground rounded-full"><X size={20} /></button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary cursor-pointer">
                  <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                  <div className="font-semibold">Click to upload featured image</div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Content</label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-secondary">
                {categories.filter((c) => c !== 'All').map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Tags</label>
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Type tag and press Enter..." className="w-full px-4 py-3 border border-border rounded-lg bg-secondary mb-3" />
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}><X size={16} /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-8 border-t border-border">
              <button type="button" onClick={() => submit('draft')} disabled={saving} className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-secondary disabled:opacity-50">{saving ? 'Saving...' : 'Save as Draft'}</button>
              <button type="button" onClick={() => submit('published')} disabled={saving} className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50">{saving ? 'Publishing...' : editId ? 'Update Essay' : 'Publish Essay'}</button>
              <Link href="/dashboard" className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-secondary">Back to Dashboard</Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
