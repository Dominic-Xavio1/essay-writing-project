import { ok, err, parseBody } from '@/lib/api-utils';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import { updatePassword } from '@/lib/services/users';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  const userId = await requireAuth();
  if (!userId) return err('Unauthorized', 401);

  const body = await parseBody<{ currentPassword: string; newPassword: string }>(req);
  if (!body?.currentPassword || !body?.newPassword) {
    return err('Current and new password are required');
  }
  if (body.newPassword.length < 8) return err('New password must be at least 8 characters');

  const { rows } = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  if (!rows[0]) return err('User not found', 404);

  const valid = await verifyPassword(body.currentPassword, rows[0].password_hash);
  if (!valid) return err('Current password is incorrect', 401);

  await updatePassword(userId, await hashPassword(body.newPassword));
  return ok({ success: true });
}
