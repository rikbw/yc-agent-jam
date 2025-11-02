"use server";

import { Metorial } from 'metorial';
import { MetorialMcpSession } from '@metorial/mcp-session';
import { getActiveOAuthSessions } from './metorial-oauth';

const metorial = new Metorial({
  apiKey: process.env.METORIAL_API_KEY!
});

/**
 * Creates an MCP session with authenticated OAuth sessions for a banker
 * Returns tool manager that can be used to call tools
 */
export async function createMetorialSessionForBanker(bankerId: string) {
  // Get active OAuth sessions
  const oauthSessions = await getActiveOAuthSessions(bankerId);

  if (oauthSessions.length === 0) {
    throw new Error('No active OAuth sessions found. Please connect your accounts in Settings.');
  }

  // Create MCP session with OAuth sessions
  const mcpSession = new MetorialMcpSession(metorial, {
    serverDeployments: oauthSessions.map(s => ({
      serverDeploymentId: s.serverDeploymentId,
      oauthSessionId: s.oauthSessionId
    }))
  });

  // Get tool manager
  const toolManager = await mcpSession.getToolManager();
  
  return {
    session: mcpSession,
    toolManager,
    tools: toolManager.getTools(),
    close: () => mcpSession.close()
  };
}

/**
 * Get available tools for a banker (for display/debugging)
 */
export async function getAvailableToolsForBanker(bankerId: string) {
  try {
    const oauthSessions = await getActiveOAuthSessions(bankerId);
    
    if (oauthSessions.length === 0) {
      return {
        success: false,
        error: 'No active OAuth sessions. Please connect your accounts first.',
        tools: [],
        connectedServices: []
      };
    }

    const { tools, close } = await createMetorialSessionForBanker(bankerId);
    
    const toolList = tools.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description
    }));
    
    await close();
    
    return { 
      success: true, 
      tools: toolList,
      connectedServices: oauthSessions.map(s => s.service)
    };
  } catch (error) {
    console.error('Error getting tools:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tools',
      tools: [],
      connectedServices: []
    };
  }
}