import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  isLoggedIn: boolean;
}

const baseOptions: SessionOptions = {
  password: process.env.SECRET_KEY || 'complex_password_at_least_32_characters_long',
  cookieName: 'essayhub_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
  },
};

export async function getSession(rememberMe = false) {
  const options: SessionOptions = {
    ...baseOptions,
    cookieOptions: {
      ...baseOptions.cookieOptions,
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    },
  };
  return getIronSession<SessionData>(await cookies(), options);
}
