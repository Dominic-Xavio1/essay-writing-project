import { ok, err, isValidUUID } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { toggleBookmark } from '@/lib/services/posts';

export async function POST(_req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  if (!isValidUUID(id)) return err('Invalid ID format', 400);

  const result = await toggleBookmark(userId, id);
  if (result.error) {
    return err(result.error, result.code || 400);
  }
  return ok(result);
}
