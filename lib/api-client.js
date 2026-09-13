const BASE = '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  signup: (body) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  changePassword: (body) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => request('/users/me'),

  updateMe: (body) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  updateSettings: (body) =>
    request('/users/me/settings', { method: 'PATCH', body: JSON.stringify(body) }),

  deleteMe: () => request('/users/me', { method: 'DELETE' }),

  getMyPosts: () => request('/users/me/posts'),

  getMyBookmarks: () => request('/users/me/bookmarks'),

  getUser: (id) => request(`/users/${id}`),

  followUser: (id) => request(`/users/${id}/follow`, { method: 'POST' }),

  getPosts: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/posts${qs}`);
  },

  getPost: (id) => request(`/posts/${id}`),

  createPost: (body) =>
    request('/posts', { method: 'POST', body: JSON.stringify(body) }),

  updatePost: (id, body) =>
    request(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),

  likePost: (id) => request(`/posts/${id}/like`, { method: 'POST' }),

  bookmarkPost: (id) => request(`/posts/${id}/bookmark`, { method: 'POST' }),

  getReactions: (id) => request(`/posts/${id}/reactions`),

  reactPost: (id, emoji) =>
    request(`/posts/${id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),

  getComments: (id) => request(`/posts/${id}/comments`),

  addComment: (id, text) =>
    request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  likeComment: (commentId) =>
    request(`/comments/${commentId}/like`, { method: 'POST' }),
};
