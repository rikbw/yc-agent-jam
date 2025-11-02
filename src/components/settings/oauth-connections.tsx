"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Calendar, CheckCircle2, XCircle, FlaskConical, Sparkles, ArrowRight, CalendarCheck } from "lucide-react";
import {
  createOAuthSession,
  getOAuthStatus,
  waitForOAuthCompletion,
  disconnectOAuthSession
} from "@/lib/metorial-oauth";
import { getConnectionStatus } from "@/lib/metorial-session";
import { runMetorialConversation } from "@/lib/vapi-metorial";

type ServiceConfig = {
  id: 'gmail' | 'google_calendar' | 'calendly';
  name: string;
  description: string;
  icon: typeof Mail;
};

const SERVICES: ServiceConfig[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send emails on your behalf',
    icon: Mail
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Schedule meetings and manage calendar',
    icon: Calendar
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Manage bookings and scheduling links',
    icon: CalendarCheck
  }
];

export function OAuthConnections() {
  const [statuses, setStatuses] = useState<Record<string, { isConnected: boolean; loading: boolean }>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    connectedServices: Array<{ service: string; serverDeploymentId: string }>;
    error?: string;
  } | null>(null);

  // AI Test state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<{
    success: boolean;
    response?: string;
    steps?: number;
    error?: string;
  } | null>(null);

  // Load initial statuses
  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    const newStatuses: Record<string, { isConnected: boolean; loading: boolean }> = {};
    
    for (const service of SERVICES) {
      const status = await getOAuthStatus(service.id);
      newStatuses[service.id] = {
        isConnected: status.isConnected ?? false,
        loading: false
      };
    }
    
    setStatuses(newStatuses);
  };

  const handleConnect = async (serviceId: 'gmail' | 'google_calendar' | 'calendly') => {
    setStatuses(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], loading: true } }));

    try {
      const result = await createOAuthSession(serviceId);
      
      // Calendly doesn't need OAuth flow
      if (serviceId === 'calendly') {
        setStatuses(prev => ({ ...prev, [serviceId]: { isConnected: true, loading: false } }));
        return;
      }
      
      if (!result.success || !result.oauthUrl || !result.sessionId) {
        throw new Error(result.error || 'Failed to create session');
      }

      // Open OAuth URL in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        result.oauthUrl,
        'OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Wait for OAuth completion
      const completionResult = await waitForOAuthCompletion(result.sessionId);
      
      if (completionResult.success) {
        setStatuses(prev => ({ ...prev, [serviceId]: { isConnected: true, loading: false } }));
      } else {
        throw new Error(completionResult.error || 'OAuth failed');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setStatuses(prev => ({ ...prev, [serviceId]: { isConnected: false, loading: false } }));
      alert(error instanceof Error ? error.message : 'Failed to connect');
    }
  };

  const handleDisconnect = async (serviceId: 'gmail' | 'google_calendar' | 'calendly') => {
    setStatuses(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], loading: true } }));

    const result = await disconnectOAuthSession(serviceId);
    
    if (result.success) {
      setStatuses(prev => ({ ...prev, [serviceId]: { isConnected: false, loading: false } }));
      // Clear test results when disconnecting
      setTestResult(null);
    } else {
      setStatuses(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], loading: false } }));
      if (result.error) {
        alert(result.error);
      }
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await getConnectionStatus();
      setTestResult(result);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        connectedServices: [],
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAiTest = async () => {
    if (!aiPrompt.trim()) return;

    setAiTesting(true);
    setAiResult(null);

    try {
      const result = await runMetorialConversation(aiPrompt);
      setAiResult(result);
    } catch (error) {
      console.error('AI test error:', error);
      setAiResult({
        success: false,
        error: error instanceof Error ? error.message : 'AI test failed'
      });
    } finally {
      setAiTesting(false);
    }
  };

  const hasAnyConnection = Object.values(statuses).some(s => s.isConnected);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Integrations</CardTitle>
          <CardDescription>
            Connect your accounts to enable AI agent capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SERVICES.map(service => {
            const status = statuses[service.id] || { isConnected: false, loading: false };
            const Icon = service.icon;

            return (
              <div key={service.id} className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      {status.isConnected ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="size-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="size-3" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div>
                  {status.isConnected ? (
                    // Hide disconnect button for Calendly - it's managed by Metorial
                    service.id !== 'calendly' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(service.id)}
                        disabled={status.loading}
                      >
                        {status.loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Disconnect
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Managed by Metorial
                      </Badge>
                    )
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(service.id)}
                      disabled={status.loading}
                    >
                      {status.loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {hasAnyConnection && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Connection</CardTitle>
                <CardDescription>
                  Verify your OAuth connections and view available tools
                </CardDescription>
              </div>
              <Button
                onClick={handleTestConnection}
                disabled={testing}
                size="sm"
              >
                {testing && <Loader2 className="mr-2 size-4 animate-spin" />}
                <FlaskConical className="mr-2 size-4" />
                Test Connection
              </Button>
            </div>
          </CardHeader>
          {testResult && (
            <CardContent>
              {testResult.success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-600" />
                    <span className="font-medium">OAuth sessions are active and ready!</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Connected Services ({testResult.connectedServices.length}):</p>
                    <div className="space-y-2">
                      {testResult.connectedServices.map(conn => (
                        <div
                          key={conn.service}
                          className="border rounded-lg p-3 bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">
                              {conn.service.replace('_', ' ')}
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">
                              {conn.serverDeploymentId.substring(0, 12)}...
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    These sessions will be used by the AI agent to access your Gmail, Calendar, and Calendly
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-red-600">
                  <XCircle className="size-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Connection test failed</p>
                    {testResult.error && (
                      <p className="text-xs mt-1">{testResult.error}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {hasAnyConnection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              Test with AI
            </CardTitle>
            <CardDescription>
              Try a prompt with OpenAI + your connected tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., What are my next 3 calendar events?"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !aiTesting) {
                    handleAiTest();
                  }
                }}
                disabled={aiTesting}
              />
              <Button
                onClick={handleAiTest}
                disabled={aiTesting || !aiPrompt.trim()}
              >
                {aiTesting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
              </Button>
            </div>

            {aiResult && (
              <div className="space-y-3">
                {aiResult.success ? (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="size-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Response {aiResult.steps && `(completed in ${aiResult.steps} steps)`}:
                      </p>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                      {aiResult.response}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3">
                    <XCircle className="size-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">AI test failed</p>
                      {aiResult.error && (
                        <p className="text-xs mt-1">{aiResult.error}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Try these examples:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>What are my next 3 calendar events?</li>
                <li>Show me my calendar for tomorrow</li>
                <li>List my recent emails</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

