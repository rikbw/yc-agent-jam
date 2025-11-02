"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { MeetingBookingDialog } from "@/components/calendar/meeting-booking-dialog";
import { ConnectCalendarButton } from "@/components/calendar/connect-calendar-button";
import { columns } from "./columns";
import { listUpcomingMeetings } from "@/lib/calendar/actions";
import type { CalendarMeeting } from "@/lib/calendar/types";
import { CalendarPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  const fetchMeetings = async () => {
    try {
      setRefreshing(true);
      const response = await listUpcomingMeetings();

      if (response.success) {
        setMeetings(response.meetings);
      } else {
        toast.error(response.error || "Failed to fetch meetings");
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to fetch meetings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleMeetingBooked = () => {
    // Refresh the meetings list after booking
    fetchMeetings();
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Meetings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
              <p className="text-muted-foreground">
                View and manage your scheduled meetings with prospects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ConnectCalendarButton 
                onConnectionChange={setIsCalendarConnected}
              />
              {isCalendarConnected && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMeetings}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button onClick={() => setDialogOpen(true)}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    New Meeting
                  </Button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading meetings...</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={meetings}
              searchKey="summary"
              searchPlaceholder="Search meetings..."
            />
          )}
        </div>
      </SidebarInset>

      <MeetingBookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyName="New Prospect"
        onSuccess={handleMeetingBooked}
      />
    </SidebarProvider>
  );
}

