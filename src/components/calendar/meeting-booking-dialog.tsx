"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { AvailableSlotsPicker } from "./available-slots-picker";
import { getAvailableSlots, bookMeeting } from "@/lib/calendar/actions";
import type { TimeSlot } from "@/lib/calendar/types";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const meetingFormSchema = z.object({
  attendeeEmail: z.string().email("Please enter a valid email address"),
  attendeeName: z.string().min(1, "Name is required"),
  notes: z.string().optional(),
});

type MeetingFormValues = z.infer<typeof meetingFormSchema>;

interface MeetingBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  companyName: string;
  prospectEmail?: string;
  prospectName?: string;
  onSuccess?: () => void;
}

export function MeetingBookingDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  prospectEmail = "",
  prospectName = "",
  onSuccess,
}: MeetingBookingDialogProps) {
  const [step, setStep] = useState<"slots" | "details" | "success">("slots");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingMeeting, setBookingMeeting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [meetingDetails, setMeetingDetails] = useState<{
    eventId: string;
    meetLink?: string;
  } | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      attendeeEmail: prospectEmail,
      attendeeName: prospectName,
      notes: "",
    },
  });

  // Fetch available slots when dialog opens
  const handleFetchSlots = async () => {
    setLoadingSlots(true);
    try {
      // Fetch slots for the next 14 days
      const startDate = new Date();
      const endDate = addDays(startDate, 14);

      const response = await getAvailableSlots(
        startDate.toISOString(),
        endDate.toISOString(),
        timezone
      );

      if (response.success) {
        setAvailableSlots(response.slots);
        if (response.slots.length === 0) {
          toast.warning("No available slots found in the next 14 days. Your calendar might be fully booked.");
        } else {
          toast.success(`Found ${response.slots.length} available time slots`);
        }
      } else {
        toast.error(response.error || "Failed to fetch available slots");
      }
    } catch (error) {
      toast.error("Failed to fetch available slots");
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Load slots when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      setStep("slots");
      setSelectedSlot(null);
      setMeetingDetails(null);
      form.reset({
        attendeeEmail: prospectEmail,
        attendeeName: prospectName,
        notes: "",
      });
      handleFetchSlots();
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleContinueToDetails = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    setStep("details");
  };

  const onSubmit = async (values: MeetingFormValues) => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    setBookingMeeting(true);
    try {
      const response = await bookMeeting({
        attendeeEmail: values.attendeeEmail,
        attendeeName: values.attendeeName,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        companyId,
        companyName,
        notes: values.notes,
        timezone,
      });

      if (response.success) {
        setMeetingDetails({
          eventId: response.eventId,
          meetLink: response.meetLink,
        });
        setStep("success");
        toast.success("Meeting booked successfully!");
        onSuccess?.();
      } else {
        toast.error(response.error || "Failed to book meeting");
      }
    } catch (error) {
      toast.error("Failed to book meeting");
      console.error(error);
    } finally {
      setBookingMeeting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === "slots" && (
          <>
            <DialogHeader>
              <DialogTitle>Schedule Meeting with {companyName}</DialogTitle>
              <DialogDescription>
                {availableSlots.length > 0 
                  ? `Step 1: Select a date, then choose a time slot (${availableSlots.length} slots available)`
                  : "Loading available time slots..."
                }
              </DialogDescription>
            </DialogHeader>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Spinner className="h-8 w-8 mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading available slots...</p>
                </div>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex items-center justify-center py-12 border rounded-lg">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium mb-2">No Available Slots</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Your calendar appears to be fully booked for the next 14 days,
                    or all available slots are outside business hours (9 AM - 5 PM, weekdays).
                  </p>
                </div>
              </div>
            ) : (
              <AvailableSlotsPicker
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSlotSelect}
                timezone={timezone}
              />
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedSlot && (
                <div className="text-sm text-muted-foreground">
                  Selected: {format(parseISO(selectedSlot.start), "MMM d, h:mm a")} - {format(parseISO(selectedSlot.end), "h:mm a")}
                </div>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleContinueToDetails}
                  disabled={!selectedSlot || loadingSlots}
                >
                  Continue {selectedSlot ? "→" : "(Select a slot)"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {step === "details" && selectedSlot && (
          <>
            <DialogHeader>
              <DialogTitle>Meeting Details</DialogTitle>
              <DialogDescription>
                {format(parseISO(selectedSlot.start), "EEEE, MMMM d, yyyy")} at{" "}
                {format(parseISO(selectedSlot.start), "h:mm a")} -{" "}
                {format(parseISO(selectedSlot.end), "h:mm a")}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="attendeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendee Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attendeeEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendee Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A calendar invite will be sent to this email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add agenda items or notes for the meeting..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("slots")}
                    disabled={bookingMeeting}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={bookingMeeting}>
                    {bookingMeeting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Book Meeting
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {step === "success" && meetingDetails && selectedSlot && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Meeting Booked!
              </DialogTitle>
              <DialogDescription>
                Your meeting has been successfully scheduled
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(parseISO(selectedSlot.start), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedSlot.start), "h:mm a")} -{" "}
                      {format(parseISO(selectedSlot.end), "h:mm a")} ({timezone})
                    </p>
                  </div>
                </div>
              </div>

              {meetingDetails.meetLink && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">Google Meet Link:</p>
                  <a
                    href={meetingDetails.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {meetingDetails.meetLink}
                  </a>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                A calendar invite has been sent to the attendee. You can find this
                meeting in your Google Calendar.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

