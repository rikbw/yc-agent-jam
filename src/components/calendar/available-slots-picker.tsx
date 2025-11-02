"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TimeSlot } from "@/lib/calendar/types";
import { Clock } from "lucide-react";

interface AvailableSlotsPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  timezone?: string;
}

export function AvailableSlotsPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: AvailableSlotsPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = format(parseISO(slot.start), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Get dates that have available slots
  const datesWithSlots = Object.keys(slotsByDate).map((date) => parseISO(date));

  // Get slots for selected date
  const slotsForSelectedDate = selectedDate
    ? slotsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select a Date</CardTitle>
          <CardDescription>
            {slots.length > 0 
              ? `${Object.keys(slotsByDate).length} dates available with ${slots.length} total slots`
              : "No dates with available slots"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => {
              // Disable dates that don't have slots
              const dateStr = format(date, "yyyy-MM-dd");
              return !slotsByDate[dateStr];
            }}
            modifiers={{
              available: datesWithSlots,
            }}
            modifiersClassNames={{
              available: "bg-primary/10 font-semibold",
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Choose a Time</CardTitle>
          <CardDescription>
            {selectedDate
              ? `${slotsForSelectedDate.length} slots available on ${format(selectedDate, "MMM d, yyyy")}`
              : "← Select a date first to see times"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a date to view available time slots</p>
              </div>
            </div>
          ) : slotsForSelectedDate.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <p>No available slots for this date</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {slotsForSelectedDate.map((slot) => {
                  const isSelected =
                    selectedSlot?.start === slot.start &&
                    selectedSlot?.end === slot.end;
                  const startTime = format(parseISO(slot.start), "h:mm a");
                  const endTime = format(parseISO(slot.end), "h:mm a");

                  return (
                    <Button
                      key={slot.start}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => onSelectSlot(slot)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {startTime} - {endTime}
                      {isSelected && (
                        <Badge variant="secondary" className="ml-auto">
                          Selected
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Timezone indicator */}
      <div className="md:col-span-2">
        <p className="text-sm text-muted-foreground text-center">
          All times shown in {timezone}
        </p>
      </div>
    </div>
  );
}

