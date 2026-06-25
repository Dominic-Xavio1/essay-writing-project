import { query } from '../db';

const POST_SELECT = `
  SELECT
    p.id, p.title, p.excerpt, p.content, p.featured_image, p.category,
    p.status, p.read_time, p.shares, p.created_at, p.updated_at, p.author_id,
    u.name AS author_name, u.avatar AS author_avatar, u.bio AS author_bio,
    (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS author_followers,
    (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) AS likes,
    (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) AS comments,
    (SELECT COUNT(*)::int FROM bookmarks WHERE post_id = p.id) AS bookmarks,
    COALESCE(
      (SELECT array_agg(tag ORDER BY tag) FROM post_tags WHERE post_id = p.id),
      '{}'
    ) AS tags
  FROM posts p
  JOIN users u ON p.author_id = u.id
`;

type DbPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category: string;
  status: string;
  read_time: number;
  shares: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_bio: string;
  author_followers: number;
  likes: number;
  comments: number;
  bookmarks: number;
  tags: string[];
};

export function mapPost(row: DbPost, extras?: { liked?: boolean; bookmarked?: boolean }) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    featured_image: row.featured_image || '',
    category: row.category,
    status: row.status,
    tags: row.tags || [],
    read_time: row.read_time,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    bookmarks: row.bookmarks,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: {
      id: row.author_id,
      name: row.author_name,
      avatar: row.author_avatar || '',
      bio: row.author_bio || '',
      followers: row.author_followers,
    },
    ...(extras?.liked !== undefined && { liked: extras.liked }),
    ...(extras?.bookmarked !== undefined && { bookmarked: extras.bookmarked }),
  };
}

export async function getPostById(id: string, viewerId?: string) {
  const { rows } = await query<DbPost>(`${POST_SELECT} WHERE p.id = $1`, [id]);
  const row = rows[0];
  if (!row) return null;

  let liked = false;
  let bookmarked = false;
  if (viewerId) {
    const [likeRes, bookmarkRes] = await Promise.all([
      query('SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2', [viewerId, id]),
      query('SELECT 1 FROM bookmarks WHERE user_id = $1 AND post_id = $2', [viewerId, id]),
    ]);
    liked = likeRes.rows.length > 0;
    bookmarked = bookmarkRes.rows.length > 0;
  }

  return mapPost(row, { liked, bookmarked });
}

export async function listPosts(opts: {
  search?: string;
  category?: string;
  tags?: string[];
  sort?: string;
  status?: string;
  authorId?: string;
  viewerId?: string;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  const status = opts.status ?? 'published';
  conditions.push(`p.status = $${i++}`);
  params.push(status);

  if (opts.authorId) {
    conditions.push(`p.author_id = $${i++}`);
    params.push(opts.authorId);
  }

  if (opts.category && opts.category !== 'All') {
    conditions.push(`p.category = $${i++}`);
    params.push(opts.category);
  }

  if (opts.search) {
    conditions.push(
      `(p.title ILIKE $${i} OR p.excerpt ILIKE $${i} OR p.content ILIKE $${i})`
    );
    params.push(`%${opts.search}%`);
    i++;
  }

  if (opts.tags?.length) {
    conditions.push(
      `EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag = ANY($${i++}))`
    );
    params.push(opts.tags);
  }

  const orderBy =
    opts.sort === 'trending'
      ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id) +
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id) + p.shares DESC`
      : 'p.created_at DESC';

  const { rows } = await query<DbPost>(
    `${POST_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy}`,
    params
  );

  return rows.map((row) => mapPost(row));
}

export async function createPost(
  authorId: string,
  data: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    featured_image?: string;
    tags?: string[];
    status: string;
    read_time: number;
  }
) {
  const { rows } = await query<{ id: string }>(
    `INSERT INTO posts (author_id, title, excerpt, content, category, featured_image, status, read_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      authorId,
      data.title,
      data.excerpt,
      data.content,
      data.category,
      data.featured_image || '',
      data.status,
      data.read_time,
    ]
  );
  const postId = rows[0].id;

  if (data.tags?.length) {
    for (const tag of data.tags) {
      await query('INSERT INTO post_tags (post_id, tag) VALUES ($1, $2)', [postId, tag]);
    }
  }

  return getPostById(postId);
}

export async function updatePost(
  postId: string,
  authorId: string,
  data: {
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    featured_image?: string;
    tags?: string[];
    status?: string;
    read_time?: number;
  }
) {
  const { rows: owned } = await query(
    'SELECT id FROM posts WHERE id = $1 AND author_id = $2',
    [postId, authorId]
  );
  if (!owned.length) return null;

  await query(
    `UPDATE posts SET
       title = COALESCE($3, title),
       excerpt = COALESCE($4, excerpt),
       content = COALESCE($5, content),
       category = COALESCE($6, category),
       featured_image = COALESCE($7, featured_image),
       status = COALESCE($8, status),
       read_time = COALESCE($9, read_time)
     WHERE id = $1 AND author_id = $2`,
    [
      postId,
      authorId,
      data.title ?? null,
      data.excerpt ?? null,
      data.content ?? null,
      data.category ?? null,
      data.featured_image ?? null,
      data.status ?? null,
      data.read_time ?? null,
    ]
  );

  if (data.tags) {
    await query('DELETE FROM post_tags WHERE post_id = $1', [postId]);
    for (const tag of data.tags) {
      await query('INSERT INTO post_tags (post_id, tag) VALUES ($1, $2)', [postId, tag]);
    }
  }

  return getPostById(postId);
}

export async function deletePost(postId: string, authorId: string) {
  const { rowCount } = await query(
    'DELETE FROM posts WHERE id = $1 AND author_id = $2',
    [postId, authorId]
  );
  return (rowCount ?? 0) > 0;
}

export async function toggleLike(userId: string, postId: string) {
  const { rows } = await query(
    'SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  if (rows.length > 0) {
    await query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    return { liked: false };
  }
  await query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
  return { liked: true };
}

export async function toggleBookmark(userId: string, postId: string) {
  const { rows } = await query(
    'SELECT 1 FROM bookmarks WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  if (rows.length > 0) {
    await query('DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    return { bookmarked: false };
  }
  await query('INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
  return { bookmarked: true };
}

export async function setReaction(userId: string, postId: string, emoji: string) {
  await query(
    `INSERT INTO reactions (user_id, post_id, emoji) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, post_id) DO UPDATE SET emoji = $3`,
    [userId, postId, emoji]
  );
  return { emoji };
}

export async function getComments(postId: string) {
  const { rows } = await query<{
    id: string;
    text: string;
    created_at: string;
    author_name: string;
    author_avatar: string;
    likes: number;
  }>(
    `SELECT c.id, c.text, c.created_at,
            u.name AS author_name, u.avatar AS author_avatar,
            (SELECT COUNT(*)::int FROM comment_likes WHERE comment_id = c.id) AS likes
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at DESC`,
    [postId]
  );
  return rows.map((r) => ({
    id: r.id,
    author: r.author_name,
    avatar: r.author_avatar || '',
    text: r.text,
    likes: r.likes,
    created_at: r.created_at,
  }));
}

export async function addComment(userId: string, postId: string, text: string) {
  const { rows } = await query<{ id: string }>(
    'INSERT INTO comments (post_id, user_id, text) VALUES ($1, $2, $3) RETURNING id',
    [postId, userId, text]
  );
  const comments = await getComments(postId);
  return comments.find((c) => c.id === rows[0].id);
}

export async function toggleCommentLike(userId: string, commentId: string) {
  const { rows } = await query(
    'SELECT 1 FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
    [userId, commentId]
  );
  if (rows.length > 0) {
    await query('DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [
      userId,
      commentId,
    ]);
    return { liked: false };
  }
  await query('INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)', [
    userId,
    commentId,
  ]);
  return { liked: true };
}

export async function getRelatedPosts(postId: string, category: string, limit = 3) {
  const { rows } = await query<DbPost>(
    `${POST_SELECT}
     WHERE p.status = 'published' AND p.category = $2 AND p.id != $1
     ORDER BY p.created_at DESC LIMIT $3`,
    [postId, category, limit]
  );
  return rows.map((row) => mapPost(row));
}
