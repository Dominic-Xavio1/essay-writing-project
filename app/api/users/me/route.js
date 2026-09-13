import { ok, err, parseBody } from '@/lib/api-utils';
import { requireAuth, logoutUser } from '@/lib/auth';
import { formatUser, updateUser, deleteUser } from '@/lib/services/users';

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);
  const user = await formatUser(userId);
  return ok({ user });
}

export async function PATCH(req) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const body = await parseBody(req);
  if (!body) return err('Invalid request body');

  await updateUser(userId, body);
  const user = await formatUser(userId);
  return ok({ user });
}

export async function DELETE() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  await deleteUser(userId);
  await logoutUser();
  return ok({ success: true });
}
