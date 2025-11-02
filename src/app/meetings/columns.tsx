"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ExternalLink, Calendar, Users, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import type { CalendarMeeting } from "@/lib/calendar/types";

export const columns: ColumnDef<CalendarMeeting>[] = [
  {
    accessorKey: "summary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Meeting" />
    ),
    cell: ({ row }) => {
      const meeting = row.original;
      return (
        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-medium max-w-[400px] truncate">
              {meeting.summary || "Untitled Meeting"}
            </div>
            {meeting.description && (
              <div className="text-sm text-muted-foreground max-w-[400px] truncate">
                {meeting.description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "dateTime",
    accessorFn: (row) => row.start.dateTime || row.start.date,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date & Time" />
    ),
    cell: ({ row }) => {
      const meeting = row.original;
      const startDateTime = meeting.start.dateTime || meeting.start.date;
      const endDateTime = meeting.end.dateTime || meeting.end.date;

      if (!startDateTime) return <span className="text-muted-foreground">—</span>;

      const isAllDay = !meeting.start.dateTime;

      return (
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-medium">
              {format(parseISO(startDateTime), "MMM d, yyyy")}
            </div>
            {!isAllDay && startDateTime && endDateTime && (
              <div className="text-sm text-muted-foreground">
                {format(parseISO(startDateTime), "h:mm a")} -{" "}
                {format(parseISO(endDateTime), "h:mm a")}
              </div>
            )}
            {isAllDay && (
              <div className="text-sm text-muted-foreground">All Day</div>
            )}
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.start.dateTime || rowA.original.start.date || "";
      const dateB = rowB.original.start.dateTime || rowB.original.start.date || "";
      return dateA.localeCompare(dateB);
    },
  },
  {
    accessorKey: "attendees",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Attendees" />
    ),
    cell: ({ row }) => {
      const attendees = row.original.attendees || [];
      
      if (attendees.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            {attendees.slice(0, 2).map((attendee, idx) => (
              <div key={idx} className="text-sm">
                {attendee.displayName || attendee.email}
                {attendee.responseStatus && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs"
                  >
                    {attendee.responseStatus}
                  </Badge>
                )}
              </div>
            ))}
            {attendees.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{attendees.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status || "confirmed";
      
      const statusColors: Record<string, string> = {
        confirmed: "bg-green-100 text-green-800",
        tentative: "bg-yellow-100 text-yellow-800",
        cancelled: "bg-red-100 text-red-800",
      };

      return (
        <Badge
          variant="secondary"
          className={statusColors[status] || ""}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "meetLink",
    header: "Meet Link",
    cell: ({ row }) => {
      const meeting = row.original;
      const meetLink = meeting.hangoutLink || meeting.htmlLink;

      if (!meetLink) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {meeting.hangoutLink ? "Join" : "View"}
          </a>
        </Button>
      );
    },
    enableSorting: false,
  },
];

