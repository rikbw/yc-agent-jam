"use server";

import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { CallOutcome, MessageRole } from "@/generated/prisma/client";

// Lazy initialize OpenRouter client only when needed
let openrouterClient: ReturnType<typeof createOpenAI> | null = null;
const getOpenRouter = () => {
  if (!openrouterClient) {
    openrouterClient = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return openrouterClient;
};

const CallAnalysisSchema = z.object({
  outcome: z.enum([
    "productive",
    "no_answer",
    "voicemail",
    "scheduled_meeting",
    "not_interested",
  ]),
  summary: z.string().describe(
    "A concise 2-3 sentence summary of the call focusing on: the seller's interest level, key concerns or motivations mentioned, and next steps if any"
  ),
  interestLevel: z.number().min(0).max(100).describe(
    "Estimated interest level in selling their company (0-100)"
  ),
  keyPoints: z.array(z.string()).describe(
    "List of 3-5 key points or highlights from the conversation"
  ),
});

type CallAnalysis = z.infer<typeof CallAnalysisSchema>;

/**
 * Analyzes a call based on its messages and updates the call with outcome and summary
 * @param callId - The ID of the call to analyze
 * @returns The updated call with analysis results
 */
export async function analyzeCall(callId: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Fetch the call with its messages and related company info
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
      sellerCompany: {
        select: {
          name: true,
          industry: true,
          revenue: true,
          dealStage: true,
        },
      },
      banker: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!call) {
    throw new Error("Call not found");
  }

  if (!call.messages || call.messages.length === 0) {
    throw new Error("No messages found for this call");
  }

  // Build conversation transcript
  const transcript = call.messages
    .map((msg) => `${msg.role}: ${msg.transcript}`)
    .join("\n\n");

  const prompt = `You are analyzing a call between an M&A advisor (banker) and a potential seller company.
The advisor is trying to gauge the seller's interest in potentially selling their company.

Company Context:
- Company Name: ${call.sellerCompany.name}
- Industry: ${call.sellerCompany.industry}
- Revenue: $${call.sellerCompany.revenue.toLocaleString()}
- Current Deal Stage: ${call.sellerCompany.dealStage}
- Banker: ${call.banker.name}

Call Transcript:
${transcript}

Based on this conversation, analyze:
1. Call Outcome: What was the result of the call?
   - productive: Had a meaningful conversation about selling
   - no_answer: Nobody answered the call
   - voicemail: Left a voicemail message
   - scheduled_meeting: Successfully scheduled a follow-up meeting
   - not_interested: Seller explicitly declined interest

2. Summary: A brief summary of the conversation focusing on the seller's interest level, concerns, and next steps

3. Interest Level: How interested does the seller seem in selling (0-100)?

4. Key Points: Important takeaways from the conversation`;

  try {
    const { object: analysis } = await generateObject({
      model: getOpenRouter()("openai/gpt-4o-mini"),
      schema: CallAnalysisSchema,
      prompt,
    });

    // Update the call with the analysis results
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        outcome: analysis.outcome as CallOutcome,
        summary: analysis.summary,
        notes: `Interest Level: ${analysis.interestLevel}%\n\nKey Points:\n${analysis.keyPoints.map((p) => `- ${p}`).join("\n")}`,
      },
      include: {
        messages: true,
        sellerCompany: true,
        banker: true,
      },
    });

    return {
      success: true,
      call: updatedCall,
      analysis,
    };
  } catch (error) {
    console.error("Error analyzing call:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to analyze call. Please try again."
    );
  }
}

/**
 * Analyzes multiple calls in batch
 * @param callIds - Array of call IDs to analyze
 * @returns Results of all analyses
 */
export async function analyzeCallsBatch(callIds: string[]) {
  const results = await Promise.allSettled(
    callIds.map((id) => analyzeCall(id))
  );

  return {
    successful: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    results,
  };
}

/**
 * Get all calls for a seller company that haven't been analyzed yet
 * @param sellerCompanyId - The seller company ID
 * @returns Array of unanalyzed calls
 */
export async function getUnanalyzedCalls(sellerCompanyId: string) {
  return await prisma.call.findMany({
    where: {
      sellerCompanyId,
      summary: null,
    },
    include: {
      messages: true,
      banker: true,
    },
    orderBy: {
      callDate: "desc",
    },
  });
}

/**
 * Creates a new call record before starting a VAPI call
 * @param sellerCompanyId - The ID of the seller company being called
 * @param bankerId - The ID of the banker making the call
 * @returns The created call record with its ID
 */
export async function createCall(
  sellerCompanyId: string,
  bankerId: string
) {
  try {
    const call = await prisma.call.create({
      data: {
        sellerCompanyId,
        bankerId,
        callDate: new Date(),
        duration: 0, // Will be updated when call ends
      },
    });

    console.log(`Created call ${call.id} for company ${sellerCompanyId}`);
    return { success: true, callId: call.id };
  } catch (error) {
    console.error("Error creating call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create call"
    };
  }
}

/**
 * Creates a message record for a call transcript
 * @param callId - The ID of the call this message belongs to
 * @param role - The role of the speaker (assistant, user, or system)
 * @param transcript - The transcript text
 * @param timestamp - When the message occurred
 * @returns Success status
 */
export async function createMessage(
  callId: string,
  role: MessageRole,
  transcript: string,
  timestamp: Date
) {
  try {
    await prisma.message.create({
      data: {
        callId,
        role,
        transcript,
        timestamp,
      },
    });

    console.log(`Created message for call ${callId} (${role})`);
    return { success: true };
  } catch (error) {
    console.error("Error creating message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create message"
    };
  }
}

/**
 * Finalizes a call by updating its duration and triggering AI analysis
 * @param callId - The ID of the call to finalize
 * @param durationMinutes - The duration of the call in minutes
 * @returns Success status and analysis results if successful
 */
export async function finalizeCall(callId: string, durationMinutes: number) {
  try {
    // Update the call duration
    await prisma.call.update({
      where: { id: callId },
      data: { duration: Math.round(durationMinutes) },
    });

    console.log(`Finalized call ${callId} (${durationMinutes} minutes)`);

    // Trigger AI analysis
    try {
      const analysisResult = await analyzeCall(callId);
      console.log(`Successfully analyzed call ${callId}`);
      return { success: true, analysis: analysisResult };
    } catch (analysisError) {
      console.error("Error analyzing call:", analysisError);
      // Still return success since the call was finalized, even if analysis failed
      return {
        success: true,
        analysisError: analysisError instanceof Error ? analysisError.message : "Failed to analyze call"
      };
    }
  } catch (error) {
    console.error("Error finalizing call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to finalize call"
    };
  }
}
