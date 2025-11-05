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
  productive: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  no_answer: "bg-muted/40 text-muted-foreground border border-border",
  voicemail: "bg-muted/40 text-muted-foreground border border-border",
  scheduled_meeting: "bg-blue-50 text-blue-700 border border-blue-200",
  not_interested: "bg-muted/40 text-muted-foreground border border-border",
};
