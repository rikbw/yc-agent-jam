"use client";

import { CallItem } from "@/components/call-item";
import type { Call } from "@/types/call";

interface CallsListProps {
  calls: Call[];
}

export function CallsList({ calls }: CallsListProps) {
  if (calls.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/10 py-12 text-sm text-muted-foreground">
        No calls yet. Start making outreach calls to track conversations here.
      </div>
    );
  }

  // Sort calls by date, most recent first
  const sortedCalls = [...calls].sort((a, b) => b.callDate.getTime() - a.callDate.getTime());

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="divide-y">
        {sortedCalls.map((call) => (
          <CallItem key={call.id} call={call} />
        ))}
      </div>
    </div>
  );
}
