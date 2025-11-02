"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CallsList } from "@/components/calls-list";
import { CallActivityItem } from "@/components/call-activity-item";
import { ActionCard } from "@/components/action-card";
import type { Call } from "@/types/call";
import type { Action } from "@/types/action";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CompanyDetailTabsProps {
  ownerBankerName: string;
  lastContactRelative: string;
  calls: Call[];
  actions: Action[];
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

export function CompanyDetailTabs({ ownerBankerName, lastContactRelative, calls, actions, companyData }: CompanyDetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "activity";
  const [showUpcoming, setShowUpcoming] = useState(false);

  // Separate actions into current and upcoming
  const now = new Date();
  const currentActions = actions.filter((action) => action.scheduledFor <= now);
  const upcomingActions = actions.filter((action) => action.scheduledFor > now);

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
        {(currentActions.length > 0 || upcomingActions.length > 0 || calls.length > 0) ? (
          <div className="flex-1 overflow-auto">
            {/* Current Actions */}
            {currentActions.length > 0 && (
              <div className="space-y-3 p-4 border-b">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground px-1">
                  Current Actions
                </h3>
                {currentActions.map((action) => (
                  <ActionCard key={action.id} action={action} companyData={companyData} />
                ))}
              </div>
            )}

            {/* Upcoming Actions Toggle */}
            {upcomingActions.length > 0 && (
              <div className="border-b">
                <Button
                  variant="ghost"
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  className="w-full justify-between px-5 py-3 h-auto rounded-none hover:bg-muted/50"
                >
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Upcoming Actions ({upcomingActions.length})
                  </span>
                  {showUpcoming ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </Button>
                {showUpcoming && (
                  <div className="space-y-3 p-4 pt-2">
                    {upcomingActions.map((action) => (
                      <ActionCard key={action.id} action={action} companyData={companyData} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Calls */}
            {calls.length > 0 && (
              <div>
                {calls
                  .sort((a, b) => b.callDate.getTime() - a.callDate.getTime())
                  .map((call) => (
                    <CallActivityItem key={call.id} call={call} />
                  ))}
              </div>
            )}
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
