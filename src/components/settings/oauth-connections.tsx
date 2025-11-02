"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Calendar, CheckCircle2, XCircle, FlaskConical, Sparkles, ArrowRight } from "lucide-react";
import {
  createOAuthSession,
  getOAuthStatus,
  waitForOAuthCompletion,
  disconnectOAuthSession
} from "@/lib/metorial-oauth";
import { getAvailableTools } from "@/lib/metorial-session";
import { runMetorialConversation } from "@/lib/vapi-metorial";

type ServiceConfig = {
  id: 'gmail' | 'google_calendar';
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
  }
];

export function OAuthConnections() {
  const [statuses, setStatuses] = useState<Record<string, { isConnected: boolean; loading: boolean }>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    tools: Array<{ id: string; name: string; description: string | null }>;
    connectedServices: string[];
    error?: string;
  } | null>(null);

  // AI Test state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<{
    success: boolean;
    response?: string;
    steps?: Array<{
      type: 'message' | 'tool_calls' | 'response';
      content: string;
      toolCalls?: Array<{ name: string; arguments: string }>;
    }>;
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
      const result = await getAvailableTools();
      setTestResult(result);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        tools: [],
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
                    <span className="font-medium">Connection successful!</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Connected Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {testResult.connectedServices.map(service => (
                        <Badge key={service} variant="outline">
                          {service.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">
                      Available Tools ({testResult.tools.length}):
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {testResult.tools.map(tool => (
                        <div
                          key={tool.id}
                          className="border rounded-lg p-3 bg-muted/30"
                        >
                          <div className="font-mono text-sm font-semibold">
                            {tool.name}
                          </div>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {tool.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
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
                  <>
                    {/* Conversation steps */}
                    {aiResult.steps && aiResult.steps.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Conversation Flow:</p>
                        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                          {aiResult.steps.map((step, idx) => (
                            <div key={idx} className="space-y-1">
                              {step.type === 'message' && (
                                <div className="text-sm">
                                  <span className="font-medium">→</span> {step.content}
                                </div>
                              )}
                              {step.type === 'tool_calls' && (
                                <div className="ml-4 space-y-1">
                                  <div className="text-sm text-orange-600 font-medium">
                                    🔧 {step.content}
                                  </div>
                                  {step.toolCalls && (
                                    <div className="ml-4 space-y-1">
                                      {step.toolCalls.map((call, callIdx) => (
                                        <div key={callIdx} className="text-xs font-mono bg-background/50 rounded px-2 py-1">
                                          <span className="text-blue-600">{call.name}</span>
                                          <span className="text-muted-foreground ml-2">
                                            {JSON.parse(call.arguments).maxResults ? 
                                              `(${JSON.parse(call.arguments).maxResults} results)` : 
                                              ''}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {step.type === 'response' && (
                                <div className="ml-4 mt-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-800">
                                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                    Final Response:
                                  </p>
                                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                                    {step.content}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
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

