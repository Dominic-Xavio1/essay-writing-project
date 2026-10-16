import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { listPosts } from '@/lib/services/posts';

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  // Authors see every one of their own posts, whatever the stage: published,
  // awaiting a mentor, returned for revision, rejected or still a draft.
  const posts = await listPosts({ authorId: userId, status: 'all', viewerId: userId });
  return ok({ posts });
}
