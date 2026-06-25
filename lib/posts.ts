export interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: Author;
  featured_image: string;
  created_at: Date;
  updated_at: Date;
  category: string;
  tags: string[];
  read_time: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

const authors: Record<string, Author> = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Design thinker and writer exploring the intersection of technology and humanity.',
    followers: 2341
  },
  '2': {
    id: '2',
    name: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Tech writer passionate about AI, startups, and the future of work.',
    followers: 5234
  },
  '3': {
    id: '3',
    name: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'Business strategist and founder writing about entrepreneurship and growth.',
    followers: 3421
  }
};

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'The Future of Remote Work: What We\'ve Learned in 2024',
    excerpt: 'A comprehensive analysis of how remote work has transformed our workplace culture and what comes next.',
    content: 'Remote work has fundamentally changed how we think about productivity, collaboration, and work-life balance. In this essay, we explore the major lessons learned...',
    author: authors['1'],
    featured_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    created_at: new Date('2024-05-15'),
    updated_at: new Date('2024-05-15'),
    category: 'Technology',
    tags: ['remote-work', 'productivity', 'workplace'],
    read_time: 8,
    likes: 342,
    comments: 45,
    shares: 123,
    bookmarks: 89
  },
  {
    id: '2',
    title: 'Design Thinking in the Age of AI',
    excerpt: 'How artificial intelligence is reshaping design principles and what designers need to know.',
    content: 'As AI becomes more prevalent in our tools and workflows, designers must adapt their approach...',
    author: authors['1'],
    featured_image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    created_at: new Date('2024-05-10'),
    updated_at: new Date('2024-05-10'),
    category: 'Design',
    tags: ['ai', 'design', 'innovation'],
    read_time: 6,
    likes: 512,
    comments: 67,
    shares: 234,
    bookmarks: 156
  },
  {
    id: '3',
    title: 'Building Your First Startup: A Practical Guide',
    excerpt: 'Everything you need to know before launching your next big idea.',
    content: 'Starting a company is one of the most challenging yet rewarding experiences. Here\'s what we\'ve learned...',
    author: authors['3'],
    featured_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    created_at: new Date('2024-05-08'),
    updated_at: new Date('2024-05-08'),
    category: 'Business',
    tags: ['startup', 'entrepreneurship', 'guide'],
    read_time: 12,
    likes: 623,
    comments: 89,
    shares: 345,
    bookmarks: 234
  },
  {
    id: '4',
    title: 'The Art of Minimalist Writing',
    excerpt: 'Less is more: How to craft compelling narratives with fewer words.',
    content: 'Minimalist writing is about removing everything unnecessary to reveal what\'s essential...',
    author: authors['2'],
    featured_image: 'https://images.unsplash.com/photo-1455390883262-eea440f8e8f0?w=800&h=400&fit=crop',
    created_at: new Date('2024-05-05'),
    updated_at: new Date('2024-05-05'),
    category: 'Personal',
    tags: ['writing', 'minimalism', 'craft'],
    read_time: 5,
    likes: 445,
    comments: 52,
    shares: 167,
    bookmarks: 123
  },
  {
    id: '5',
    title: 'Photography in the Digital Age',
    excerpt: 'How smartphones changed photography forever and what it means for professional photographers.',
    content: 'The democratization of photography has been one of the most significant shifts in visual media...',
    author: authors['2'],
    featured_image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=400&fit=crop',
    created_at: new Date('2024-05-01'),
    updated_at: new Date('2024-05-01'),
    category: 'Photography',
    tags: ['photography', 'digital', 'culture'],
    read_time: 7,
    likes: 567,
    comments: 78,
    shares: 289,
    bookmarks: 198
  }
];

export const categories = ['All', 'Technology', 'Design', 'Business', 'Personal', 'Photography'];

export const allTags = ['ai', 'design', 'remote-work', 'startup', 'productivity', 'innovation', 'entrepreneurship', 'writing', 'minimalism', 'photography', 'digital', 'culture', 'workplace', 'guide', 'craft'];

export function searchPosts(posts: Post[], query: string): Post[] {
  const lowerQuery = query.toLowerCase();
  return posts.filter(post =>
    post.title.toLowerCase().includes(lowerQuery) ||
    post.excerpt.toLowerCase().includes(lowerQuery) ||
    post.content.toLowerCase().includes(lowerQuery)
  );
}

export function filterByCategory(posts: Post[], category: string): Post[] {
  if (category === 'All') return posts;
  return posts.filter(post => post.category === category);
}

export function filterByTags(posts: Post[], tags: string[]): Post[] {
  if (tags.length === 0) return posts;
  return posts.filter(post =>
    tags.some(tag => post.tags.includes(tag))
  );
}

export function getTrendingPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares));
}

export function getRecentPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export function getPostById(posts: Post[], id: string): Post | undefined {
  return posts.find(post => post.id === id);
}
