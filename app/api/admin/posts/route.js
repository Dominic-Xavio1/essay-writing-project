import { ok, err } from '@/lib/api-utils';
import { requireSuperuser } from '@/lib/auth';
import { listPosts } from '@/lib/services/posts';

export async function GET(req) {
  const superuser = await requireSuperuser();
  if (!superuser) return err('Forbidden: Superuser access required', 403);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  const posts = await listPosts({
    status,
    viewerId: superuser.id,
  });

  return ok({ posts });
}
