import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { getUserNotifications, markAllNotificationsRead } from '@/lib/services/notifications';

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const notifications = await getUserNotifications(userId);
  return ok({ notifications });
}

export async function PATCH() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  await markAllNotificationsRead(userId);
  return ok({ success: true });
}
