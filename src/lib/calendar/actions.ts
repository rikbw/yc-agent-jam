'use server';

import { metorial } from '@/lib/metorial';
import { getOAuthSession } from './oauth-session';
import {
  AvailableSlotsRequestSchema,
  BookMeetingRequestSchema,
} from './schemas';
import type {
  AvailableSlotsResponse,
  BookMeetingResponse,
  ListMeetingsResponse,
  TimeSlot,
} from './types';

const CALENDAR_DEPLOYMENT_ID = process.env.METORIAL_GCALENDAR_ID!;

/**
 * Helper function to execute a tool call within an authenticated session
 */
async function executeToolInSession<T>(
  toolName: string,
  toolArgs: any
): Promise<T> {
  // Get the stored OAuth session ID
  const oauthSessionId = await getOAuthSession();
  
  if (!oauthSessionId) {
    throw new Error('No calendar connection found. Please connect your calendar first.');
  }

  // Execute tool within an MCP session
  return await metorial.mcp.withSession(
    {
      serverDeployments: [
        {
          serverDeploymentId: CALENDAR_DEPLOYMENT_ID,
          oauthSessionId: oauthSessionId,
        }
      ]
    },
    async (session) => {
      const toolManager = await session.getToolManager();
      return await toolManager.callTool(toolName, toolArgs);
    }
  );
}

/**
 * Get available time slots from Google Calendar
 * 
 * Uses the get_freebusy tool to check calendar availability and
 * calculates 30-minute slots that are free.
 */
export async function getAvailableSlots(
  startDate: string,
  endDate: string,
  timezone?: string
): Promise<AvailableSlotsResponse> {
  try {
    // Validate input
    const validated = AvailableSlotsRequestSchema.parse({
      startDate,
      endDate,
      timezone,
      duration: 30,
    });

    // Call get_freebusy tool within authenticated session
    const freeBusyData = await executeToolInSession<any>('get_freebusy', {
      calendarIds: ['primary'], // Array of calendar IDs
      timeMin: validated.startDate,
      timeMax: validated.endDate,
      timeZone: validated.timezone || 'UTC',
    });

    // Parse busy periods from MCP text response
    let busyPeriods: Array<{ start: string; end: string }> = [];
    
    if (freeBusyData?.content && Array.isArray(freeBusyData.content)) {
      // MCP returns { content: [{ type: "text", text: "..." }] } format
      const textContent = freeBusyData.content[0]?.text || '';
      
      // Parse text to extract busy periods
      // Format: "    2025-11-04T11:00:00Z - 2025-11-04T12:00:00Z"
      const busyRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*-\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/g;
      let match;
      
      while ((match = busyRegex.exec(textContent)) !== null) {
        busyPeriods.push({
          start: match[1],
          end: match[2],
        });
      }
    } else if (freeBusyData?.calendars?.primary?.busy) {
      // Standard Google Calendar API format (fallback)
      busyPeriods = freeBusyData.calendars.primary.busy;
    }

    const slots = calculateFreeSlots(
      validated.startDate,
      validated.endDate,
      busyPeriods,
      validated.duration
    );

    return {
      slots,
      success: true,
    };
  } catch (error) {
    return {
      slots: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Book a meeting in Google Calendar
 * 
 * Uses the create_event tool to create a new calendar event with
 * Google Meet conference link.
 */
export async function bookMeeting(data: {
  attendeeEmail: string;
  attendeeName: string;
  slotStart: string;
  slotEnd: string;
  companyId?: string;
  companyName: string;
  notes?: string;
  timezone?: string;
}): Promise<BookMeetingResponse> {
  try {
    // Validate input
    const validated = BookMeetingRequestSchema.parse(data);

    // Call create_event tool within authenticated session
    const eventData = await executeToolInSession<any>('create_event', {
      calendarId: 'primary',
      summary: `Meeting with ${validated.companyName}`,
      description: validated.notes || `Meeting with ${validated.attendeeName} from ${validated.companyName}`,
      start: {
        dateTime: validated.slotStart,
        timeZone: validated.timezone || 'UTC',
      },
      end: {
        dateTime: validated.slotEnd,
        timeZone: validated.timezone || 'UTC',
      },
      attendees: [
        {
          email: validated.attendeeEmail,
          displayName: validated.attendeeName,
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      conferenceDataVersion: 1,
    });

    return {
      eventId: eventData.id,
      meetLink: eventData.hangoutLink || eventData.conferenceData?.entryPoints?.[0]?.uri,
      success: true,
    };
  } catch (error) {
    return {
      eventId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List upcoming meetings from Google Calendar
 * 
 * Uses the list_events tool to fetch calendar events.
 */
export async function listUpcomingMeetings(
  startDate?: string,
  endDate?: string
): Promise<ListMeetingsResponse> {
  try {
    // Default to next 30 days if no dates provided
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const timeMin = startDate || now.toISOString();
    const timeMax = endDate || thirtyDaysLater.toISOString();

    // Call list_events tool within authenticated session
    const eventsData = await executeToolInSession<any>('list_events', {
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return {
      meetings: eventsData?.items || [],
      success: true,
    };
  } catch (error) {
    return {
      meetings: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper function to calculate free time slots from busy periods
 */
function calculateFreeSlots(
  startDate: string,
  endDate: string,
  busyPeriods: Array<{ start: string; end: string }>,
  durationMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const slotDuration = durationMinutes * 60 * 1000; // Convert to milliseconds

  // Sort busy periods and convert to Date objects
  const sortedBusy = busyPeriods
    .map(period => ({
      start: new Date(period.start),
      end: new Date(period.end),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let currentTime = new Date(start);

  // Round to next 30-minute mark
  const minutes = currentTime.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;
  currentTime.setMinutes(roundedMinutes, 0, 0);

  while (currentTime < end) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration);

    // Check if this slot overlaps with any busy period
    const isSlotBusy = sortedBusy.some(busy => {
      return (
        (currentTime >= busy.start && currentTime < busy.end) ||
        (slotEnd > busy.start && slotEnd <= busy.end) ||
        (currentTime <= busy.start && slotEnd >= busy.end)
      );
    });

    // Only add business hours slots (9 AM - 5 PM) on weekdays
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    const isBusinessHours = hour >= 9 && hour < 17;
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    if (!isSlotBusy && isBusinessHours && isWeekday && slotEnd <= end) {
      slots.push({
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        date: currentTime.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    // Move to next 30-minute slot
    currentTime = new Date(currentTime.getTime() + slotDuration);
  }

  return slots;
}

