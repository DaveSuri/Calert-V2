// Popup handles opening settings, so keep click minimal.
chrome.action.onClicked.addListener(() => chrome.action.openPopup());

const ALARM_NAME_PREFIX = 'calert-';

/**
 * Fetches upcoming events from the selected Google Calendar, finds the next
 * valid event, and schedules a Chrome alarm to trigger a notification for it.
 */
async function scheduleNextAlarm() {
  // Clear all previous Calert alarms to ensure we only have one scheduled.
  const allAlarms = await chrome.alarms.getAll();
  allAlarms.forEach(alarm => {
    if (alarm.name.startsWith(ALARM_NAME_PREFIX)) {
      chrome.alarms.clear(alarm.name);
    }
  });

  const { settings } = await chrome.storage.sync.get(['settings']);
  
  if (!settings || !settings.isEnabled || !settings.selectedCalendarId) {
    console.log('Calert is disabled, not configured, or user is not logged in. No alarm scheduled.');
    return;
  }

  const calendarId = encodeURIComponent(settings.selectedCalendarId);
  const timeMin = new Date().toISOString();
  
  try {
    const accessToken = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&maxResults=10&singleEvents=true&orderBy=startTime`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Calert: Unauthorized. Access token may be expired. Please re-login.");
        // Visually indicate an error on the extension icon.
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#D92D20' });
      } else {
        throw new Error(`Google API request failed with status: ${response.status}`);
      }
      return;
    }

    // Reset badge on success
    chrome.action.setBadgeText({ text: '' });
    
    const data = await response.json();
    const now = new Date();

    // Find the next event that starts in the future and is not an all-day event.
    const nextEvent = data.items?.find(event => {
      if (!event.start.dateTime) return false; // Ignore all-day events
      return new Date(event.start.dateTime) > now;
    });

    if (nextEvent) {
      const eventStartTime = new Date(nextEvent.start.dateTime).getTime();
      const alarmInfo = {
        title: nextEvent.summary,
        startTime: new Date(nextEvent.start.dateTime).toISOString(),
        endTime: new Date(nextEvent.end.dateTime).toISOString(),
        hangoutLink: nextEvent.hangoutLink || null,
        description: nextEvent.description || null,
      };

      const alarmName = `${ALARM_NAME_PREFIX}${nextEvent.id}`;
      chrome.alarms.create(alarmName, { when: eventStartTime });

      // Store event data temporarily for the alarm listener to retrieve.
      await chrome.storage.local.set({ [alarmName]: alarmInfo });

      console.log(`Calert: Alarm scheduled for "${nextEvent.summary}" at ${new Date(eventStartTime).toLocaleString()}`);
    } else {
      console.log('Calert: No upcoming events found.');
    }
  } catch (error) {
    console.error('Calert: Error fetching calendar events:', error);
  }
}

// Listener for when an alarm created by this extension fires.
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_NAME_PREFIX)) return;
  
  const eventData = await chrome.storage.local.get(alarm.name);
  if (eventData && eventData[alarm.name]) {
    const info = eventData[alarm.name];
    
    const url = new URL(chrome.runtime.getURL('calert_tab.html'));
    url.searchParams.append('title', info.title || 'Calendar Event');
    url.searchParams.append('startTime', info.startTime);
    url.searchParams.append('endTime', info.endTime);
    if (info.hangoutLink) {
        url.searchParams.append('hangoutLink', info.hangoutLink);
    }
    if (info.description) {
        url.searchParams.append('description', info.description);
    }
    
    chrome.tabs.create({ url: url.href, active: true });

    // Clean up the stored event data after creating the tab.
    chrome.storage.local.remove(alarm.name);
  }
  
  // Immediately try to schedule the next alarm.
  scheduleNextAlarm();
});

// Schedule alarms when settings change, on browser startup, or when the extension is installed.
chrome.runtime.onStartup.addListener(scheduleNextAlarm);
chrome.runtime.onInstalled.addListener(scheduleNextAlarm);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.settings || changes.user)) {
    console.log('Calert: Settings or user changed, rescheduling alarm.');
    scheduleNextAlarm();
  }
});

// Allow popup to request reschedule
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'calert-reschedule') {
    scheduleNextAlarm();
  }
});

// Get a Google OAuth token using chrome.identity
async function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        const err = chrome.runtime.lastError?.message || 'No token';
        console.warn('Calert: getAuthToken failed:', err);
        if (!interactive) {
          // Try once interactively to prompt user
          chrome.identity.getAuthToken({ interactive: true }, (tok2) => {
            if (chrome.runtime.lastError || !tok2) {
              reject(chrome.runtime.lastError?.message || 'No token');
            } else {
              resolve(tok2);
            }
          });
        } else {
          reject(err);
        }
      } else {
        resolve(token);
      }
    });
  });
}