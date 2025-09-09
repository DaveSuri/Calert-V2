import type { Calendar, Event } from '../types';

interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
}

interface GoogleCalendarListResponse {
  items: GoogleCalendarListItem[];
}

interface GoogleCalendarEvent {
  id: string;
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

/**
 * Fetches the list of calendars for the authenticated user via the backend proxy.
 * @param accessToken The user's Google OAuth 2.0 access token.
 * @returns A promise that resolves to an array of calendars.
 */
export const fetchCalendars = async (accessToken: string): Promise<Calendar[]> => {
  const response = await fetch('/api/calendars', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
       // The token is invalid or expired. The UI should prompt for re-authentication.
       throw new Error('Unauthorized');
    }
    const errorText = await response.text();
    console.error("Error from calendar proxy:", errorText);
    throw new Error(`API request failed with status: ${response.status}`);
  }

  const data: GoogleCalendarListResponse = await response.json();

  if (!data.items) {
    return [];
  }

  // Map the API response to the application's internal Calendar type
  return data.items.map((item): Calendar => ({
    id: item.id,
    summary: item.summary,
    primary: !!item.primary,
  }));
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

  const response = await fetch(`/api/events?calendarId=${encodedCalendarId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
       throw new Error('Unauthorized');
    }
    const errorText = await response.text();
    console.error("Error from events proxy:", errorText);
    throw new Error(`API request failed with status: ${response.status}`);
  }

  const data: GoogleCalendarEventsResponse = await response.json();

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
};