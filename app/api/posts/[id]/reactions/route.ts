import { ok, err, parseBody } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { setReaction } from '@/lib/services/posts';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const body = await parseBody<{ emoji: string }>(req);
  if (!body?.emoji) return err('Emoji is required');

  const result = await setReaction(userId, id, body.emoji);
  return ok(result);
}
