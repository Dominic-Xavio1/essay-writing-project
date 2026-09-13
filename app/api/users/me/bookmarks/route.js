import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { listBookmarkedPosts } from '@/lib/services/posts';

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const posts = await listBookmarkedPosts(userId);
  return ok({ posts });
}
