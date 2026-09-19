import { ok, err, parseBody } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { getComments, addComment } from '@/lib/services/posts';

export async function GET(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  const viewerId = session.isLoggedIn ? session.userId : undefined;
  const comments = await getComments(id, viewerId);
  return ok({ comments });
}

export async function POST(req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const body = await parseBody(req);
  if (!body?.text?.trim()) return err('Comment text is required');

  const comment = await addComment(userId, id, body.text.trim(), body?.parentId || null);
  return ok({ comment }, 201);
}
