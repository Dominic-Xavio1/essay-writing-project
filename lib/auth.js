import bcrypt from 'bcryptjs';
import { getSession } from './session';
import { findUserById } from './services/users';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }
  return session.userId;
}

export async function requireSuperuser() {
  const userId = await requireAuth();
  if (!userId) return null;
  const user = await findUserById(userId);
  if (!user || !user.is_superuser) return null;
  return user;
}

export async function loginUser(userId, rememberMe = false) {
  const session = await getSession(rememberMe);
  const user = await findUserById(userId);
  session.userId = userId;
  session.isLoggedIn = true;
  if (user) {
    session.name = user.name;
    session.email = user.email;
    session.avatar = user.avatar || '';
    session.is_superuser = Boolean(user.is_superuser);
  }
  await session.save();
}

export async function logoutUser() {
  const session = await getSession();
  session.destroy();
}
