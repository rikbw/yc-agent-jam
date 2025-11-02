"use server";

import { handleToolCall, type ToolContext } from "./tools";

// Server action wrapper for handling tool calls
// This ensures tool calls run on the server where they have access to MCP sessions
export async function handleToolCallAction(
  toolCall: any,
  context: ToolContext
) {
  return await handleToolCall(toolCall, context);
}
