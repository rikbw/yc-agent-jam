import { NextRequest, NextResponse } from "next/server";
import { createMessage, finalizeCall } from "@/lib/calls";
import { MessageRole } from "@/generated/prisma/client";
import { handleToolCallAction, type ToolContext } from "@/lib/vapi/server-tool-actions";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/vapi/webhook
 * Receives webhook events from Vapi during phone calls
 *
 * Events include:
 * - transcript: Real-time transcripts of the conversation
 * - tool-calls: When the AI assistant invokes tools
 * - end-of-call-report: Final summary when call ends
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract Vapi call ID from the webhook payload
    const vapiCallId = body.call?.id || body.callId;

    if (!vapiCallId) {
      console.error("[Webhook] Missing Vapi call ID in webhook payload");
      return NextResponse.json({ received: true }); // Still return 200 to prevent retries
    }

    // Look up our database call record by Vapi call ID
    const call = await prisma.call.findFirst({
      where: {
        notes: {
          contains: `Vapi Call ID: ${vapiCallId}`,
        },
      },
    });

    if (!call) {
      console.error(`[Webhook] No call found for Vapi call ID: ${vapiCallId}`);
      return NextResponse.json({ received: true }); // Still return 200
    }

    const callId = call.id;
    const messageType = body.message?.type || body.type;

    console.log(`[Webhook] Received event for call ${callId} (Vapi: ${vapiCallId}):`, messageType);

    // Handle different event types
    switch (messageType) {
      case "transcript": {
        // Only save final transcripts to database (not partial ones)
        const transcript = body.message?.transcript || body.transcript;
        const transcriptType = body.message?.transcriptType || body.transcriptType;
        const role = body.message?.role || body.role;

        if (transcriptType === "final" && transcript) {
          console.log(`[Webhook] Final transcript - ${role}: ${transcript}`);

          try {
            const messageRole = role === "assistant" ? MessageRole.assistant : MessageRole.user;
            await createMessage(callId, messageRole, transcript, new Date());
            console.log(`[Webhook] Saved transcript to database`);
          } catch (error) {
            console.error("[Webhook] Error saving transcript:", error);
          }
        }
        break;
      }

      case "tool-calls": {
        // Handle client-side tool calls
        const toolCallList = body.message?.toolCallList || body.toolCallList;

        if (toolCallList && Array.isArray(toolCallList)) {
          console.log(`[Webhook] Processing ${toolCallList.length} tool calls`);

          // Fetch full company data for tool context
          const fullCall = await prisma.call.findUnique({
            where: { id: callId },
            include: {
              sellerCompany: true,
              banker: true,
            },
          });

          if (!fullCall) {
            console.error(`[Webhook] Call ${callId} not found`);
            break;
          }

          const context: ToolContext = {
            callId,
            companyData: {
              id: fullCall.sellerCompany.id,
              name: fullCall.sellerCompany.name,
              industry: fullCall.sellerCompany.industry,
              revenue: fullCall.sellerCompany.revenue,
              ebitda: fullCall.sellerCompany.ebitda,
              headcount: fullCall.sellerCompany.headcount,
              geography: fullCall.sellerCompany.geography,
              dealStage: fullCall.sellerCompany.dealStage,
              ownerBankerName: fullCall.banker.name,
              ownerBankerId: fullCall.bankerId,
              estimatedDealSize: fullCall.sellerCompany.estimatedDealSize,
              likelihoodToSell: fullCall.sellerCompany.likelihoodToSell,
            },
          };

          // Process each tool call
          for (const toolCall of toolCallList) {
            try {
              console.log(`[Webhook] Processing tool call:`, toolCall.function?.name);
              await handleToolCallAction(toolCall, context);
            } catch (error) {
              console.error(`[Webhook] Error processing tool call:`, error);
            }
          }
        }
        break;
      }

      case "end-of-call-report": {
        // Call has ended - finalize it
        console.log(`[Webhook] Call ended, finalizing...`);

        const endedReason = body.message?.endedReason || body.endedReason;
        const duration = body.message?.duration || body.duration;

        console.log(`[Webhook] End reason: ${endedReason}, Duration: ${duration}s`);

        try {
          // Convert duration from seconds to minutes
          const durationMinutes = duration ? duration / 60 : 0;

          const result = await finalizeCall(callId, durationMinutes);

          if (result.success) {
            console.log(`[Webhook] Call finalized successfully`);
            if (result.analysis) {
              console.log(`[Webhook] Call analysis completed`);
            } else if (result.analysisError) {
              console.warn(`[Webhook] Call saved but analysis failed:`, result.analysisError);
            }
          } else {
            console.error(`[Webhook] Failed to finalize call:`, result.error);
          }
        } catch (error) {
          console.error(`[Webhook] Error finalizing call:`, error);
        }
        break;
      }

      case "status-update": {
        // Optional: Track call status changes
        const status = body.message?.status || body.status;
        console.log(`[Webhook] Call status: ${status}`);
        break;
      }

      case "hang": {
        // Call was hung up
        console.log(`[Webhook] Call hung up`);
        break;
      }

      case "speech-update": {
        // Real-time speech updates (can be noisy, only log in debug mode)
        // console.log(`[Webhook] Speech update received`);
        break;
      }

      default: {
        console.log(`[Webhook] Unhandled event type: ${messageType}`);
      }
    }

    // Always return 200 OK to Vapi
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);

    // Still return 200 to prevent Vapi from retrying
    return NextResponse.json({
      received: true,
      error: error instanceof Error ? error.message : "Internal error",
    });
  }
}

/**
 * GET /api/vapi/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Vapi webhook endpoint is ready",
  });
}
