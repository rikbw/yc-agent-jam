"use client";

import { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createMessage, finalizeCall } from "@/lib/calls";
import { MessageRole } from "@/generated/prisma/client";
import { vapiSystemPrompt } from "@/lib/vapi/vapi";
import {
  vapiTools,
  type ToolContext,
} from "@/lib/vapi/tools";
import { handleToolCallAction } from "@/lib/vapi/server-tool-actions";

interface VapiCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: string;
  previousConversationSummaries: string[];
  companyData: {
    id: string;
    name: string;
    industry: string;
    revenue: number;
    ebitda: number;
    headcount: number;
    geography: string;
    dealStage: string;
    ownerBankerName: string;
    ownerBankerId: string;
    estimatedDealSize: number;
    likelihoodToSell: number;
  };
}

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

export function VapiCallDialog({
  open,
  onOpenChange,
  callId,
  previousConversationSummaries,
  companyData,
}: VapiCallDialogProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  // Track call start time for duration calculation
  const callStartTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    // Initialize Vapi client
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      console.error("VAPI_PUBLIC_KEY not found in environment variables");
      setErrorMessage("Vapi API key not configured");
      setCallStatus("error");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    // Set up event listeners
    vapi.on("call-start", () => {
      console.log("Call started");
      setCallStatus("active");
      setErrorMessage(null);
      // Reset start time when call actually starts
      callStartTimeRef.current = new Date();
    });

    vapi.on("message", async (message: any) => {
      console.log("Vapi message:", message);

      // Handle client-side tool calls
      if (message?.type === "tool-calls") {
        console.log("Tool calls received:", message.toolCallList);

        const context: ToolContext = {
          callId,
          companyData,
        };

        message.toolCallList?.forEach(async (toolCall: any) => {
          console.log("Processing tool call:", toolCall);

          // Immediately inform the model we're processing the request
          if (vapiRef.current) {
            vapiRef.current.send({
              type: "add-message",
              message: {
                role: "system",
                content: `Processing ${toolCall.function?.name || 'tool'} request...`
              }
            });
          }

          // Execute the tool call and get the result
          try {
            const result = await handleToolCallAction(toolCall, context);
            console.log("Tool call result:", result);

            // Inject the result back to the model
            if (vapiRef.current && result) {
              const resultMessage = typeof result === 'string'
                ? result
                : JSON.stringify(result, null, 2);

              vapiRef.current.send({
                type: "add-message",
                message: {
                  role: "system",
                  content: `Tool ${toolCall.function?.name || 'call'} result: ${resultMessage}`
                }
              });
            }
          } catch (error) {
            console.error("Error executing tool call:", error);
            // Inform the model about the error
            if (vapiRef.current) {
              vapiRef.current.send({
                type: "add-message",
                message: {
                  role: "system",
                  content: `Error executing ${toolCall.function?.name || 'tool'}: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
              });
            }
          }
        });
      }

      // Only save final transcripts to database
      if (
        message?.type === "transcript" &&
        message?.transcriptType === "final" &&
        message?.transcript
      ) {
        console.log("TRANSCRIPT: ", message.role, ": ", message.transcript);
        try {
          const role = message.role === "assistant" ? MessageRole.assistant : MessageRole.user;
          await createMessage(
            callId,
            role,
            message.transcript,
            new Date()
          );
          console.log("Saved transcript to database:", message.role);
        } catch (error) {
          console.error("Error saving message to database:", error);
        }
      }
    });

    vapi.on("call-end", async () => {
      console.log("Call ended");
      setCallStatus("ended");

      // Finalize call in database
      try {
        const endTime = new Date();
        const durationMinutes = (endTime.getTime() - callStartTimeRef.current.getTime()) / 1000 / 60;

        console.log(`Finalizing call ${callId} (${durationMinutes.toFixed(2)} minutes)`);
        const result = await finalizeCall(callId, durationMinutes);

        if (result.success) {
          console.log("Call finalized successfully");
          if (result.analysis) {
            console.log("Call analysis completed");
          } else if (result.analysisError) {
            console.warn("Call saved but analysis failed:", result.analysisError);
          }
        } else {
          console.error("Failed to finalize call:", result.error);
        }
      } catch (error) {
        console.error("Error finalizing call:", error);
      }

      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
        setCallStatus("idle");
      }, 2000);
    });

    vapi.on("volume-level", (level: number) => {
      setVolumeLevel(level);
    });

    vapi.on("error", (error: any) => {
      console.error("Vapi error:", error);
      console.error("Vapi error type:", typeof error);
      console.error("Vapi error keys:", Object.keys(error || {}));
      console.error("Vapi error string:", JSON.stringify(error, null, 2));

      // Extract meaningful error message
      let errorMsg = "An error occurred during the call";
      if (error) {
        if (typeof error === "string") {
          errorMsg = error;
        } else if (error.message) {
          errorMsg = error.message;
        } else if (error.error) {
          errorMsg = error.error;
        } else if (error.statusMessage) {
          errorMsg = error.statusMessage;
        }
      }

      setErrorMessage(errorMsg);
      setCallStatus("error");
    });

    // Cleanup function
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, [onOpenChange]);

  useEffect(() => {
    // Start call when dialog opens
    if (open && vapiRef.current && callStatus === "idle") {
      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        startCall();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, callStatus]);

  const startCall = async () => {
    if (!vapiRef.current) return;

    setCallStatus("connecting");
    setErrorMessage(null);

    try {
      // Request default microphone access first to ensure browser uses the correct device
      // This prevents the browser from defaulting to iPhone mic or other non-preferred devices
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        // Stop the stream immediately - we just needed to establish permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (micError) {
        console.error("Failed to access microphone:", micError);
        setErrorMessage("Please allow microphone access to start the call");
        setCallStatus("error");
        return;
      }

      // Format company data for the assistant
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      };

      const companyInfo = `
Company: ${companyData.name}
Industry: ${companyData.industry}
Geography: ${companyData.geography}
Revenue: ${formatCurrency(companyData.revenue)}
EBITDA: ${formatCurrency(companyData.ebitda)}
Headcount: ${companyData.headcount.toLocaleString()}
Deal Stage: ${companyData.dealStage}
Estimated Deal Size: ${formatCurrency(companyData.estimatedDealSize)}
Likelihood to Sell: ${companyData.likelihoodToSell}%
Owner: ${companyData.ownerBankerName}
      `.trim();

      console.log("Starting Vapi call with company info:", companyInfo);

      console.log("Vapi tools:", vapiTools);

      const systemPrompt = vapiSystemPrompt({
        ownerBankerName: companyData.ownerBankerName,
        companyName: companyData.name,
        companyInfo: companyInfo,
        previousConversationSummaries,
      });

      console.log("System prompt:", systemPrompt);

      const firstMessage = previousConversationSummaries.some(summary => summary !== "") ?
        `Hello! This is an AI assistant calling on behalf of ${companyData.ownerBankerName}. I'm following up on our previous conversation. How are you today?` :
        `Hello! This is an AI assistant calling on behalf of ${companyData.ownerBankerName}. I'd like to discuss your company, ${companyData.name}, and explore potential opportunities. How are you today?`;

      // Start the call with transient assistant configuration
      await vapiRef.current.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        model: {
          provider: "openai",
          model: "gpt-5-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
          ],
          tools: vapiTools as any
        },
        voice: {
          provider: "11labs",
          voiceId: "bIHbv24MWmeRgasZH58o",
        },
        // Background office ambient sound
        backgroundSound: "office",
        // Maximum call duration (15 minutes)
        maxDurationSeconds: 900,
        name: `${companyData.name} Sales Call`,
        firstMessage: firstMessage,
      });
    } catch (error: any) {
      console.error("Failed to start call:", error);
      const errorMsg = error?.message || error?.error || JSON.stringify(error) || "Failed to start call. Please check your API key and try again.";
      setErrorMessage(errorMsg);
      setCallStatus("error");
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      setCallStatus("ended");
      setTimeout(() => {
        onOpenChange(false);
        setCallStatus("idle");
      }, 1000);
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case "connecting":
        return "Connecting...";
      case "active":
        return "Call in progress";
      case "ended":
        return "Call ended";
      case "error":
        return errorMessage || "Error occurred";
      default:
        return "Initializing...";
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case "connecting":
        return "text-yellow-600";
      case "active":
        return "text-green-600";
      case "ended":
        return "text-gray-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5" />
            Call with {companyData.name}
          </DialogTitle>
          <DialogDescription>
            AI-powered sales call assistant
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* Status */}
          <div className="flex flex-col items-center gap-3">
            {callStatus === "connecting" && (
              <Loader2 className="size-12 animate-spin text-primary" />
            )}
            {callStatus === "active" && (
              <div className="relative">
                <Phone className="size-12 text-green-600" />
                {/* Volume indicator */}
                <div
                  className="absolute -inset-2 rounded-full border-2 border-green-600 opacity-50"
                  style={{
                    transform: `scale(${1 + volumeLevel / 100})`,
                    transition: "transform 0.1s ease-out",
                  }}
                />
              </div>
            )}
            {callStatus === "ended" && (
              <PhoneOff className="size-12 text-gray-600" />
            )}
            {callStatus === "error" && (
              <PhoneOff className="size-12 text-red-600" />
            )}

            <div className="flex flex-col items-center gap-1">
              <p className={cn("text-lg font-semibold", getStatusColor())}>
                {getStatusText()}
              </p>
              {callStatus === "active" && (
                <p className="text-sm text-muted-foreground">
                  Speak clearly into your microphone
                </p>
              )}
              {errorMessage && callStatus === "error" && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry:</span>
                <span className="font-medium">{companyData.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Geography:</span>
                <span className="font-medium">{companyData.geography}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deal Stage:</span>
                <span className="font-medium">{companyData.dealStage}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {callStatus === "active" && (
              <Button
                onClick={endCall}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <PhoneOff className="mr-2 size-4" />
                End Call
              </Button>
            )}
            {(callStatus === "error" || callStatus === "ended") && (
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
