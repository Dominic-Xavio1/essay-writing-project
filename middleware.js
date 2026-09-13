import { NextResponse } from 'next/server';

const protectedPaths = ['/dashboard', '/create'];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (!protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.cookies.get('essayhub_session');
  if (!session?.value) {
    const login = new URL('/auth/login', req.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/create/:path*'],
};
