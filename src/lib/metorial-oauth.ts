"use server";

import { Metorial } from 'metorial';
import { prisma } from '@/lib/prisma';
import { OAuthService, OAuthStatus } from '@/generated/prisma/client';

const metorial = new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

const SERVICE_DEPLOYMENT_MAP = {
  gmail: process.env.METORIAL_GMAIL_ID!,
  google_calendar: process.env.METORIAL_GCALENDAR_ID!,
} as const;

/**
 * Creates OAuth session and returns OAuth URL for user authentication
 */
export async function createOAuthSession(
  bankerId: string,
  service: 'gmail' | 'google_calendar'
) {
  try {
    const serverDeploymentId = SERVICE_DEPLOYMENT_MAP[service];
    
    // Create OAuth session via Metorial
    const oauthSession = await metorial.oauth.sessions.create({
      serverDeploymentId
    });

    // Store in database with pending status
    const dbSession = await prisma.oAuthSession.upsert({
      where: {
        bankerId_service: { bankerId, service }
      },
      update: {
        serverDeploymentId,
        oauthSessionId: oauthSession.id,
        status: OAuthStatus.pending,
      },
      create: {
        bankerId,
        service,
        serverDeploymentId,
        oauthSessionId: oauthSession.id,
        status: OAuthStatus.pending,
      }
    });

    return {
      success: true,
      oauthUrl: oauthSession.url,
      sessionId: dbSession.id
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
    const dbSession = await prisma.oAuthSession.findUnique({
      where: { id: sessionId }
    });

    if (!dbSession) {
      throw new Error('Session not found');
    }

    // Wait for Metorial OAuth completion
    await metorial.oauth.waitForCompletion([{
      id: dbSession.oauthSessionId,
      url: '' // URL not needed for waitForCompletion
    }]);

    // Update status to active
    await prisma.oAuthSession.update({
      where: { id: sessionId },
      data: { status: OAuthStatus.active }
    });

    return { success: true };
  } catch (error) {
    console.error('Error waiting for OAuth completion:', error);
    
    // Mark as expired on error
    await prisma.oAuthSession.update({
      where: { id: sessionId },
      data: { status: OAuthStatus.expired }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth completion failed'
    };
  }
}

/**
 * Get OAuth session status for a banker and service
 */
export async function getOAuthStatus(bankerId: string, service: 'gmail' | 'google_calendar') {
  try {
    const session = await prisma.oAuthSession.findUnique({
      where: { bankerId_service: { bankerId, service } }
    });

    return {
      isConnected: session?.status === OAuthStatus.active,
      status: session?.status || null,
      sessionId: session?.id || null
    };
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    return { isConnected: false, status: null, sessionId: null };
  }
}

/**
 * Get all active OAuth sessions for a banker (for VAPI usage)
 */
export async function getActiveOAuthSessions(bankerId: string) {
  const sessions = await prisma.oAuthSession.findMany({
    where: {
      bankerId,
      status: OAuthStatus.active
    }
  });

  return sessions.map(s => ({
    serverDeploymentId: s.serverDeploymentId,
    oauthSessionId: s.oauthSessionId,
    service: s.service
  }));
}

/**
 * Disconnect OAuth session
 */
export async function disconnectOAuthSession(bankerId: string, service: 'gmail' | 'google_calendar') {
  try {
    await prisma.oAuthSession.update({
      where: { bankerId_service: { bankerId, service } },
      data: { status: OAuthStatus.expired }
    });

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting OAuth session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect'
    };
  }
}

