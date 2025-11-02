"use server";

import { Metorial } from 'metorial';
import { getDefaultBanker } from '@/lib/default-user';
import { randomBytes } from 'crypto';

const metorial = new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

const SERVICE_DEPLOYMENT_MAP = {
  gmail: process.env.METORIAL_GMAIL_ID!,
  google_calendar: process.env.METORIAL_GCALENDAR_ID!,
  calendly: process.env.METORIAL_CALENDLY_ID!,
} as const;

// Local types
type OAuthService = 'gmail' | 'google_calendar' | 'calendly';
type OAuthStatus = 'pending' | 'active' | 'expired';

interface OAuthSessionData {
  id: string;
  bankerId: string;
  service: OAuthService;
  serverDeploymentId: string;
  oauthSessionId: string;
  status: OAuthStatus;
}

// Global in-memory storage for OAuth sessions
const oauthSessions = new Map<string, OAuthSessionData>();

function getSessionKey(bankerId: string, service: OAuthService): string {
  return `${bankerId}_${service}`;
}

function findSessionById(sessionId: string): OAuthSessionData | undefined {
  for (const session of oauthSessions.values()) {
    if (session.id === sessionId) {
      return session;
    }
  }
  return undefined;
}

/**
 * Creates OAuth session and returns OAuth URL for user authentication
 */
export async function createOAuthSession(service: 'gmail' | 'google_calendar' | 'calendly') {
  try {
    // Calendly doesn't need OAuth - Metorial handles auth internally
    if (service === 'calendly') {
      return {
        success: false,
        error: 'Calendly authentication is handled by Metorial. No OAuth flow needed.'
      };
    }

    const banker = await getDefaultBanker();
    const serverDeploymentId = SERVICE_DEPLOYMENT_MAP[service];

    // Create OAuth session via Metorial
    const oauthSession = await metorial.oauth.sessions.create({
      serverDeploymentId
    });

    // Store in global memory with pending status
    const sessionKey = getSessionKey(banker.id, service);
    const sessionId = randomBytes(16).toString('hex');

    const sessionData: OAuthSessionData = {
      id: sessionId,
      bankerId: banker.id,
      service,
      serverDeploymentId,
      oauthSessionId: oauthSession.id,
      status: 'pending',
    };

    oauthSessions.set(sessionKey, sessionData);

    return {
      success: true,
      oauthUrl: oauthSession.url,
      sessionId: sessionData.id
    };
  } catch (error) {
    console.error('Error creating OAuth session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create OAuth session'
    };
  }
}

/**
 * Waits for OAuth completion and updates status
 */
export async function waitForOAuthCompletion(sessionId: string) {
  try {
    const session = findSessionById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Wait for Metorial OAuth completion
    await metorial.oauth.waitForCompletion([{
      id: session.oauthSessionId,
      url: '' // URL not needed for waitForCompletion
    }]);

    // Update status to active
    const sessionKey = getSessionKey(session.bankerId, session.service);
    session.status = 'active';
    oauthSessions.set(sessionKey, session);

    return { success: true };
  } catch (error) {
    console.error('Error waiting for OAuth completion:', error);

    // Mark as expired on error
    const session = findSessionById(sessionId);
    if (session) {
      const sessionKey = getSessionKey(session.bankerId, session.service);
      session.status = 'expired';
      oauthSessions.set(sessionKey, session);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth completion failed'
    };
  }
}

/**
 * Get OAuth session status for a service
 */
export async function getOAuthStatus(service: 'gmail' | 'google_calendar' | 'calendly') {
  try {
    // Calendly is always connected - Metorial handles auth internally
    if (service === 'calendly') {
      return {
        isConnected: true,
        status: 'active' as const,
        sessionId: null
      };
    }

    const banker = await getDefaultBanker();
    const sessionKey = getSessionKey(banker.id, service);
    const session = oauthSessions.get(sessionKey);

    return {
      isConnected: session?.status === 'active',
      status: session?.status || null,
      sessionId: session?.id || null
    };
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    return { isConnected: false, status: null, sessionId: null };
  }
}

/**
 * Get all active OAuth sessions (for VAPI usage)
 */
export async function getActiveOAuthSessions() {
  const banker = await getDefaultBanker();
  const activeSessions: (OAuthSessionData | { serverDeploymentId: string; service: 'calendly'; oauthSessionId?: undefined })[] = [];

  // Add Calendly - always active, no OAuth session needed
  activeSessions.push({
    serverDeploymentId: SERVICE_DEPLOYMENT_MAP.calendly,
    service: 'calendly'
  });

  // Add other OAuth sessions
  for (const session of oauthSessions.values()) {
    if (session.bankerId === banker.id && session.status === 'active') {
      activeSessions.push(session);
    }
  }

  return activeSessions.map((s: any) => ({
    serverDeploymentId: s.serverDeploymentId,
    oauthSessionId: s.oauthSessionId,
    service: s.service
  }));
}

/**
 * Disconnect OAuth session
 */
export async function disconnectOAuthSession(service: 'gmail' | 'google_calendar' | 'calendly') {
  try {
    // Calendly can't be disconnected - it's handled by Metorial
    if (service === 'calendly') {
      return {
        success: false,
        error: 'Calendly connection cannot be disconnected. Authentication is managed by Metorial.'
      };
    }

    const banker = await getDefaultBanker();
    const sessionKey = getSessionKey(banker.id, service);
    const session = oauthSessions.get(sessionKey);

    if (session) {
      session.status = 'expired';
      oauthSessions.set(sessionKey, session);
    }

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting OAuth session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect'
    };
  }
}

