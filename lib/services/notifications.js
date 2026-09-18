import { query } from '../db';

export async function createNotification(userId, title, message, type = 'info', link = '') {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, title, message, type, link]
  );
  return rows[0];
}

export async function notifySuperusersOnNewPost(postTitle, postId) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       SELECT id, 'Post Moderation Required', $1, 'moderation', '/dashboard/admin'
       FROM users WHERE is_superuser = true`,
      [`New post pending review: "${postTitle}"`]
    );
  } catch (err) {
    console.error('Error notifying superusers:', err);
  }
}

export async function notifyAuthorOnModeration(authorId, postTitle, status) {
  try {
    const isApproved = status === 'approved' || status === 'published';
    const title = isApproved ? 'Post Approved! 🎉' : 'Post Moderation Update ⚠️';
    const message = isApproved
      ? `Your essay "${postTitle}" has been approved and is now live on Explore.`
      : `Your essay "${postTitle}" was not approved during moderation.`;
    const type = isApproved ? 'success' : 'warning';
    const link = isApproved ? `/posts` : `/dashboard`;

    await createNotification(authorId, title, message, type, link);
  } catch (err) {
    console.error('Error notifying author on moderation:', err);
  }
}

export async function getUserNotifications(userId) {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

export async function markNotificationRead(id, userId) {
  await query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}

export async function markAllNotificationsRead(userId) {
  await query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1`,
    [userId]
  );
}
