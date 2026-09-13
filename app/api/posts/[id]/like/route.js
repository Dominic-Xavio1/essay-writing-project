import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { toggleLike } from '@/lib/services/posts';

export async function POST(_req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const result = await toggleLike(userId, id);
  return ok(result);
}
