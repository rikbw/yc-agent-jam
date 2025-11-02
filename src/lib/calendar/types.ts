import { z } from 'zod';
import {
  AvailableSlotsRequestSchema,
  AvailableSlotsResponseSchema,
  TimeSlotSchema,
  BookMeetingRequestSchema,
  BookMeetingResponseSchema,
  CalendarMeetingSchema,
  ListMeetingsResponseSchema,
} from './schemas';

/**
 * Type for requesting available time slots
 */
export type AvailableSlotsRequest = z.infer<typeof AvailableSlotsRequestSchema>;

/**
 * Type for a single time slot
 */
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

/**
 * Type for available slots response
 */
export type AvailableSlotsResponse = z.infer<typeof AvailableSlotsResponseSchema>;

/**
 * Type for booking a meeting request
 */
export type BookMeetingRequest = z.infer<typeof BookMeetingRequestSchema>;

/**
 * Type for meeting booking response
 */
export type BookMeetingResponse = z.infer<typeof BookMeetingResponseSchema>;

/**
 * Type for a calendar meeting/event
 */
export type CalendarMeeting = z.infer<typeof CalendarMeetingSchema>;

/**
 * Type for list meetings response
 */
export type ListMeetingsResponse = z.infer<typeof ListMeetingsResponseSchema>;

