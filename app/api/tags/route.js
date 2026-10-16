import { ok } from '@/lib/api-utils';
import { listTags } from '@/lib/services/posts';

export async function GET() {
  const tags = await listTags();
  return ok({ tags });
}
