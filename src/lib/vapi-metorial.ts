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

    // Get current date/time for context
    const now = new Date();
    const dateContext = `Current date and time: ${now.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })}`;

    // Enhance message with date context and instructions
    const enhancedMessage = `${dateContext}

Important: When working with dates and times:
- Always use future dates and times, never past dates
- When a day of the week is mentioned (e.g., "Wednesday"), calculate the NEXT occurrence of that day
- Add a small buffer (e.g., 1 hour from now) to avoid timezone edge cases
- For Calendly queries, ensure start times are at least 1 hour in the future

User request: ${userMessage}`;

    // Use the simple .run() method which handles everything
    const result = await metorial.run({
      message: enhancedMessage,
      serverDeployments: oauthSessions.map(s => {
        // Only include oauthSessionId if it exists (Calendly doesn't need it)
        const deployment: any = { serverDeploymentId: s.serverDeploymentId };
        if (s.oauthSessionId) {
          deployment.oauthSessionId = s.oauthSessionId;
        }
        return deployment;
      }),
      model: 'gpt-4o-mini',
      client: openai,
      maxSteps: 15 // Increased to handle complex multi-step queries
    });

    return {
      success: true,
      response: result.text,
      steps: result.steps
    };
  } catch (error) {
    console.error('Metorial conversation error:', error);
    
    // Check if it's a max steps error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isMaxStepsError = errorMessage.includes('Max steps') || errorMessage.includes('max steps');
    
    return {
      success: false,
      error: isMaxStepsError 
        ? 'Query took too many steps to complete. Please try a simpler or more specific query.'
        : errorMessage,
      response: ''
    };
  }
}

