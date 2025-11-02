import { z } from 'zod';

/**
 * Schema for requesting available time slots
 */
export const AvailableSlotsRequestSchema = z.object({
  startDate: z.string().datetime().describe('Start date in ISO 8601 format'),
  endDate: z.string().datetime().describe('End date in ISO 8601 format'),
  timezone: z.string().optional().describe('Timezone (e.g., "America/New_York"). Defaults to user browser timezone'),
  duration: z.number().default(30).describe('Meeting duration in minutes (default: 30)'),
});

/**
 * Schema for a single time slot
 */
export const TimeSlotSchema = z.object({
  start: z.string().datetime().describe('Slot start time in ISO 8601 format'),
  end: z.string().datetime().describe('Slot end time in ISO 8601 format'),
  date: z.string().optional().describe('Human-readable date (e.g., "Monday, Jan 15")'),
});

/**
 * Schema for available slots response
 */
export const AvailableSlotsResponseSchema = z.object({
  slots: z.array(TimeSlotSchema),
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Schema for booking a meeting
 */
export const BookMeetingRequestSchema = z.object({
  attendeeEmail: z.string().email().describe('Prospect email address'),
  attendeeName: z.string().min(1).describe('Prospect full name'),
  slotStart: z.string().datetime().describe('Meeting start time in ISO 8601 format'),
  slotEnd: z.string().datetime().describe('Meeting end time in ISO 8601 format'),
  companyId: z.string().optional().describe('Company ID from database'),
  companyName: z.string().min(1).describe('Company name'),
  notes: z.string().optional().describe('Meeting notes or agenda'),
  timezone: z.string().optional().describe('Timezone for the meeting'),
});

/**
 * Schema for meeting booking response
 */
export const BookMeetingResponseSchema = z.object({
  eventId: z.string().describe('Google Calendar event ID'),
  meetLink: z.string().url().optional().describe('Google Meet link'),
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Schema for a calendar meeting/event
 */
export const CalendarMeetingSchema = z.object({
  id: z.string().describe('Google Calendar event ID'),
  summary: z.string().describe('Meeting title/summary'),
  description: z.string().optional().nullable(),
  start: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  attendees: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
    responseStatus: z.string().optional(),
  })).optional().nullable(),
  hangoutLink: z.string().url().optional().nullable(),
  htmlLink: z.string().url().optional().nullable(),
  status: z.string().optional(),
  created: z.string().optional(),
});

/**
 * Schema for list meetings response
 */
export const ListMeetingsResponseSchema = z.object({
  meetings: z.array(CalendarMeetingSchema),
  success: z.boolean(),
  error: z.string().optional(),
});

