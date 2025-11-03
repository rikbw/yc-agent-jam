export type ActionType = "call" | "email";

export type ActionStatus = "pending" | "completed";

export type Action = {
  id: string;
  sellerCompanyId: string;
  actionType: ActionType;
  scheduledFor: Date;
  status: ActionStatus;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  call: "Call",
  email: "Email",
};

export const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  call: "bg-purple-50 text-purple-900 border-purple-100",
  email: "bg-blue-50 text-blue-900 border-blue-100",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
};
