import type { Calendar, Event } from '../types';
import { SERVER_BASE_URL } from '../config';
import { apiFetch, UnauthorizedError } from './http';

interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
}

interface GoogleCalendarListResponse {
  items: GoogleCalendarListItem[];
}

interface GoogleCalendarEvent {
  id:string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

interface GoogleCalendarEventsResponse {
  items: GoogleCalendarEvent[];
}

// When the app is running as a web page on the same domain as the server,
// relative paths work fine. When it's running as a Chrome Extension,
// we must use the absolute URL of the deployed server.
const IS_EXTENSION = window.location.protocol === 'chrome-extension:';
const API_BASE_URL = IS_EXTENSION ? SERVER_BASE_URL : '';


/**
 * Fetches the list of calendars for the authenticated user via the backend proxy.
 * @param accessToken The user's Google OAuth 2.0 access token.
 * @returns A promise that resolves to an array of calendars.
 */
export const fetchCalendars = async (accessToken: string): Promise<Calendar[]> => {
  try {
    const data = await apiFetch(`${API_BASE_URL}/api/calendars`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      expectJson: true,
    }) as unknown as GoogleCalendarListResponse;

    if (!data.items) {
      return [];
    }

    // Map the API response to the application's internal Calendar type
    return data.items.map((item): Calendar => ({
      id: item.id,
      summary: item.summary,
      primary: !!item.primary,
    }));
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    console.error('Error from calendar proxy:', err);
    throw err instanceof Error ? err : new Error('Failed to fetch calendars');
  }
};

/**
 * Fetches the next 5 upcoming events for a given calendar via the backend proxy.
 * @param accessToken The user's Google OAuth 2.0 access token.
 * @param calendarId The ID of the calendar to fetch events from.
 * @returns A promise that resolves to an array of events.
 */
export const fetchUpcomingEvents = async (accessToken: string, calendarId: string): Promise<Event[]> => {
  if (!calendarId) {
    return [];
  }
  const encodedCalendarId = encodeURIComponent(calendarId);

  try {
    const data = await apiFetch(`${API_BASE_URL}/api/events?calendarId=${encodedCalendarId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      expectJson: true,
    }) as unknown as GoogleCalendarEventsResponse;

    if (!data.items) {
      return [];
    }

    return data.items
      .filter(item => item.start?.dateTime) // Filter out all-day events
      .map((item): Event => ({
        id: item.id,
        summary: item.summary || 'No Title',
        start: item.start.dateTime!,
        end: item.end.dateTime!,
      }));
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    console.error('Error from events proxy:', err);
    throw err instanceof Error ? err : new Error('Failed to fetch events');
  }
};