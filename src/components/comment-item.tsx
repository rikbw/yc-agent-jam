"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Comment } from "@/types/comment";
import { getAvatarUrl } from "@/lib/utils";

interface CommentItemProps {
  comment: Comment;
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

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0 border border-border/60">
        <AvatarImage src={getAvatarUrl(comment.authorName)} alt={comment.authorName} />
        <AvatarFallback className="text-xs">
          {getInitials(comment.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex max-w-[80%] flex-col gap-1 rounded-lg border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground">
            {comment.authorName}
          </span>
          <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}
