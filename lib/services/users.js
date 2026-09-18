import { query } from '../db';

export async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const { rows } = await query(
    'SELECT id, name, email, avatar, bio, is_private, email_notifications, push_notifications, is_superuser FROM users WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function createUser(name, email, passwordHash, avatar = '') {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, avatar)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, avatar, bio, is_private, email_notifications, push_notifications, is_superuser`,
    [name, email.toLowerCase(), passwordHash, avatar]
  );
  return rows[0];
}

export async function upsertGoogleUser(name, email, avatar = '') {
  const existing = await findUserByEmail(email);
  if (existing) {
    if (!existing.avatar && avatar) {
      await query('UPDATE users SET avatar = $2 WHERE id = $1', [existing.id, avatar]);
      existing.avatar = avatar;
    }
    return existing;
  }
  return createUser(name, email, null, avatar);
}

export async function getUserStats(userId) {
  try {
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*) FROM posts WHERE author_id = $1 AND status IN ('approved', 'published')) AS posts,
         (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.author_id = $1) AS likes,
         (SELECT COUNT(*) FROM follows WHERE following_id = $1) AS followers,
         (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following`,
      [userId]
    );
    const s = rows[0];
    return {
      posts: Number(s?.posts ?? 0),
      likes: Number(s?.likes ?? 0),
      followers: Number(s?.followers ?? 0),
      following: Number(s?.following ?? 0),
    };
  } catch (error) {
    console.warn('Error fetching user stats:', error instanceof Error ? error.message : 'Unknown error');
    return {
      posts: 0,
      likes: 0,
      followers: 0,
      following: 0,
    };
  }
}

export async function formatUser(userId) {
  const user = await findUserById(userId);
  if (!user) return null;
  const stats = await getUserStats(userId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    bio: user.bio || '',
    isPrivate: user.is_private,
    isSuperuser: Boolean(user.is_superuser),
    emailNotifications: user.email_notifications,
    pushNotifications: user.push_notifications,
    ...stats,
  };
}

export async function updateUser(userId, data) {
  const { rows } = await query(
    `UPDATE users SET
       name = COALESCE($2, name),
       bio = COALESCE($3, bio),
       avatar = COALESCE($4, avatar)
     WHERE id = $1
     RETURNING id, name, email, avatar, bio, is_private, email_notifications, push_notifications, is_superuser`,
    [userId, data.name ?? null, data.bio ?? null, data.avatar ?? null]
  );
  return rows[0] ?? null;
}

export async function updateUserSettings(userId, data) {
  const { rows } = await query(
    `UPDATE users SET
       is_private = COALESCE($2, is_private),
       email_notifications = COALESCE($3, email_notifications),
       push_notifications = COALESCE($4, push_notifications)
     WHERE id = $1
     RETURNING id, name, email, avatar, bio, is_private, email_notifications, push_notifications`,
    [
      userId,
      data.isPrivate ?? null,
      data.emailNotifications ?? null,
      data.pushNotifications ?? null,
    ]
  );
  return rows[0] ?? null;
}

export async function updatePassword(userId, passwordHash) {
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
}

export async function deleteUser(userId) {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}

export async function getAuthorProfile(authorId, viewerId) {
  const user = await findUserById(authorId);
  if (!user) return null;

  const stats = await getUserStats(authorId);
  let isFollowing = false;
  if (viewerId) {
    const { rows } = await query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [viewerId, authorId]
    );
    isFollowing = rows.length > 0;
  }

  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar || '',
    bio: user.bio || '',
    followers: stats.followers,
    following: stats.following,
    posts: stats.posts,
    isFollowing,
  };
}

export async function toggleFollow(followerId, followingId) {
  const { rows } = await query(
    'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  if (rows.length > 0) {
    await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [
      followerId,
      followingId,
    ]);
    return { following: false };
  }
  await query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [
    followerId,
    followingId,
  ]);
  return { following: true };
}
