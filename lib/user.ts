export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
}

export const currentUser: User = {
  id: 'user-1',
  name: 'You',
  email: 'user@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  bio: 'Passionate writer sharing insights on life, technology, and creativity.',
  followers: 234,
  following: 567,
  posts: 12,
  likes: 3450
};

export const mockAuthUser = {
  email: 'user@example.com',
  password: 'password123'
};
