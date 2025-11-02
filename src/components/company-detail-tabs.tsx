"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallsList } from "@/components/calls-list";
import { CallActivityItem } from "@/components/call-activity-item";
import type { Call } from "@/types/call";

interface CompanyDetailTabsProps {
  ownerBankerName: string;
  lastContactRelative: string;
  calls: Call[];
}

export function CompanyDetailTabs({ ownerBankerName, lastContactRelative, calls }: CompanyDetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "activity";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "activity") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl || window.location.pathname);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 pb-3">
        <TabsList className="h-auto gap-3 rounded-none border-0 bg-transparent p-0">
          <TabsTrigger
            value="activity"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
          >
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="calls"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
          >
            Calls
            <span className="ml-2 text-xs text-muted-foreground">{calls.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="emails"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
          >
            Emails
            <span className="ml-2 text-xs text-muted-foreground">0</span>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
          >
            Team
            <span className="ml-2 text-xs text-muted-foreground">1</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
          >
            Notes
            <span className="ml-2 text-xs text-muted-foreground">0</span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
          >
            Tasks
            <span className="ml-2 text-xs text-muted-foreground">0</span>
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
          >
            Files
            <span className="ml-2 text-xs text-muted-foreground">0</span>
          </TabsTrigger>
        </TabsList>

      </div>

      <TabsContent value="activity" className="flex flex-1 flex-col">
        {calls.length > 0 ? (
          <div className="flex-1 overflow-auto">
            {calls
              .sort((a, b) => b.callDate.getTime() - a.callDate.getTime())
              .map((call) => (
                <CallActivityItem key={call.id} call={call} />
              ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/10 px-6 py-12 text-sm text-muted-foreground">
            No activity yet. Calls and interactions will appear here.
          </div>
        )}
      </TabsContent>

      <TabsContent value="calls" className="flex flex-1 flex-col">
        <CallsList calls={calls} />
      </TabsContent>

      <TabsContent value="emails" className="flex flex-1 flex-col">
        <div className="flex-1 overflow-auto">
          <div className="flex flex-1 items-center justify-center bg-muted/10 py-12 text-sm text-muted-foreground">
            No emails yet.
          </div>
        </div>
      </TabsContent>

      <TabsContent value="team" className="flex flex-1 flex-col px-6 pb-6">
          <div className="py-10 text-center text-sm text-muted-foreground">
            Add more collaborators to keep everyone in sync.
          </div>
      </TabsContent>

      <TabsContent value="notes" className="flex flex-1 flex-col px-6 pb-6">
        <div className="flex flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
          No notes yet. Start capturing key learnings from calls or meetings.
        </div>
      </TabsContent>

      <TabsContent value="tasks" className="flex flex-1 flex-col px-6 pb-6">
        <div className="flex flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
          Tasks help your team stay aligned. Create one to get started.
        </div>
      </TabsContent>

      <TabsContent value="files" className="flex flex-1 flex-col px-6 pb-6">
        <div className="flex flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
          File management coming soon.
        </div>
      </TabsContent>
    </Tabs>
  );
}
