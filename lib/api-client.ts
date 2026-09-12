import type { Post } from './posts';

const BASE = '/api';

async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  signup: (body: { name: string; email: string; password: string }) =>
    request<{ user: any }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string; rememberMe?: boolean }) =>
    request<{ user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => request<{ user: any }>('/users/me'),

  updateMe: (body: { name?: string; bio?: string; avatar?: string }) =>
    request<{ user: any }>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  updateSettings: (body: {
    isPrivate?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) => request<{ success: boolean }>('/users/me/settings', { method: 'PATCH', body: JSON.stringify(body) }),

  deleteMe: () => request<{ success: boolean }>('/users/me', { method: 'DELETE' }),

  getMyPosts: () => request<{ posts: Post[] }>('/users/me/posts'),

  getUser: (id: string) => request<{ user: any }>(`/users/${id}`),

  followUser: (id: string) => request<{ following: boolean }>(`/users/${id}/follow`, { method: 'POST' }),

  getPosts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ posts: Post[] }>(`/posts${qs}`);
  },

  getPost: (id: string) => request<{ post: Post }>(`/posts/${id}`),

  createPost: (body: Record<string, unknown>) =>
    request<{ post: Post }>('/posts', { method: 'POST', body: JSON.stringify(body) }),

  updatePost: (id: string, body: Record<string, unknown>) =>
    request<{ post: Post }>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deletePost: (id: string) => request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),

  likePost: (id: string) => request<{ liked: boolean }>(`/posts/${id}/like`, { method: 'POST' }),

  bookmarkPost: (id: string) => request<{ bookmarked: boolean }>(`/posts/${id}/bookmark`, { method: 'POST' }),

  reactPost: (id: string, emoji: string) =>
    request<{ reactions: Record<string, number> }>(`/posts/${id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),

  getComments: (id: string) => request<{ comments: any[] }>(`/posts/${id}/comments`),

  addComment: (id: string, text: string) =>
    request<{ comment: any }>(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  likeComment: (commentId: string) =>
    request<{ liked: boolean }>(`/comments/${commentId}/like`, { method: 'POST' }),
};
