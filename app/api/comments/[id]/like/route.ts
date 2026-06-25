import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { toggleCommentLike } from '@/lib/services/posts';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const result = await toggleCommentLike(userId, id);
  return ok(result);
}
