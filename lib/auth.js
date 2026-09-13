import bcrypt from 'bcryptjs';
import { getSession } from './session';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }
  return session.userId;
}

export async function loginUser(userId, rememberMe = false) {
  const session = await getSession(rememberMe);
  session.userId = userId;
  session.isLoggedIn = true;
  await session.save();
}

export async function logoutUser() {
  const session = await getSession();
  session.destroy();
}
