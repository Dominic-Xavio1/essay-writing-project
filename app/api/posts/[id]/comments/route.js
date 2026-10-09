import { ok, err, parseBody, isValidUUID } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { getComments, addComment, getPostById } from '@/lib/services/posts';

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

  const comments = await getComments(id, viewerId);
  return ok({ comments });
}

export async function POST(req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  if (!isValidUUID(id)) return err('Invalid ID format', 400);

  const body = await parseBody(req);
  if (!body) return err('Invalid request body', 400);

  if (!body?.text?.trim()) return err('Comment text is required', 400);

  const comment = await addComment(userId, id, body.text.trim(), body?.parentId || null);
  if (comment?.error) {
    return err(comment.error, comment.code || 400);
  }
  return ok({ comment }, 201);
}
