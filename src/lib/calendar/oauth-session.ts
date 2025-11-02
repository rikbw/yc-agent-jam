'use server';

import { cookies } from 'next/headers';

const OAUTH_SESSION_COOKIE = 'metorial_calendar_oauth_session';

/**
 * Store OAuth session ID in cookies
 */
export async function storeOAuthSession(oauthSessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_SESSION_COOKIE, oauthSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Get OAuth session ID from cookies
 */
export async function getOAuthSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(OAUTH_SESSION_COOKIE);
  return session?.value || null;
}

/**
 * Clear OAuth session
 */
export async function clearOAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_SESSION_COOKIE);
}

