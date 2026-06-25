import { ok, err } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { formatUser, updateUser, deleteUser } from '@/lib/services/users';
import { logoutUser } from '@/lib/auth';
import { parseBody } from '@/lib/api-utils';

export async function GET() {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);
  const user = await formatUser(userId);
  return ok({ user });
}

export async function PATCH(req: Request) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const body = await parseBody<{ name?: string; bio?: string; avatar?: string }>(req);
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
