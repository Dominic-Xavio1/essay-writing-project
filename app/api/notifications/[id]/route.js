import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { markNotificationRead } from '@/lib/services/notifications';

export async function PATCH(req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  await markNotificationRead(id, userId);
  return ok({ success: true });
}
