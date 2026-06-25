import { ok, err, parseBody } from '@/lib/api-utils';
import { hashPassword, loginUser } from '@/lib/auth';
import { findUserByEmail, createUser, formatUser } from '@/lib/services/users';
export async function POST(req) {
  const body = await req.json()
  if (!body?.name || !body?.email || !body?.password) {
    return err('Name, email, and password are required');
  }

  const existing = await findUserByEmail(body.email);
  if (existing) return err('Email already registered', 409);

  const passwordHash = await hashPassword(body.password);
  const user = await createUser(body.name, body.email, passwordHash);
  await loginUser(user.id);
  const profile = await formatUser(user.id);
  return ok({ user: profile }, 201);
}
