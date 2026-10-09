import { ok, err, parseBody, isValidUUID } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { setReaction, getPostReactions, getPostById } from '@/lib/services/posts';

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!isValidUUID(id)) return err('Invalid ID format', 400);

  const session = await getSession();
  const viewerId = session.isLoggedIn ? session.userId : undefined;
  const isSuperuser = Boolean(session.is_superuser);

  const post = await getPostById(id, viewerId);
  if (!post) return err('Post not found', 404);

  const isPublic = post.status === 'approved' || post.status === 'published';
  const isAuthor = viewerId && post.author.id === viewerId;

  if (!isPublic && !isAuthor && !isSuperuser) {
    return err('Post not found', 404);
  }

  const data = await getPostReactions(id, viewerId);
  return ok(data);
}

export async function POST(req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  if (!isValidUUID(id)) return err('Invalid ID format', 400);

  const body = await parseBody(req);
  if (!body) return err('Invalid request body', 400);

  if (!body?.emoji) return err('Emoji is required', 400);

  if (typeof body.emoji !== 'string' || body.emoji.length > 10) {
    return err('Emoji must not exceed 10 characters', 400);
  }

  const result = await setReaction(userId, id, body.emoji);
  if (result.error) {
    return err(result.error, result.code || 400);
  }

  const summary = await getPostReactions(id, userId);
  return ok({ ...result, ...summary });
}
