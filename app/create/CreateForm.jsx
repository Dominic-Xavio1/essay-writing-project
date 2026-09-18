'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { api } from '@/lib/api-client';
import { categories } from '@/lib/posts';
import { Button } from '@/components/ui/customButton';
import {
  Upload,
  X,
  Sparkles,
  Clock,
  Check,
  ImageIcon,
  Tag as TagIcon,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!editId) return;
    api
      .getPost(editId)
      .then((data) => {
        const p = data.post;
        setTitle(p.title || '');
        setExcerpt(p.excerpt || '');
        setContent(p.content || '');
        setCategory(p.category || 'Technology');
        setTags(p.tags || []);
        setFeaturedImage(p.featured_image || null);
      })
      .catch(() => toast.error('Failed to load essay'));
  }, [editId]);

  // Strip HTML tags for clean word & character count
  const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
  const characterCount = plainTextContent.length;
  const wordCount = plainTextContent ? plainTextContent.split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  // Word goal target calculation for SVG progress ring (target: 500 words)
  const targetWords = 500;
  const wordProgress = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setFeaturedImage(event.target?.result);
    reader.readAsDataURL(file);
    toast.success('Cover image uploaded');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const submit = async (status) => {
    if (!title.trim()) {
      toast.error('Please add a title to your essay');
      return;
    }
    if (status === 'published' && (!excerpt.trim() || !content.trim())) {
      toast.error('Please complete title, summary excerpt, and content before publishing');
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
        toast.success(status === 'draft' ? 'Draft updated!' : 'Essay updated successfully!');
      } else {
        const res = await api.createPost(body);
        if (status === 'draft') {
          toast.success('Draft saved!');
        } else if (res.post?.status === 'pending') {
          toast.success('Essay submitted for superuser review!');
        } else {
          toast.success('Essay published successfully!');
        }
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
      toast.error(err instanceof Error ? err.message : 'Failed to save essay');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-border/80">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                <Sparkles size={13} /> Editorial Studio
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {editId ? 'Edit Essay' : 'Draft New Essay'}
              </h1>
            </div>

            {/* Live Progress Ring Counter */}
            <div className="flex items-center gap-4 bg-card border border-border px-4 py-2 rounded-2xl shadow-xs">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="text-secondary"
                    fill="transparent"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="text-emerald-600 transition-all duration-300"
                    fill="transparent"
                    strokeDasharray="100"
                    strokeDashoffset={100 - wordProgress}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-foreground">{wordProgress}%</span>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{wordCount} words</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock size={11} /> ~{estimatedReadTime}m read
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of your essay..."
                className="w-full font-serif text-3xl sm:text-4xl font-bold bg-transparent border-b border-border/80 pb-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Excerpt Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                Summary Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a brief, engaging summary of your essay..."
                rows={2}
                maxLength={300}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1 text-right">
                {excerpt.length}/300 characters
              </p>
            </div>

            {/* Drag & Drop Cover Image Uploader */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                Cover Image
              </label>
              {featuredImage ? (
                <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden group border border-border shadow-xs">
                  <img src={featuredImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFeaturedImage(null)}
                      className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <X size={16} /> Remove Cover
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`block border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${isDragging
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-border/90 bg-card hover:border-primary/50'
                    }`}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto mb-3">
                    <Upload size={22} />
                  </div>
                  <p className="font-bold text-sm text-foreground mb-1">
                    Drag and drop your cover image here
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supports PNG, JPG, WebP up to 10MB
                  </p>
                  <span className="inline-block px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-muted transition-colors">
                    Browse File
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Rich Text Editorial Editor */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                Essay Body
              </label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            {/* Category & Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-card border border-border p-6 rounded-2xl shadow-xs">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {categories
                    .filter((c) => c !== 'All')
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag & press Enter..."
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                />
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="hover:opacity-80"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/80">
              <Button
                type="button"
                variant="green"
                onClick={() => submit('draft')}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </Button>

              <Button
                type="button"
                variant="accent"
                onClick={() => submit('published')}
                disabled={saving}
                className="w-full sm:flex-1"
              >
                {saving ? 'Publishing...' : editId ? 'Update & Publish' : 'Publish Essay'}
              </Button>

              <Button
                variant="ghost"
                href="/dashboard"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
