"use server";

import { Metorial } from 'metorial';
import OpenAI from 'openai';
import { getActiveOAuthSessions } from './metorial-oauth';

const metorial = new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

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

    // Use the simple .run() method which handles everything
    const result = await metorial.run({
      message: userMessage,
      serverDeployments: oauthSessions.map(s => ({
        serverDeploymentId: s.serverDeploymentId,
        oauthSessionId: s.oauthSessionId
      })),
      model: 'gpt-4o-mini',
      client: openai,
      maxSteps: 5
    });

    return {
      success: true,
      response: result.text,
      steps: result.steps
    };
  } catch (error) {
    console.error('Metorial conversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: ''
    };
  }
}

