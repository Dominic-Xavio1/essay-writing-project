import { ok, err, isValidUUID } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { toggleFollow } from '@/lib/services/users';

export async function POST(_req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  if (!isValidUUID(id)) return err('Invalid ID format', 400);
  if (id === userId) return err('Cannot follow yourself', 400);

  const result = await toggleFollow(userId, id);
  return ok(result);
}
