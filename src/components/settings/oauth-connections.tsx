"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, FlaskConical, Sparkles, ArrowRight } from "lucide-react";
import {
  createOAuthSession,
  getOAuthStatus,
  waitForOAuthCompletion,
  disconnectOAuthSession,
  runMetorialConversation
} from "@/lib/metorial-oauth";
import { getConnectionStatus } from "@/lib/metorial-session";
import Image from "next/image";

type ServiceConfig = {
  id: 'gmail' | 'google_calendar';
  name: string;
  description: string;
  iconUrl: string;
};

const SERVICES: ServiceConfig[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send emails on your behalf',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg'
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Schedule meetings and manage calendar',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg'
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

  const handleConnect = async (serviceId: 'gmail' | 'google_calendar') => {
    setStatuses(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], loading: true } }));

    try {
      const result = await createOAuthSession(serviceId);
      
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

  const handleDisconnect = async (serviceId: 'gmail' | 'google_calendar') => {
    setStatuses(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], loading: true } }));

    const result = await disconnectOAuthSession(serviceId);
    
    if (result.success) {
      setStatuses(prev => ({ ...prev, [serviceId]: { isConnected: false, loading: false } }));
      // Clear test results when disconnecting
      setTestResult(null);
    } else {
      setStatuses(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], loading: false } }));
      alert(result.error || 'Failed to disconnect');
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
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">OAuth Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect your accounts to enable AI agent capabilities
          </p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          {SERVICES.map((service, index) => {
            const status = statuses[service.id] || { isConnected: false, loading: false };

            return (
              <div key={service.id} className={`flex items-center justify-between p-3 bg-muted/30 ${index !== SERVICES.length - 1 ? 'border-b' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-background p-1.5">
                    <Image
                      src={service.iconUrl}
                      alt={service.name}
                      width={32}
                      height={32}
                      className="size-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{service.name}</h3>
                      {status.isConnected ? (
                        <Badge variant="default" className="gap-1 text-[10px] h-5">
                          <CheckCircle2 className="size-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[10px] h-5">
                          <XCircle className="size-3" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div>
                  {status.isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(service.id)}
                      disabled={status.loading}
                      className="h-7 text-xs"
                    >
                      {status.loading && <Loader2 className="mr-1.5 size-3 animate-spin" />}
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(service.id)}
                      disabled={status.loading}
                      className="h-7 text-xs"
                    >
                      {status.loading && <Loader2 className="mr-1.5 size-3 animate-spin" />}
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasAnyConnection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Test Connection</h2>
              <p className="text-sm text-muted-foreground">
                Verify your OAuth connections and view available tools
              </p>
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              size="sm"
              className="h-7 text-xs"
            >
              {testing && <Loader2 className="mr-1.5 size-3 animate-spin" />}
              <FlaskConical className="mr-1.5 size-3" />
              Test Connection
            </Button>
          </div>
          {testResult && (
            <div className="border rounded-lg p-3 bg-muted/30">
              {testResult.success ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-600" />
                    <span className="font-medium">OAuth sessions are active and ready!</span>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-2 text-muted-foreground">Connected Services ({testResult.connectedServices.length}):</p>
                    <div className="space-y-1.5">
                      {testResult.connectedServices.map(conn => (
                        <div
                          key={conn.service}
                          className="border rounded p-2 bg-background"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-xs">
                              {conn.service.replace('_', ' ')}
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px] h-5">
                              {conn.serverDeploymentId.substring(0, 12)}...
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border">
                    ✓ These OAuth sessions will be used by the AI agent to access your Gmail and Calendar
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
            </div>
          )}
        </div>
      )}

      {hasAnyConnection && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="size-4" />
              Test with AI
            </h2>
            <p className="text-sm text-muted-foreground">
              Try a prompt with OpenAI + your connected tools
            </p>
          </div>
          <div className="space-y-3">
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
                className="h-8 text-sm"
              />
              <Button
                onClick={handleAiTest}
                disabled={aiTesting || !aiPrompt.trim()}
                size="sm"
                className="h-8 w-8 p-0"
              >
                {aiTesting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ArrowRight className="size-3" />
                )}
              </Button>
            </div>

            {aiResult && (
              <div className="space-y-2">
                {aiResult.success ? (
                  <div className="rounded-lg bg-muted/50 p-3 border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="size-3 text-green-600" />
                      <p className="text-xs font-medium">
                        Response {aiResult.steps && `(completed in ${aiResult.steps} steps)`}:
                      </p>
                    </div>
                    <p className="text-xs whitespace-pre-wrap">
                      {aiResult.response}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-red-600 rounded-lg border p-2 bg-muted/30">
                    <XCircle className="size-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-xs">AI test failed</p>
                      {aiResult.error && (
                        <p className="text-xs mt-1">{aiResult.error}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
              <p className="font-medium mb-1">Try these examples:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>What are my next 3 calendar events?</li>
                <li>Show me my calendar for tomorrow</li>
                <li>List my recent emails</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

