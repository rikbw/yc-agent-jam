import { runMetorialConversation } from "../metorial-oauth";
import { prisma } from "../prisma";

// Tool definitions for Vapi - just one calendar tool that handles everything
export const vapiTools = [
  {
    type: "function" as const,
    function: {
      name: "check_calendar",
      description: `Check availability, find free time slots, and manage calendar for the banker. Use this to answer questions about availability, schedule meetings, or check the calendar. When booking meetings, add a bunch of context in the request, like meeting title, description, time, who to invite, etc.`,
      parameters: {
        type: "object",
        properties: {
          request: {
            type: "string",
            description: "The calendar-related request or question (e.g., 'Am I free next Tuesday at 2pm?', 'Find a 30-minute slot this week', 'Check my calendar for tomorrow')"
          }
        },
        required: ["request"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_follow_up_call",
      description: "Schedule a follow-up call with the seller company. Use this when the prospect wants to schedule a future call or when you need to set up a reminder to call them back.",
      parameters: {
        type: "object",
        properties: {
          scheduledFor: {
            type: "string",
            description: "When to schedule the call. Can be an ISO date string or natural language like 'next Tuesday at 2pm', 'in 2 weeks', etc."
          },
          title: {
            type: "string",
            description: "Brief title for the call (e.g., 'Follow-up on valuation discussion', 'Q1 check-in call')"
          },
          description: {
            type: "string",
            description: "Optional notes or agenda items for the call"
          }
        },
        required: ["scheduledFor", "title"]
      }
    }
  }
];

// Context passed to tool handlers
export interface ToolContext {
  callId: string;
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

const checkCalendar = async (params: any, context: ToolContext) => {
  console.log("TOOL: Checking calendar with request:", params.request);
  console.log("Context:", context);

  try {
    // Use Metorial's API directly with the user's natural language request
    const result = await runMetorialConversation(params.request);

    console.log("Calendar result:", result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to check calendar');
    }

    return result.response;
  } catch (error) {
    console.error("Error checking calendar:", error);
    throw error;
  }
};

const scheduleFollowUpCall = async (params: any, context: ToolContext) => {
  console.log("TOOL: Scheduling follow-up call with params:", params);
  console.log("Context:", context);

  try {
    // Parse the scheduledFor date - JavaScript's Date constructor handles many formats
    const scheduledDate = new Date(params.scheduledFor);

    if (isNaN(scheduledDate.getTime())) {
      return {
        success: false,
        error: "Invalid date format. Please provide a valid date/time (e.g., '2025-01-15T14:00:00' or 'January 15, 2025 2:00 PM')"
      };
    }

    // Create the follow-up action in the database
    const action = await prisma.action.create({
      data: {
        sellerCompanyId: context.companyData.id,
        actionType: "call",
        scheduledFor: scheduledDate,
        title: params.title,
        description: params.description || null,
        status: "pending"
      }
    });

    console.log("Created follow-up action:", action);

    return {
      success: true,
      message: `Follow-up call scheduled for ${scheduledDate.toLocaleString()}`,
      actionId: action.id,
      scheduledFor: scheduledDate.toISOString()
    };
  } catch (error) {
    console.error("Error scheduling follow-up call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule follow-up call"
    };
  }
};

// Main tool handler - call this from your component
export const handleToolCall = async (toolCall: any, context: ToolContext) => {
  const { function: fn } = toolCall;
  console.log(`Handling tool call: ${fn?.name}`, fn?.arguments);

  try {
    switch (fn?.name) {
      case "check_calendar":
        return await checkCalendar(fn?.arguments, context);

      case "schedule_follow_up_call":
        return await scheduleFollowUpCall(fn?.arguments, context);

      default:
        console.warn(`Unknown tool call: ${fn?.name}`);
        return null;
    }
  } catch (error) {
    console.error("Error handling tool call:", error);
    throw error;
  }
};
