export type CallOutcome =
  | "productive"
  | "no_answer"
  | "voicemail"
  | "scheduled_meeting"
  | "not_interested";

export type MessageRole = "assistant" | "user" | "system";

export type Message = {
  id: string;
  callId: string;
  role: MessageRole;
  transcript: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type Call = {
  id: string;
  sellerCompanyId: string;
  bankerId: string;
  bankerName: string;
  callDate: Date;
  duration: number; // in minutes
  outcome?: CallOutcome;
  notes?: string;
  summary?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  productive: "Productive",
  no_answer: "No Answer",
  voicemail: "Voicemail",
  scheduled_meeting: "Meeting Scheduled",
  not_interested: "Not Interested",
};

export const CALL_OUTCOME_COLORS: Record<CallOutcome, string> = {
  productive: "bg-green-100 text-green-800",
  no_answer: "bg-gray-100 text-gray-800",
  voicemail: "bg-blue-100 text-blue-800",
  scheduled_meeting: "bg-purple-100 text-purple-800",
  not_interested: "bg-red-100 text-red-800",
};
