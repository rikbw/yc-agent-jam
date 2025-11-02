import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Zod schemas for tool parameters
export const findFreeMeetingSlotSchema = z.object({
  preferredDate: z.string().describe("Preferred date in YYYY-MM-DD format"),
  timeRangeStart: z.string().describe("Earliest acceptable time in HH:MM format (24-hour)"),
  timeRangeEnd: z.string().describe("Latest acceptable time in HH:MM format (24-hour)"),
  durationMinutes: z.number().min(15).max(240).describe("Meeting duration in minutes"),
});

export const bookMeetingSlotSchema = z.object({
  date: z.string().describe("Meeting date in YYYY-MM-DD format"),
  time: z.string().describe("Meeting time in HH:MM format (24-hour)"),
  durationMinutes: z.number().min(15).max(240).describe("Meeting duration in minutes"),
  attendeeName: z.string().describe("Name of the person booking the meeting"),
  notes: z.string().optional().describe("Optional notes about the meeting"),
});

// Type exports for TypeScript
export type FindFreeMeetingSlotParams = z.infer<typeof findFreeMeetingSlotSchema>;
export type BookMeetingSlotParams = z.infer<typeof bookMeetingSlotSchema>;

// Helper to remove $schema property from generated JSON Schema
const cleanJsonSchema = (schema: { $schema?: string; type?: any }) => {
  const { $schema, ...cleaned } = schema;
  return cleaned;
};

// Tool definitions for Vapi - parameters are automatically derived from Zod schemas
export const vapiTools = [
  {
    type: "function" as const,
    function: {
      name: "find_free_meeting_slot",
      description: "Find available meeting slots based on preferred date and time range. Call this before booking a meeting to check availability.",
      parameters: cleanJsonSchema(zodToJsonSchema(findFreeMeetingSlotSchema, {
        target: "openAi",
        $refStrategy: "none"
      })),
    },
  },
  {
    type: "function" as const,
    function: {
      name: "book_meeting_slot",
      description: "Book a specific meeting slot. Only call this after finding available slots and getting confirmation from the attendee.",
      parameters: cleanJsonSchema(zodToJsonSchema(bookMeetingSlotSchema, {
        target: "openAi",
        $refStrategy: "none"
      })),
    },
  },
];

// Tool handler type for better type safety
export type ToolHandler = {
  find_free_meeting_slot: (params: FindFreeMeetingSlotParams, context: ToolContext) => Promise<string[]>;
  book_meeting_slot: (params: BookMeetingSlotParams, context: ToolContext) => Promise<{ success: boolean; confirmationId?: string }>;
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

// Validate and parse tool call arguments
export const parseToolCall = (toolName: string, argsString: string) => {
  const args = JSON.parse(argsString);

  switch (toolName) {
    case "find_free_meeting_slot":
      return findFreeMeetingSlotSchema.parse(args);
    case "book_meeting_slot":
      return bookMeetingSlotSchema.parse(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

// Tool implementations
const findFreeMeetingSlot = async (
  params: FindFreeMeetingSlotParams,
  context: ToolContext
): Promise<string[]> => {
  console.log("TOOL: Finding free meeting slots:", params);

  // Fake implementation - simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return hardcoded available slots
  const availableSlots = [
    `${params.preferredDate} at 10:00`,
    `${params.preferredDate} at 14:00`,
    `${params.preferredDate} at 16:00`,
  ];

  console.log("Found available slots:", availableSlots);

  // Note: Client-side tools can't return data to the model
  // This is just for logging/UI purposes
  return availableSlots;
};

const bookMeetingSlot = async (
  params: BookMeetingSlotParams,
  context: ToolContext
): Promise<{ success: boolean; confirmationId?: string }> => {
  console.log("TOOL: Booking meeting slot:", params);

  // Fake implementation - simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Return hardcoded success response
  const result = {
    success: true,
    confirmationId: `MTG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  };

  console.log("Meeting booked successfully:", result);

  // Note: Client-side tools can't return data to the model
  // This is just for logging/UI purposes
  return result;
};

// Main tool handler - call this from your component
export const handleToolCall = async (toolCall: any, context: ToolContext) => {
  const { function: fn } = toolCall;
  console.log(`Handling tool call: ${fn?.name}`, fn?.arguments);

  try {
    // Parse and validate arguments using Zod
    const params = parseToolCall(fn?.name, fn?.arguments);

    switch (fn?.name) {
      case "find_free_meeting_slot":
        return await findFreeMeetingSlot(params as FindFreeMeetingSlotParams, context);

      case "book_meeting_slot":
        return await bookMeetingSlot(params as BookMeetingSlotParams, context);

      default:
        console.warn(`Unknown tool call: ${fn?.name}`);
        return null;
    }
  } catch (error) {
    console.error("Error handling tool call:", error);
    throw error;
  }
};
