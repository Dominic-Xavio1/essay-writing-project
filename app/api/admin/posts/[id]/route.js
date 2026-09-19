import { ok, err, parseBody } from '@/lib/api-utils';
import { requireSuperuser } from '@/lib/auth';
import { moderatePost } from '@/lib/services/posts';

export async function PATCH(req, { params }) {
  const superuser = await requireSuperuser();
  if (!superuser) return err('Forbidden: Superuser access required', 403);

  const { id } = await params;
  const body = await parseBody(req);
  const status = body?.status;
  const feedback = body?.feedback || '';

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return err('Invalid status. Expected approved, rejected, or pending.');
  }

  const post = await moderatePost(id, status, feedback);
  if (!post) return err('Post not found', 404);

  return ok({ post, success: true });
}
