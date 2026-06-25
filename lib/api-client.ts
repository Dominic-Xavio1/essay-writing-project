const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
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
    request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string; rememberMe?: boolean }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => request('/users/me'),

  updateMe: (body: { name?: string; bio?: string; avatar?: string }) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  updateSettings: (body: {
    isPrivate?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) => request('/users/me/settings', { method: 'PATCH', body: JSON.stringify(body) }),

  deleteMe: () => request('/users/me', { method: 'DELETE' }),

  getMyPosts: () => request('/users/me/posts'),

  getUser: (id: string) => request(`/users/${id}`),

  followUser: (id: string) => request(`/users/${id}/follow`, { method: 'POST' }),

  getPosts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/posts${qs}`);
  },

  getPost: (id: string) => request(`/posts/${id}`),

  createPost: (body: Record<string, unknown>) =>
    request('/posts', { method: 'POST', body: JSON.stringify(body) }),

  updatePost: (id: string, body: Record<string, unknown>) =>
    request(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deletePost: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),

  likePost: (id: string) => request(`/posts/${id}/like`, { method: 'POST' }),

  bookmarkPost: (id: string) => request(`/posts/${id}/bookmark`, { method: 'POST' }),

  reactPost: (id: string, emoji: string) =>
    request(`/posts/${id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),

  getComments: (id: string) => request(`/posts/${id}/comments`),

  addComment: (id: string, text: string) =>
    request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  likeComment: (commentId: string) =>
    request(`/comments/${commentId}/like`, { method: 'POST' }),
};
