import { query } from '../db';
import { broadcastWS } from '../ws-server';

export async function createNotification(userId, title, message, type = 'info', link = '') {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, title, message, type, link]
  );
  const notif = rows[0];
  try {
    broadcastWS('NOTIFICATION', notif, userId);
  } catch (err) {
    console.error('WS broadcast error:', err);
  }
  return notif;
}

export async function notifySuperusersOnNewPost(postTitle, postId, postObj = null) {
  try {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       SELECT id, 'Post Moderation Required', $1, 'moderation', '/dashboard/admin'
       FROM users WHERE is_superuser = true
       RETURNING *`,
      [`New post pending review: "${postTitle}"`]
    );

    try {
      broadcastWS('NEW_PENDING_POST', { postId, postTitle, post: postObj });
      for (const notif of rows) {
        broadcastWS('NOTIFICATION', notif, notif.user_id);
      }
    } catch (err) {
      console.error('WS broadcast error:', err);
    }
  } catch (err) {
    console.error('Error notifying superusers:', err);
  }
}

export async function notifyAuthorOnModeration(authorId, postTitle, status, feedback = '') {
  try {
    const isApproved = status === 'approved' || status === 'published';
    const title = isApproved
      ? 'Post Approved! 🎉'
      : feedback
      ? 'Superuser Feedback & Review Update 💬'
      : 'Post Moderation Update ⚠️';
    const message = isApproved
      ? `Your essay "${postTitle}" has been approved and is now live on Explore.`
      : feedback
      ? `Feedback on "${postTitle}": ${feedback}`
      : `Your essay "${postTitle}" was not approved during moderation.`;
    const type = isApproved ? 'success' : 'warning';
    const link = isApproved ? `/posts` : `/dashboard`;

    const notif = await createNotification(authorId, title, message, type, link);
    if (feedback) {
      try {
        broadcastWS('SUPERUSER_FEEDBACK', { authorId, postTitle, feedback, notif }, authorId);
      } catch (err) {
        console.error('WS broadcast error:', err);
      }
    }
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
