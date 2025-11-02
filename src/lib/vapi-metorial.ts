"use server";

import { Metorial } from 'metorial';
import { metorialOpenAI } from '@metorial/openai';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getActiveOAuthSessions } from './metorial-oauth';

const metorial = new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

type ConversationStep = {
  type: 'message' | 'tool_calls' | 'response';
  content: string;
  toolCalls?: Array<{ name: string; arguments: string }>;
};

/**
 * Run AI conversation with Metorial tools
 * Returns conversation steps for debugging/display
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
        steps: []
      };
    }

    const steps: ConversationStep[] = [];
    let finalResponse = '';

    // Create provider session with OAuth
    await metorial.withProviderSession(
      metorialOpenAI.chatCompletions,
      {
        serverDeployments: oauthSessions.map((s: { serverDeploymentId: string; oauthSessionId: string }) => ({
          serverDeploymentId: s.serverDeploymentId,
          oauthSessionId: s.oauthSessionId
        }))
      },
      async (session) => {
        steps.push({
          type: 'message',
          content: `User: ${userMessage}`
        });

        const messages: any[] = [
          { role: 'user', content: userMessage }
        ];

        // Conversation loop (max 5 iterations to prevent context overflow)
        for (let i = 0; i < 5; i++) {
          const response = await generateText({
            model: openrouter('openai/gpt-4o'),
            messages,
            tools: session.tools as any,
            maxSteps: 1, // Disable automatic tool execution
          });

          const toolCalls = response.toolCalls;

          // If no tool calls, we're done
          if (!toolCalls || toolCalls.length === 0) {
            finalResponse = response.text || 'No response';
            steps.push({
              type: 'response',
              content: finalResponse
            });
            return;
          }

          // Convert Vercel AI SDK tool calls to OpenAI format for Metorial
          const openAIToolCalls = toolCalls.map((call: any) => ({
            id: call.toolCallId,
            type: 'function',
            function: {
              name: call.toolName,
              arguments: JSON.stringify(call.args)
            }
          }));

          // Log tool calls
          const toolCallsInfo = openAIToolCalls.map((call: any) => ({
            name: call.function.name,
            arguments: call.function.arguments
          }));

          steps.push({
            type: 'tool_calls',
            content: `Calling ${toolCallsInfo.length} tool(s)`,
            toolCalls: toolCallsInfo
          });

          // Execute tools through Metorial
          const toolResponses = await session.callTools(openAIToolCalls);

          // Truncate large tool responses to prevent context overflow
          const truncatedResponses = toolResponses.map((response: any) => {
            if (response.content && typeof response.content === 'string') {
              // Limit each tool response to 2000 characters
              const maxLength = 2000;
              if (response.content.length > maxLength) {
                return {
                  ...response,
                  content: response.content.substring(0, maxLength) +
                    `\n\n[... truncated ${response.content.length - maxLength} characters]`
                };
              }
            }
            return response;
          });

          // Add to conversation
          messages.push(
            {
              role: 'assistant',
              content: response.text || '',
              tool_calls: openAIToolCalls
            },
            ...truncatedResponses
          );

          // Keep only last 6 messages to prevent context overflow
          if (messages.length > 6) {
            messages.splice(1, messages.length - 6);
          }
        }

        finalResponse = 'Max iterations reached';
        steps.push({
          type: 'response',
          content: finalResponse
        });
      }
    );

    return {
      success: true,
      response: finalResponse,
      steps
    };
  } catch (error) {
    console.error('Metorial conversation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps: []
    };
  }
}

