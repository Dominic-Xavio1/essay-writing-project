import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { toggleFollow } from '@/lib/services/users';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  if (id === userId) return err('Cannot follow yourself');

  const result = await toggleFollow(userId, id);
  return ok(result);
}
