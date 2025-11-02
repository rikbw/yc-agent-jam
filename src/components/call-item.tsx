"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Clock, Phone } from "lucide-react";
import type { Call } from "@/types/call";
import { CALL_OUTCOME_LABELS, CALL_OUTCOME_COLORS } from "@/types/call";

interface CallItemProps {
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

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export function CallItem({ call }: CallItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const callDateFormatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(call.callDate);

  const callRelative = formatRelativeTime(call.callDate);

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30"
      >
        <Avatar className="size-10 shrink-0 border border-border/60">
          <AvatarFallback>{getInitials(call.bankerName)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{call.bankerName}</span>
              </div>
              <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                {callDateFormatted} • {callRelative}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {call.outcome && (
                <Badge
                  className={`${CALL_OUTCOME_COLORS[call.outcome]} rounded-full px-2.5 py-0.5 text-xs font-medium`}
                  variant="secondary"
                >
                  {CALL_OUTCOME_LABELS[call.outcome]}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{call.duration} min</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </div>
          </div>
          {call.notes && !isExpanded && (
            <p className="line-clamp-1 text-sm text-muted-foreground">{call.notes}</p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t bg-muted/10 px-4 pb-4">
          {call.notes && (
            <div className="mb-4 mt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Notes</h4>
              <p className="text-sm text-foreground">{call.notes}</p>
            </div>
          )}

          {call.messages.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                Transcript ({call.messages.length} message{call.messages.length === 1 ? "" : "s"})
              </h4>
              <div className="space-y-3">
                {call.messages
                  .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "assistant" ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`flex max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2 border ${
                          message.role === "assistant"
                            ? "bg-muted/50"
                            : "bg-background"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                            {message.role === "assistant" ? "AI Agent" : "Contact"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.transcript}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
