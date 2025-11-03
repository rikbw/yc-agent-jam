"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Phone, Mail, ChevronDown, ChevronRight, PlayCircle, CheckCircle2 } from "lucide-react";
import { ACTION_TYPE_LABELS } from "@/types/action";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Action as PrismaAction, SellerCompany } from "@/generated/prisma/client";

type ActionWithCompany = PrismaAction & {
  sellerCompany: Pick<SellerCompany, "id" | "name" | "website">;
};

interface TasksListProps {
  pendingActions: ActionWithCompany[];
  completedActions: ActionWithCompany[];
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
    case "email":
      return <Mail className="size-4" />;
    default:
      return <Calendar className="size-4" />;
  }
};

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export function TasksList({ pendingActions, completedActions }: TasksListProps) {
  const router = useRouter();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  const handleExecuteTask = (actionId: string, companyId: string) => {
    setExecutingTaskId(actionId);
    // Navigate to company detail page where they can execute the action
    router.push(`/companies/${companyId}`);
  };

  const handleRunAllTasks = () => {
    if (pendingActions.length > 0) {
      // Navigate to the first task's company
      router.push(`/companies/${pendingActions[0].sellerCompany.id}`);
    }
  };

  const now = new Date();
  const overdueTasks = pendingActions.filter(action => action.scheduledFor < now);
  const upcomingTasks = pendingActions.filter(action => action.scheduledFor >= now);

  return (
    <div className="space-y-6">
      {/* Pending Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pending Tasks</h2>
            <p className="text-sm text-muted-foreground">
              {pendingActions.length} task{pendingActions.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
          {pendingActions.length > 0 && (
            <Button onClick={handleRunAllTasks} size="sm" className="gap-2">
              <PlayCircle className="size-4" />
              Run All Tasks
            </Button>
          )}
        </div>

        {pendingActions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">No pending tasks</h3>
            <p className="text-sm text-muted-foreground">
              All tasks have been completed. Great work!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                  Overdue ({overdueTasks.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  {overdueTasks.map((action, index) => (
                    <TaskCard
                      key={action.id}
                      action={action}
                      onExecute={handleExecuteTask}
                      isExecuting={executingTaskId === action.id}
                      isOverdue={true}
                      isFirst={index === 0}
                      isLast={index === overdueTasks.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide px-1"
                >
                  {showUpcoming ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                  Upcoming ({upcomingTasks.length})
                </button>
                {showUpcoming && (
                  <div className="border rounded-lg overflow-hidden">
                    {upcomingTasks.map((action, index) => (
                      <TaskCard
                        key={action.id}
                        action={action}
                        onExecute={handleExecuteTask}
                        isExecuting={executingTaskId === action.id}
                        isOverdue={false}
                        isFirst={index === 0}
                        isLast={index === upcomingTasks.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completed Tasks Section */}
      {completedActions.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide px-1"
          >
            {showCompleted ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Recently Completed ({completedActions.length})
          </button>

          {showCompleted && (
            <div className="border rounded-lg overflow-hidden">
              {completedActions.map((action, index) => (
                <CompletedTaskCard
                  key={action.id}
                  action={action}
                  isFirst={index === 0}
                  isLast={index === completedActions.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskCardProps {
  action: ActionWithCompany;
  onExecute: (actionId: string, companyId: string) => void;
  isExecuting: boolean;
  isOverdue: boolean;
  isFirst: boolean;
  isLast: boolean;
}

function TaskCard({ action, onExecute, isExecuting, isOverdue, isFirst, isLast }: TaskCardProps) {
  const scheduledRelative = formatRelativeTime(action.scheduledFor);

  return (
    <div
      className={`flex items-start gap-3 p-3 transition-colors bg-muted/30 ${!isLast ? "border-b" : ""}`}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-background">
          {getActionIcon(action.actionType)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/companies/${action.sellerCompany.id}`}
            className="text-sm font-medium hover:underline"
          >
            {action.sellerCompany.name}
          </Link>
          <Badge
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            variant="secondary"
          >
            {ACTION_TYPE_LABELS[action.actionType]}
          </Badge>
          {isOverdue && (
            <Badge
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              variant="secondary"
            >
              Overdue
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {action.title}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>{scheduledRelative}</span>
          </div>
          <span>•</span>
          <span>{formatDateTime(action.scheduledFor)}</span>
        </div>
        <div className="mt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExecute(action.id, action.sellerCompany.id)}
            disabled={isExecuting}
            className="h-6 text-xs"
          >
            {getActionIcon(action.actionType)}
            <span className="ml-1">
              {isExecuting ? "Opening..." : action.actionType === "call" ? "Call Now" : "Send Email"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CompletedTaskCardProps {
  action: ActionWithCompany;
  isFirst: boolean;
  isLast: boolean;
}

function CompletedTaskCard({ action, isFirst, isLast }: CompletedTaskCardProps) {
  const completedTime = formatRelativeTime(action.updatedAt);

  return (
    <div className={`flex items-start gap-3 p-3 bg-muted/20 ${!isLast ? "border-b" : ""}`}>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-background">
          {getActionIcon(action.actionType)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/companies/${action.sellerCompany.id}`}
            className="text-sm font-medium hover:underline"
          >
            {action.sellerCompany.name}
          </Link>
          <Badge
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            variant="secondary"
          >
            {ACTION_TYPE_LABELS[action.actionType]}
          </Badge>
          <Badge
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            variant="secondary"
          >
            <CheckCircle2 className="size-3 mr-1" />
            Completed
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {action.title}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>Completed {completedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
