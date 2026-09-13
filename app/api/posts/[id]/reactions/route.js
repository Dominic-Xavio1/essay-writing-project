import { ok, err, parseBody } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { setReaction, getPostReactions } from '@/lib/services/posts';

export async function GET(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  const viewerId = session.isLoggedIn ? session.userId : undefined;
  const data = await getPostReactions(id, viewerId);
  return ok(data);
}

export async function POST(req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const body = await parseBody(req);
  if (!body?.emoji) return err('Emoji is required');

  const result = await setReaction(userId, id, body.emoji);
  const summary = await getPostReactions(id, userId);
  return ok({ ...result, ...summary });
}

