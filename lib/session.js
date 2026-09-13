import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

const baseOptions = {
  password: process.env.SECRET_KEY || 'complex_password_at_least_32_characters_long',
  cookieName: 'essayhub_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  },
};

export async function getSession(rememberMe = false) {
  const options = {
    ...baseOptions,
    cookieOptions: {
      ...baseOptions.cookieOptions,
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    },
  };
  return getIronSession(await cookies(), options);
}
