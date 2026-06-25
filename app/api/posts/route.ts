import { ok, err, parseBody, calcReadTime } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { listPosts, createPost } from '@/lib/services/posts';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = await getSession();
  const viewerId = session.isLoggedIn ? session.userId : undefined;

  const tags = searchParams.get('tags');
  const posts = await listPosts({
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    tags: tags ? tags.split(',') : undefined,
    sort: searchParams.get('sort') || 'recent',
    viewerId,
  });

  return ok({ posts });
}

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const body = await parseBody<{
    title: string;
    excerpt: string;
    content: string;
    category: string;
    tags?: string[];
    featured_image?: string;
    status?: string;
  }>(req);

  if (!body?.title) return err('Title is required');

  const status = body.status === 'draft' ? 'draft' : 'published';
  if (status === 'published' && (!body.excerpt || !body.content)) {
    return err('Excerpt and content are required to publish');
  }

  const post = await createPost(userId, {
    title: body.title,
    excerpt: body.excerpt || '',
    content: body.content || '',
    category: body.category || 'Personal',
    featured_image: body.featured_image,
    tags: body.tags,
    status,
    read_time: calcReadTime(body.content || ''),
  });

  return ok({ post }, 201);
}
