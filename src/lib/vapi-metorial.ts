"use server";

import { Metorial } from 'metorial';
import { metorialOpenAI } from '@metorial/openai';
import OpenAI from 'openai';
import { getActiveOAuthSessions } from './metorial-oauth';

const metorial = new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
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

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'user', content: userMessage }
        ];

        // Conversation loop (max 5 iterations to prevent context overflow)
        for (let i = 0; i < 5; i++) {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            tools: session.tools
          });

          const choice = response.choices[0]!;
          const toolCalls = choice.message.tool_calls;

          // If no tool calls, we're done
          if (!toolCalls) {
            finalResponse = choice.message.content || 'No response';
            steps.push({
              type: 'response',
              content: finalResponse
            });
            return;
          }

          // Log tool calls
          const toolCallsInfo = toolCalls.map(call => ({
            name: (call as any).function?.name || 'unknown',
            arguments: (call as any).function?.arguments || '{}'
          }));

          steps.push({
            type: 'tool_calls',
            content: `Calling ${toolCallsInfo.length} tool(s)`,
            toolCalls: toolCallsInfo
          });

          // Execute tools through Metorial
          const toolResponses = await session.callTools(toolCalls as any);

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
              tool_calls: choice.message.tool_calls
            } as any,
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

