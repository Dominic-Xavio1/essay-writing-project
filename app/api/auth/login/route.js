import { ok, err, parseBody } from '@/lib/api-utils';
import { findUserByEmail, formatUser } from '@/lib/services/users';
import { verifyPassword, loginUser } from '@/lib/auth';

export async function POST(req) {
  const body = await parseBody(req);
  if (!body?.email || !body?.password) return err('Email and password are required');

  const user = await findUserByEmail(body.email);
  if (!user?.password_hash) return err('Invalid email or password', 401);

  const valid = await verifyPassword(body.password, user.password_hash);
  if (!valid) return err('Invalid email or password', 401);

  await loginUser(user.id, body.rememberMe);
  const profile = await formatUser(user.id);
  return ok({ user: profile });
}
