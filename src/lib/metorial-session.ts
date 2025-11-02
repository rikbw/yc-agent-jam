"use server";

import { getActiveOAuthSessions } from './metorial-oauth';

/**
 * Get OAuth connection status (for display/debugging)
 */
export async function getConnectionStatus() {
  try {
    const oauthSessions = await getActiveOAuthSessions();
    
    if (oauthSessions.length === 0) {
      return {
        success: false,
        error: 'No active OAuth sessions. Please connect your accounts first.',
        connectedServices: []
      };
    }

    return { 
      success: true, 
      connectedServices: oauthSessions.map(s => ({
        service: s.service,
        serverDeploymentId: s.serverDeploymentId
      }))
    };
  } catch (error) {
    console.error('Error checking connection status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check status',
      connectedServices: []
    };
  }
}