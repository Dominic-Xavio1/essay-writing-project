import { ok, err } from '@/lib/api-utils';
import { getAuthorProfile } from '@/lib/services/users';
import { getSession } from '@/lib/session';
import { listPosts } from '@/lib/services/posts';

export async function GET(_req, { params }) {
  const { id } = await params;
  const session = await getSession();
  const viewerId = session.isLoggedIn ? session.userId : undefined;

  const profile = await getAuthorProfile(id, viewerId);
  if (!profile) return err('User not found', 404);

  const posts = await listPosts({ authorId: id, status: 'published', viewerId });
  return ok({ user: profile, posts });
}
