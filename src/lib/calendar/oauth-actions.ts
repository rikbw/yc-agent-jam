'use server';

import { metorial } from '@/lib/metorial';

const CALENDAR_DEPLOYMENT_ID = process.env.METORIAL_GCALENDAR_ID!;

/**
 * Initiate OAuth flow for Google Calendar
 * Returns the OAuth URL to redirect the user to
 */
export async function initiateCalendarOAuth(redirectUrl: string) {
  try {
    // Create an OAuth session for the calendar deployment
    const oauthSession = await metorial.oauth.sessions.create({
      serverDeploymentId: CALENDAR_DEPLOYMENT_ID,
      redirectUri: redirectUrl,
    });

    return {
      success: true,
      authUrl: oauthSession.url,
      sessionId: oauthSession.id,
    };
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate OAuth',
    };
  }
}

/**
 * Check OAuth connection status
 * Simply checks if we have a stored OAuth session ID
 */
export async function checkOAuthStatus() {
  try {
    const { getOAuthSession } = await import('./oauth-session');
    const oauthSessionId = await getOAuthSession();

    return {
      success: true,
      isConnected: !!oauthSessionId,
      oauthSessionId: oauthSessionId || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      isConnected: false,
      error: error instanceof Error ? error.message : 'Failed to check OAuth status',
    };
  }
}

/**
 * Wait for OAuth completion after user authorizes
 */
export async function waitForOAuthCompletion(sessionId: string) {
  try {
    await metorial.waitForOAuthCompletion(
      [{ id: sessionId }],
      {
        pollInterval: 2000, // Check every 2 seconds
        timeout: 300000, // 5 minute timeout
      }
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error waiting for OAuth completion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth authorization failed or timed out',
    };
  }
}

