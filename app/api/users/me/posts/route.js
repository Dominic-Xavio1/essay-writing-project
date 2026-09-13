import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { listPosts } from '@/lib/services/posts';

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const posts = await listPosts({ authorId: userId, status: 'published', viewerId: userId });
  const drafts = await listPosts({ authorId: userId, status: 'draft', viewerId: userId });
  return ok({ posts: [...posts, ...drafts] });
}
