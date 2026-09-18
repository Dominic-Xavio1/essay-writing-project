import { NextResponse } from 'next/server';
import { upsertGoogleUser } from '@/lib/services/users';
import { loginUser } from '@/lib/auth';

export async function GET(req) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=Google authentication cancelled or failed`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=Google credentials not configured on server`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(`${appUrl}/auth/login?error=Failed to exchange authorization code with Google`);
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userRes.json();
    if (!userRes.ok || !profile.email) {
      console.error('Google userinfo fetch error:', profile);
      return NextResponse.redirect(`${appUrl}/auth/login?error=Failed to retrieve user profile from Google`);
    }

    // 3. Upsert user in database & log in
    const user = await upsertGoogleUser(
      profile.name || profile.email.split('@')[0],
      profile.email,
      profile.picture || ''
    );

    await loginUser(user.id);

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    console.error('Google Auth error:', err);
    return NextResponse.redirect(`${appUrl}/auth/login?error=Google authentication error`);
  }
}
