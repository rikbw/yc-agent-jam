"use server";

import { Metorial } from 'metorial';
import { randomBytes } from 'crypto';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const metorial = new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

const SERVICE_DEPLOYMENT_MAP = {
  gmail: process.env.METORIAL_GMAIL_ID!,
  google_calendar: process.env.METORIAL_GCALENDAR_ID!,
} as const;

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * Creates OAuth session and returns OAuth URL for user authentication
 */
export async function createOAuthSession(service: 'gmail' | 'google_calendar') {
  try {
    const serverDeploymentId = SERVICE_DEPLOYMENT_MAP[service];

    // Create OAuth session via Metorial
    const oauthSession = await metorial.oauth.sessions.create({
      serverDeploymentId
    });

    // Store in database with pending status
    const sessionId = randomBytes(16).toString('hex');

    // Delete any existing session for this service
    await prisma.oAuthSession.deleteMany({
      where: { service }
    });

    // Create new session
    const dbSession = await prisma.oAuthSession.create({
      data: {
        sessionId,
        service,
        serverDeploymentId,
        oauthSessionId: oauthSession.id,
        status: 'pending',
      }
    });

    return {
      success: true,
      oauthUrl: oauthSession.url,
      sessionId: dbSession.sessionId
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
    const session = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Wait for Metorial OAuth completion
    await metorial.oauth.waitForCompletion([{
      id: session.oauthSessionId,
      url: '' // URL not needed for waitForCompletion
    }]);

    // Update status to active
    await prisma.oAuthSession.update({
      where: { sessionId },
      data: { status: 'active' }
    });

    return { success: true };
  } catch (error) {
    console.error('Error waiting for OAuth completion:', error);

    // Mark as expired on error
    try {
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: { status: 'expired' }
      });
    } catch {
      // Ignore if session doesn't exist
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
export async function getOAuthStatus(service: 'gmail' | 'google_calendar') {
  try {
    const session = await prisma.oAuthSession.findFirst({
      where: { service },
      orderBy: { createdAt: 'desc' }
    });

    return {
      isConnected: session?.status === 'active',
      status: session?.status || null,
      sessionId: session?.sessionId || null
    };
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    return { isConnected: false, status: null, sessionId: null };
  }
}

/**
 * Get active OAuth sessions for Metorial API calls
 */
export async function getActiveOAuthSessions() {
  const activeSessions = await prisma.oAuthSession.findMany({
    where: { status: 'active' }
  });

  return activeSessions.map(s => ({
    serverDeploymentId: s.serverDeploymentId,
    oauthSessionId: s.oauthSessionId,
    service: s.service
  }));
}

/**
 * Run AI conversation with Metorial tools using the simple .run() method
 * This handles session management and conversation loops automatically
 */
export async function runMetorialConversation(userMessage: string) {
  try {
    // Validate required environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Get active OAuth sessions
    const oauthSessions = await getActiveOAuthSessions();

    if (oauthSessions.length === 0) {
      return {
        success: false,
        error: 'No OAuth sessions connected. Please connect your accounts first.',
        response: ''
      };
    }

    console.log('Calling metorial.run with:', {
      messageLength: userMessage.length,
      oauthSessionCount: oauthSessions.length,
      serverDeployments: oauthSessions.map(s => ({
        serverDeploymentId: s.serverDeploymentId,
        oauthSessionId: s.oauthSessionId.substring(0, 20) + '...',
        service: s.service
      }))
    });

    // Use the simple .run() method which handles everything
    const result = await metorial.run({
      message: userMessage,
      serverDeployments: oauthSessions.map(s => ({
        serverDeploymentId: s.serverDeploymentId,
        oauthSessionId: s.oauthSessionId
      })),
      model: 'gpt-5-mini',
      client: openai,
      maxSteps: 30
    });

    return {
      success: true,
      response: result.text,
      steps: result.steps
    };
  } catch (error) {
    console.error('Metorial conversation error:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: ''
    };
  }
}

/**
 * Disconnect OAuth session
 */
export async function disconnectOAuthSession(service: 'gmail' | 'google_calendar') {
  try {
    await prisma.oAuthSession.updateMany({
      where: { service },
      data: { status: 'expired' }
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
