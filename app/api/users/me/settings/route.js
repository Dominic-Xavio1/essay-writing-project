import { ok, err, parseBody } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { updateUserSettings, formatUser } from '@/lib/services/users';

export async function PATCH(req) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const body = await parseBody(req);
  if (!body) return err('Invalid request body');

  await updateUserSettings(userId, body);
  const user = await formatUser(userId);
  return ok({ user });
}
