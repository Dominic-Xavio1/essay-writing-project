import { ok, err, parseBody, isValidUUID } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { isPostPublished } from '@/lib/services/posts';

export async function POST(req, { params }) {
  const resolvedParams = await params;
  const postId = resolvedParams?.id;
  if (!postId || !isValidUUID(postId)) return err('Valid Post ID required', 400);

  const published = await isPostPublished(postId);
  if (!published) return err('Post not found or unavailable', 404);

  const userId = await requireAuth();
  const body = (await parseBody(req)) || {};

  const sessionId = body.sessionId || `session_${Math.random().toString(36).substring(2, 10)}`;
  const readDuration = Math.min(86400, Math.max(0, Number(body.readDuration) || 5));
  const scrollDepth = Math.min(100, Math.max(0, Number(body.scrollDepth) || 0));

  try {
    const { rows } = await query(
      `SELECT id, read_duration, scroll_depth FROM post_reads 
       WHERE post_id = $1 AND (session_id = $2 OR (user_id IS NOT NULL AND user_id = $3))
       ORDER BY created_at DESC LIMIT 1`,
      [postId, sessionId, userId]
    );

    if (rows.length > 0) {
      const existing = rows[0];
      const newDuration = Math.max(existing.read_duration, readDuration);
      const newDepth = Math.max(existing.scroll_depth, scrollDepth);

      await query(
        `UPDATE post_reads SET read_duration = $2, scroll_depth = $3 WHERE id = $1`,
        [existing.id, newDuration, newDepth]
      );
      return ok({ updated: true, readDuration: newDuration, scrollDepth: newDepth });
    } else {
      await query(
        `INSERT INTO post_reads (post_id, user_id, session_id, read_duration, scroll_depth)
         VALUES ($1, $2, $3, $4, $5)`,
        [postId, userId, sessionId, readDuration, scrollDepth]
      );
      return ok({ recorded: true, readDuration, scrollDepth });
    }
  } catch (error) {
    console.error('Error recording post read:', error);
    return err('Failed to record read analytics', 500);
  }
}
