"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
import { 
  initiateCalendarOAuth, 
  checkOAuthStatus, 
  waitForOAuthCompletion 
} from "@/lib/calendar/oauth-actions";
import { disconnectCalendar } from "./disconnect-calendar-action";

interface ConnectCalendarButtonProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export function ConnectCalendarButton({ onConnectionChange }: ConnectCalendarButtonProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [oauthSessionId, setOauthSessionId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const result = await checkOAuthStatus();
      if (result.success) {
        setIsConnected(result.isConnected);
        onConnectionChange?.(result.isConnected);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    setDialogOpen(true);
    
    // Get the OAuth URL
    const redirectUrl = `${window.location.origin}/api/oauth/callback`;
    const result = await initiateCalendarOAuth(redirectUrl);

    if (result.success && result.authUrl && result.sessionId) {
      setOauthUrl(result.authUrl);
      setOauthSessionId(result.sessionId);
      toast.info("Opening Google Calendar authorization...");
    } else {
      toast.error(result.error || "Failed to initiate OAuth");
      setDialogOpen(false);
    }
  };

  const handleOpenAuthWindow = async () => {
    if (!oauthUrl || !oauthSessionId) return;

    // Listen for OAuth success message from popup
    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS' && event.data.sessionId) {
        // Store the session ID
        const { storeOAuthSession } = await import('@/lib/calendar/oauth-session');
        await storeOAuthSession(event.data.sessionId);
        
        setWaiting(false);
        toast.success("Google Calendar connected successfully!");
        setIsConnected(true);
        setDialogOpen(false);
        onConnectionChange?.(true);
        
        // Clean up listener
        window.removeEventListener('message', messageHandler);
        
        // Refresh the page to update data
        window.location.reload();
      }
    };

    window.addEventListener('message', messageHandler);

    // Open OAuth URL in new window
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      oauthUrl,
      'Google Calendar Authorization',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Start waiting indicator
    setWaiting(true);
    toast.info("Please authorize in the popup window...");

    // Fallback: Check if popup was blocked
    if (!popup || popup.closed) {
      toast.error("Popup was blocked. Please allow popups and try again.");
      setWaiting(false);
      window.removeEventListener('message', messageHandler);
    }
  };

  if (checking) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  const handleDisconnect = async () => {
    await disconnectCalendar();
    setIsConnected(false);
    onConnectionChange?.(false);
    toast.success("Calendar disconnected");
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Calendar Connected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="default" size="sm" onClick={handleConnect}>
        <Calendar className="h-4 w-4 mr-2" />
        Connect Calendar
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Google Calendar</DialogTitle>
            <DialogDescription>
              Authorize access to your Google Calendar to enable meeting scheduling
            </DialogDescription>
          </DialogHeader>

          {oauthUrl ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {waiting ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Waiting for authorization...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Please complete the authorization in the popup window
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">Authorization Required</p>
                          <p>
                            Click the button below to open Google's authorization page.
                            You'll need to grant access to your calendar.
                          </p>
                        </div>
                      </div>

                      <Button 
                        onClick={handleOpenAuthWindow} 
                        className="w-full"
                        size="lg"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Authorization Page
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        A popup window will open. Please enable popups if blocked.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Preparing authorization...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

