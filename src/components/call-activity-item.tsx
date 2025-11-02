"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone } from "lucide-react";
import type { Call } from "@/types/call";
import { CALL_OUTCOME_LABELS, CALL_OUTCOME_COLORS } from "@/types/call";

interface CallActivityItemProps {
  call: Call;
}

const getInitials = (value: string) => {
  if (!value) return "";
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(minutes);
  const suffix = minutes >= 0 ? "ago" : "from now";

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

export function CallActivityItem({ call }: CallActivityItemProps) {
  const callRelative = formatRelativeTime(call.callDate);

  return (
    <div className="flex items-start gap-3 border-b p-4 last:border-b-0">
      <Avatar className="size-9 shrink-0 border border-border/60">
        <AvatarFallback className="bg-muted/50">
          <Phone className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Call with {call.bankerName}
          </span>
          {call.outcome && (
            <Badge
              className={`${CALL_OUTCOME_COLORS[call.outcome]} rounded-full px-2 py-0.5 text-[10px] font-medium`}
              variant="secondary"
            >
              {CALL_OUTCOME_LABELS[call.outcome]}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{call.duration} min</span>
          </div>
          <span>•</span>
          <span>{callRelative}</span>
        </div>
        {call.notes && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{call.notes}</p>
        )}
      </div>
    </div>
  );
}
