import { ok, err, parseBody, isValidUUID } from '@/lib/api-utils';
import { requireSuperuser } from '@/lib/auth';
import { moderatePost } from '@/lib/services/posts';

export async function PATCH(req, { params }) {
  const superuser = await requireSuperuser();
  if (!superuser) return err('Forbidden: Superuser access required', 403);

  const { id } = await params;
  if (!isValidUUID(id)) return err('Invalid ID format', 400);

  const body = await parseBody(req);
  if (!body) return err('Invalid request body', 400);

  const status = body?.status;
  const feedback = body?.feedback || '';

  if (!['approved', 'rejected', 'pending', 'draft'].includes(status)) {
    return err('Invalid status. Expected approved, rejected, pending, or draft.', 400);
  }

  const post = await moderatePost(id, status, feedback);
  if (!post) return err('Post not found', 404);

  return ok({ post, success: true });
}
