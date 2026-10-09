import { ok, err, parseBody } from '@/lib/api-utils';
import { hashPassword, loginUser } from '@/lib/auth';
import { findUserByEmail, createUser, formatUser } from '@/lib/services/users';

export async function POST(req) {
  const body = await parseBody(req);
  if (!body) return err('Invalid request body', 400);

  const name = body.name?.trim();
  const email = body.email?.trim();
  const password = body.password;

  if (!name || !email || !password) {
    return err('Name, email, and password are required', 400);
  }

  if (password.length < 8) {
    return err('Password must be at least 8 characters', 400);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return err('Email already registered', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(name, email, passwordHash);
  await loginUser(user.id);
  const profile = await formatUser(user.id);
  return ok({ user: profile }, 201);
}
