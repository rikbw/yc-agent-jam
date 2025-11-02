// Simple parameter type - just text input for MCP tools
export interface SimpleToolParams {
  input: string;
}

// Tool definitions for Vapi - simplified to accept just text input
export const vapiTools = [
  {
    type: "function" as const,
    function: {
      name: "find_free_meeting_slot",
      description: "Find available meeting slots based on user requirements. Call this before booking a meeting to check availability.",
      parameters: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "Natural language description of meeting requirements (e.g., 'next Tuesday afternoon for 1 hour')",
          },
        },
        required: ["input"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "book_meeting_slot",
      description: "Book a specific meeting slot. Only call this after finding available slots and getting confirmation.",
      parameters: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "Natural language description of the meeting to book (e.g., 'Tuesday at 2pm with John for 1 hour, discuss Q4 planning')",
          },
        },
        required: ["input"],
      },
    },
  },
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

// Parse tool call arguments - simplified for text input
export const parseToolCall = (toolName: string, argsString: string): SimpleToolParams => {
  const args = JSON.parse(argsString);

  if (!args.input || typeof args.input !== 'string') {
    throw new Error(`Tool ${toolName} requires a string 'input' parameter`);
  }

  return { input: args.input };
};

// Tool implementations - these will forward to MCP tools
const findFreeMeetingSlot = async (
  params: SimpleToolParams,
  context: ToolContext
): Promise<any> => {
  console.log("TOOL: Finding free meeting slots with input:", params.input);
  console.log("Context:", context);

  // TODO: Forward params.input to MCP tool
  // The input string contains the natural language requirements
  // Example: "next Tuesday afternoon for 1 hour"

  // For now, just log and return a placeholder
  return {
    status: "ready_for_mcp",
    tool: "find_free_meeting_slot",
    input: params.input,
    context,
  };
};

const bookMeetingSlot = async (
  params: SimpleToolParams,
  context: ToolContext
): Promise<any> => {
  console.log("TOOL: Booking meeting slot with input:", params.input);
  console.log("Context:", context);

  // TODO: Forward params.input to MCP tool
  // The input string contains the natural language booking request
  // Example: "Tuesday at 2pm with John for 1 hour, discuss Q4 planning"

  // For now, just log and return a placeholder
  return {
    status: "ready_for_mcp",
    tool: "book_meeting_slot",
    input: params.input,
    context,
  };
};

// Main tool handler - call this from your component
export const handleToolCall = async (toolCall: any, context: ToolContext) => {
  const { function: fn } = toolCall;
  console.log(`Handling tool call: ${fn?.name}`, fn?.arguments);

  try {
    // Parse and validate arguments
    const params = parseToolCall(fn?.name, fn?.arguments);

    switch (fn?.name) {
      case "find_free_meeting_slot":
        return await findFreeMeetingSlot(params, context);

      case "book_meeting_slot":
        return await bookMeetingSlot(params, context);

      default:
        console.warn(`Unknown tool call: ${fn?.name}`);
        return null;
    }
  } catch (error) {
    console.error("Error handling tool call:", error);
    throw error;
  }
};
