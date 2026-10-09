import { ok, err, isValidUUID } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { markNotificationRead } from '@/lib/services/notifications';

export async function PATCH(req, { params }) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const { id } = await params;
  if (!isValidUUID(id)) return err('Invalid ID format', 400);

  await markNotificationRead(id, userId);
  return ok({ success: true });
}
