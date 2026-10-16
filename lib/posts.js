/**
 * Genres available to writers. These values are stored in `posts.category`,
 * so the strings must not change without a data migration — only their
 * presentation (in `lib/board.js`) does.
 */
export const categories = ['All', 'Technology', 'Design', 'Business', 'Personal', 'Photography'];

/** Every tag actually used by the given posts, most used first. */
export function tagsFromPosts(posts = []) {
  const counts = new Map();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

export function searchPosts(posts, query) {
  const lowerQuery = query.toLowerCase();
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(lowerQuery) ||
      post.excerpt.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery)
  );
}

export function filterByCategory(posts, category) {
  if (category === 'All') return posts;
  return posts.filter((post) => post.category === category);
}

export function filterByTags(posts, tags) {
  if (tags.length === 0) return posts;
  return posts.filter((post) => tags.some((tag) => post.tags.includes(tag)));
}

export function getPostById(posts, id) {
  return posts.find((post) => post.id === id);
}
