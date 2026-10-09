import { query } from '../db';
import { notifySuperusersOnNewPost, notifyAuthorOnModeration } from './notifications';
import { findUserById } from './users';
import { sanitizeHtml } from '../sanitize';

const POST_SELECT = `
  SELECT
    p.id, p.title, p.excerpt, p.content, p.featured_image, p.category,
    p.status, p.feedback, p.read_time, p.shares, p.created_at, p.updated_at, p.author_id,
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

export function mapPost(row, extras) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    featured_image: row.featured_image || '',
    category: row.category,
    status: row.status,
    feedback: row.feedback || '',
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

export async function isPostPublished(postId) {
  const { rows } = await query('SELECT status FROM posts WHERE id = $1', [postId]);
  if (!rows.length) return false;
  return rows[0].status === 'approved' || rows[0].status === 'published';
}

export async function getPostById(id, viewerId) {
  const { rows } = await query(`${POST_SELECT} WHERE p.id = $1`, [id]);
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

export async function listPosts(opts = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  const status = opts.status ?? 'approved';
  if (status === 'approved' || status === 'published') {
    conditions.push(`p.status IN ('approved', 'published')`);
  } else if (status !== 'all') {
    conditions.push(`p.status = $${i++}`);
    params.push(status);
  }

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

  if (opts.bookmarkedBy) {
    conditions.push(
      `EXISTS (SELECT 1 FROM bookmarks bm WHERE bm.post_id = p.id AND bm.user_id = $${i++})`
    );
    params.push(opts.bookmarkedBy);
  }

  if (opts.followingOf) {
    conditions.push(
      `EXISTS (SELECT 1 FROM follows f WHERE f.following_id = p.author_id AND f.follower_id = $${i++})`
    );
    params.push(opts.followingOf);
  }

  const orderBy =
    opts.sort === 'trending'
      ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id) +
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id) + p.shares DESC`
      : opts.sort === 'most_liked'
      ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id) DESC`
      : 'p.created_at DESC';

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `${POST_SELECT} ${whereClause} ORDER BY ${orderBy}`,
    params
  );

  let userLikedSet = new Set();
  let userBookmarkedSet = new Set();

  if (opts.viewerId && rows.length > 0) {
    const postIds = rows.map((r) => r.id);
    const [likesRes, bookmarksRes] = await Promise.all([
      query(
        'SELECT post_id FROM likes WHERE user_id = $1 AND post_id = ANY($2)',
        [opts.viewerId, postIds]
      ),
      query(
        'SELECT post_id FROM bookmarks WHERE user_id = $1 AND post_id = ANY($2)',
        [opts.viewerId, postIds]
      ),
    ]);
    userLikedSet = new Set(likesRes.rows.map((r) => r.post_id));
    userBookmarkedSet = new Set(bookmarksRes.rows.map((r) => r.post_id));
  }

  return rows.map((row) =>
    mapPost(row, {
      liked: userLikedSet.has(row.id),
      bookmarked: userBookmarkedSet.has(row.id),
    })
  );
}

export async function listBookmarkedPosts(userId) {
  return listPosts({ bookmarkedBy: userId, viewerId: userId, status: 'approved' });
}

export async function createPost(authorId, data) {
  let initialStatus = data.status;
  if (initialStatus !== 'draft') {
    const author = await findUserById(authorId);
    initialStatus = author?.is_superuser ? 'approved' : 'pending';
  }

  const cleanContent = sanitizeHtml(data.content || '');

  const { rows } = await query(
    `INSERT INTO posts (author_id, title, excerpt, content, category, featured_image, status, read_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      authorId,
      data.title,
      data.excerpt || '',
      cleanContent,
      data.category || 'Personal',
      data.featured_image || '',
      initialStatus,
      data.read_time || 1,
    ]
  );
  const postId = rows[0].id;

  if (data.tags?.length) {
    const cleanTags = Array.from(
      new Set(data.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))
    );
    for (const tag of cleanTags) {
      await query(
        'INSERT INTO post_tags (post_id, tag) VALUES ($1, $2) ON CONFLICT (post_id, tag) DO NOTHING',
        [postId, tag]
      );
    }
  }

  const newPost = await getPostById(postId, authorId);

  if (initialStatus === 'pending') {
    await notifySuperusersOnNewPost(data.title, postId, newPost);
  }

  return newPost;
}

export async function moderatePost(postId, newStatus, feedback = '') {
  const targetStatus = (newStatus === 'rejected' && feedback) ? 'draft' : newStatus;
  
  const { rows } = await query(
    `UPDATE posts SET status = $2, feedback = $3 WHERE id = $1 RETURNING author_id, title`,
    [postId, targetStatus, feedback]
  );
  if (!rows.length) return null;
  await notifyAuthorOnModeration(rows[0].author_id, rows[0].title, targetStatus, feedback);
  const updated = await getPostById(postId);
  try {
    const { broadcastWS } = await import('../ws-server');
    broadcastWS('POST_MODERATED', { postId, status: targetStatus, feedback }, rows[0].author_id);
  } catch (err) {
    console.error('WS error:', err);
  }
  return updated;
}

export async function updatePost(postId, authorId, data) {
  const { rows: owned } = await query(
    'SELECT status FROM posts WHERE id = $1 AND author_id = $2',
    [postId, authorId]
  );
  if (!owned.length) return null;

  const author = await findUserById(authorId);
  const isSuperuser = Boolean(author?.is_superuser);

  // Issue 2: Require reapproval whenever non-superuser edits an approved/published/pending post unless saving as draft
  let targetStatus;
  if (data.status === 'draft') {
    targetStatus = 'draft';
  } else if (!isSuperuser) {
    targetStatus = 'pending';
  } else {
    targetStatus = data.status || owned[0].status;
  }

  const cleanContent = data.content !== undefined ? sanitizeHtml(data.content) : undefined;

  await query(
    `UPDATE posts SET
       title = COALESCE($3, title),
       excerpt = COALESCE($4, excerpt),
       content = COALESCE($5, content),
       category = COALESCE($6, category),
       featured_image = COALESCE($7, featured_image),
       status = $8,
       read_time = COALESCE($9, read_time)
     WHERE id = $1 AND author_id = $2`,
    [
      postId,
      authorId,
      data.title ?? null,
      data.excerpt ?? null,
      cleanContent ?? null,
      data.category ?? null,
      data.featured_image ?? null,
      targetStatus,
      data.read_time ?? null,
    ]
  );

  if (data.tags) {
    await query('DELETE FROM post_tags WHERE post_id = $1', [postId]);
    const cleanTags = Array.from(
      new Set(data.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))
    );
    for (const tag of cleanTags) {
      await query(
        'INSERT INTO post_tags (post_id, tag) VALUES ($1, $2) ON CONFLICT (post_id, tag) DO NOTHING',
        [postId, tag]
      );
    }
  }

  const updatedPost = await getPostById(postId, authorId);
  if (targetStatus === 'pending') {
    await notifySuperusersOnNewPost(updatedPost.title, postId, updatedPost);
  }

  return updatedPost;
}

export async function deletePost(postId, authorId) {
  const { rowCount } = await query(
    'DELETE FROM posts WHERE id = $1 AND author_id = $2',
    [postId, authorId]
  );
  return (rowCount ?? 0) > 0;
}

export async function toggleLike(userId, postId) {
  const published = await isPostPublished(postId);
  if (!published) return { error: 'Post not found or interaction not allowed', code: 404 };

  const { rows } = await query(
    'SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  if (rows.length > 0) {
    await query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    return { liked: false };
  }
  await query(
    'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING',
    [userId, postId]
  );
  return { liked: true };
}

export async function toggleBookmark(userId, postId) {
  const published = await isPostPublished(postId);
  if (!published) return { error: 'Post not found or interaction not allowed', code: 404 };

  const { rows } = await query(
    'SELECT 1 FROM bookmarks WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  if (rows.length > 0) {
    await query('DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    return { bookmarked: false };
  }
  await query(
    'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING',
    [userId, postId]
  );
  return { bookmarked: true };
}

export async function getPostReactions(postId, viewerId) {
  const { rows } = await query(
    `SELECT emoji, COUNT(*)::int AS count
     FROM reactions
     WHERE post_id = $1
     GROUP BY emoji
     ORDER BY count DESC`,
    [postId]
  );

  let userReaction = null;
  if (viewerId) {
    const { rows: uRows } = await query(
      `SELECT emoji FROM reactions WHERE user_id = $1 AND post_id = $2`,
      [viewerId, postId]
    );
    if (uRows.length > 0) userReaction = uRows[0].emoji;
  }
  return { reactions: rows, userReaction };
}

export async function setReaction(userId, postId, emoji) {
  if (!emoji || typeof emoji !== 'string' || emoji.length > 10) {
    return { error: 'Emoji must not exceed 10 characters', code: 400 };
  }

  const published = await isPostPublished(postId);
  if (!published) return { error: 'Post not found or interaction not allowed', code: 404 };

  const { rows } = await query(
    `SELECT emoji FROM reactions WHERE user_id = $1 AND post_id = $2`,
    [userId, postId]
  );
  if (rows.length > 0 && rows[0].emoji === emoji) {
    await query(`DELETE FROM reactions WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
    return { emoji: null, removed: true };
  }
  await query(
    `INSERT INTO reactions (user_id, post_id, emoji) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, post_id) DO UPDATE SET emoji = $3`,
    [userId, postId, emoji]
  );
  return { emoji, removed: false };
}

export async function getComments(postId, viewerId) {
  const { rows } = await query(
    `SELECT c.id, c.text, c.created_at, c.user_id, c.parent_id,
            u.name AS author_name, u.avatar AS author_avatar,
            (SELECT COUNT(*)::int FROM comment_likes WHERE comment_id = c.id) AS likes,
            ${
              viewerId
                ? `EXISTS (SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) AS liked_by_viewer`
                : 'false AS liked_by_viewer'
            }
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    viewerId ? [postId, viewerId] : [postId]
  );
  return rows.map((r) => ({
    id: r.id,
    author: r.author_name,
    avatar: r.author_avatar || '',
    text: r.text,
    parentId: r.parent_id || null,
    likes: r.likes,
    likedByViewer: Boolean(r.liked_by_viewer),
    created_at: r.created_at,
  }));
}

export async function addComment(userId, postId, text, parentId = null) {
  const published = await isPostPublished(postId);
  if (!published) return { error: 'Post not found or interaction not allowed', code: 404 };

  const { rows } = await query(
    'INSERT INTO comments (post_id, user_id, text, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [postId, userId, text, parentId]
  );
  const comments = await getComments(postId, userId);
  return comments.find((c) => c.id === rows[0].id);
}

export async function toggleCommentLike(userId, commentId) {
  const { rows: cRows } = await query('SELECT post_id FROM comments WHERE id = $1', [commentId]);
  if (!cRows.length) return { error: 'Comment not found', code: 404 };
  const published = await isPostPublished(cRows[0].post_id);
  if (!published) return { error: 'Post not found or interaction not allowed', code: 404 };

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
  await query(
    'INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT (user_id, comment_id) DO NOTHING',
    [userId, commentId]
  );
  return { liked: true };
}

export async function getRelatedPosts(postId, category, limit = 3) {
  const { rows } = await query(
    `${POST_SELECT}
     WHERE p.status = 'published' AND p.category = $2 AND p.id != $1
     ORDER BY p.created_at DESC LIMIT $3`,
    [postId, category, limit]
  );
  return rows.map((row) => mapPost(row));
}
