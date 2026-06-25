import { ok, err, parseBody } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getComments, addComment } from '@/lib/services/posts';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const comments = await getComments(id);
  return ok({ comments });
}

export async function POST(req: Request, { params }: Params) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const body = await parseBody<{ text: string }>(req);
  if (!body?.text?.trim()) return err('Comment text is required');

  const comment = await addComment(userId, id, body.text.trim());
  return ok({ comment }, 201);
}
