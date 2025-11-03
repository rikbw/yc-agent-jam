"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Phone } from "lucide-react";
import type { Action } from "@/types/action";
import { ACTION_TYPE_LABELS } from "@/types/action";
import { completeAction } from "@/lib/actions";
import { createCall } from "@/lib/calls";
import { VapiCallDialog } from "@/components/vapi-call-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Call } from "@/types/call";

interface ActionCardProps {
  action: Action;
  calls: Call[];
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

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(minutes);
  const suffix = minutes >= 0 ? "from now" : "ago";

  if (absMinutes < 60) {
    const value = Math.max(absMinutes, 1);
    return `${value} minute${value === 1 ? "" : "s"} ${suffix}`;
  }

  const hours = Math.round(absMinutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ${suffix}`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ${suffix}`;
  }

  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ${suffix}`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ${suffix}`;
  }

  const years = Math.round(days / 365);
  const displayYears = Math.max(years, 1);
  return `${displayYears} year${displayYears === 1 ? "" : "s"} ${suffix}`;
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "call":
      return <Phone className="size-4" />;
    default:
      return <Calendar className="size-4" />;
  }
};

export function ActionCard({ action, companyData, calls }: ActionCardProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const scheduledRelative = formatRelativeTime(action.scheduledFor);
  const isOverdue = action.scheduledFor < new Date();

  const previousSummaries = calls
    .filter(call => call.summary)
    .map(call => call.summary!)
    .slice(0, 5); // Only keep last 5 summaries

  const handleStartCall = async () => {
    setIsStartingCall(true);

    try {
      // Create call in database before opening dialog
      const result = await createCall(companyData.id, companyData.ownerBankerId);

      if (result.success && result.callId) {
        setCallId(result.callId);
        setDialogOpen(true);
      } else {
        console.error("Failed to create call:", result.error);
      }
    } catch (error) {
      console.error("Error creating call:", error);
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleDialogClose = async (open: boolean) => {
    setDialogOpen(open);

    // When dialog closes, complete the action and refresh
    if (!open && callId) {
      try {
        await completeAction(action.id);
        router.refresh();
      } catch (error) {
        console.error("Error completing action:", error);
      }
    }
  };

  return (
    <div className="flex items-start gap-3 border bg-muted/30 p-4 rounded-lg">
      <Avatar className="size-9 shrink-0 border border-border/60">
        <AvatarFallback className="bg-muted/50">
          {getActionIcon(action.actionType)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            {action.title}
          </span>
          <Badge
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            variant="secondary"
          >
            {ACTION_TYPE_LABELS[action.actionType]}
          </Badge>
          {isOverdue && (
            <Badge
              className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200"
              variant="secondary"
            >
              Overdue
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>{scheduledRelative}</span>
          </div>
        </div>
        {action.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {action.description}
          </p>
        )}
        <div className="mt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartCall}
            disabled={isStartingCall}
            className="h-7 text-xs"
          >
            <Phone className="size-3 mr-1" />
            {isStartingCall ? "Preparing..." : "Call Now"}
          </Button>
        </div>
      </div>

      {callId && (
        <VapiCallDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          companyData={companyData}
          callId={callId}
          previousConversationSummaries={previousSummaries}
        />
      )}
    </div>
  );
}
