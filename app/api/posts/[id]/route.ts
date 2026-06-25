import { ok, err, parseBody, calcReadTime } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';
import {
  getPostById,
  updatePost,
  deletePost,
  getRelatedPosts,
} from '@/lib/services/posts';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const viewerId = session.isLoggedIn ? session.userId : undefined;

  const post = await getPostById(id, viewerId);
  if (!post) return err('Post not found', 404);
  if (post.status === 'draft' && post.author.id !== viewerId) {
    return err('Post not found', 404);
  }

  const related = await getRelatedPosts(id, post.category);
  return ok({ post, related });
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const body = await parseBody<{
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    tags?: string[];
    featured_image?: string;
    status?: string;
  }>(req);
  if (!body) return err('Invalid request body');

  const read_time = body.content ? calcReadTime(body.content) : undefined;
  const post = await updatePost(id, userId, { ...body, read_time });
  if (!post) return err('Post not found or unauthorized', 404);

  return ok({ post });
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  const deleted = await deletePost(id, userId);
  if (!deleted) return err('Post not found or unauthorized', 404);

  return ok({ success: true });
}
