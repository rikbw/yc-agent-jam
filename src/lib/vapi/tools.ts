import { getCalendarMcpSession } from "../metorial-oauth";

// Simple parameter type - just text input for MCP tools
export interface SimpleToolParams {
  input: string;
}

// Tool definitions for Vapi - simplified to accept just text input
export const vapiTools = [
  {
    type: "function" as const,
    function: {
      name: "get_freebusy",
      description: "Check free/busy information for one or more calendars",
      parameters: {
        type: "object",
        properties: {
          calendarIds: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of calendar IDs to check"
          },
          timeMin: {
            type: "string",
            description: "Start time for the query (ISO 8601 format)"
          },
          timeMax: {
            type: "string",
            description: "End time for the query (ISO 8601 format)"
          }
        },
        required: ["calendarIds", "timeMin", "timeMax"]
      }
    }
  }
];

// Tool handler type for better type safety
export type ToolHandler = {
  find_free_meeting_slot: (params: SimpleToolParams, context: ToolContext) => Promise<any>;
  book_meeting_slot: (params: SimpleToolParams, context: ToolContext) => Promise<any>;
};

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


const getFreeBusy = async (params: any, context: ToolContext) => {
  console.log("TOOL: Getting free busy with params:", params);
  console.log("Context:", context);

  // Get Calendar MCP session
  const calendarSession = await getCalendarMcpSession();
  if (!calendarSession) {
    throw new Error('Calendar MCP session not available. Please connect Google Calendar in Settings.');
  }

  // Get tool manager and call the get_freebusy tool
  const toolManager = await calendarSession.getToolManager();
  const result = await toolManager.callTool('get_freebusy', params);


  console.log("Free/busy result:", result);
  return result;
};


// Main tool handler - call this from your component
export const handleToolCall = async (toolCall: any, context: ToolContext) => {
  const { function: fn } = toolCall;
  console.log(`Handling tool call: ${fn?.name}`, fn?.arguments);

  try {
    switch (fn?.name) {
      case "get_freebusy":
        return await getFreeBusy(fn?.arguments, context);

      default:
        console.warn(`Unknown tool call: ${fn?.name}`);
        return null;
    }
  } catch (error) {
    console.error("Error handling tool call:", error);
    throw error;
  }
};
