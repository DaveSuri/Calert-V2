import React, { useState, useEffect, useCallback } from 'react';
import type { User, Calendar, Settings, Event } from '../types';
import Header from './Header';
import Spinner from './Spinner';
import ToggleSwitch from './ToggleSwitch';
import { fetchCalendars, fetchUpcomingEvents } from '../services/googleCalendarApi';

// Fix: Add a type declaration for the `chrome` global variable to resolve TypeScript errors.
declare const chrome: any;

interface DashboardScreenProps {
  user: User;
  onLogout: () => void;
  savedSettings: Settings;
  onSettingsSave: (settings: Settings) => void;
  onNavigateToPricing: () => void;
  onNavigateToAccount: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout, savedSettings, onSettingsSave, onNavigateToPricing, onNavigateToAccount }) => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(savedSettings.selectedCalendarId);
  const [isEnabled, setIsEnabled] = useState(savedSettings.isEnabled);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [events, setEvents] = useState<Event[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [briefingsUsed, setBriefingsUsed] = useState(0);

  useEffect(() => {
    if (user.tier === 'free') {
        const usageKey = 'calert_briefing_usage';
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(usageKey, (result: any) => {
                if (result[usageKey]) {
                    const usage = result[usageKey];
                    // Check for monthly reset
                    if (usage.month === new Date().getMonth()) {
                        setBriefingsUsed(usage.count);
                    } else {
                        setBriefingsUsed(0);
                    }
                }
            });
        }
    }
  }, [user.tier]);

  const tierInfo = {
    free: {
        label: 'Free Plan',
        className: 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200',
    },
    pro: {
        label: 'Pro Plan',
        className: 'bg-indigo-100 text-brand-primary ring-1 ring-inset ring-indigo-200',
    },
    teams: {
        label: 'Teams Plan',
        className: 'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200',
    }
  }[user.tier];


  const loadCalendars = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedCalendars = await fetchCalendars(user.accessToken);
      setCalendars(fetchedCalendars);
      
      // If no calendar was previously selected, set a sensible default.
      if (!savedSettings.selectedCalendarId && fetchedCalendars.length > 0) {
          const primaryCalendar = fetchedCalendars.find(c => c.primary);
          if (primaryCalendar) {
            setSelectedCalendarId(primaryCalendar.id);
          } else {
            // If no primary calendar, default to the first one in the list.
            setSelectedCalendarId(fetchedCalendars[0].id);
          }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        setError('Your session has expired. Please log out and log in again to reconnect your calendar.');
      } else {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to fetch calendars. Please check your connection or API configuration. (Error: ${message})`);
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.accessToken, savedSettings.selectedCalendarId]);
  
  const loadEvents = useCallback(async () => {
    if (!selectedCalendarId) {
        setEvents([]);
        setIsEventsLoading(false);
        return;
    }
    try {
        setIsEventsLoading(true);
        setEventsError(null);
        const fetchedEvents = await fetchUpcomingEvents(user.accessToken, selectedCalendarId);
        setEvents(fetchedEvents);
    } catch (err) {
        setEventsError('Failed to load upcoming events.');
        console.error(err);
    } finally {
        setIsEventsLoading(false);
    }
  }, [user.accessToken, selectedCalendarId]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  useEffect(() => {
    if (selectedCalendarId) {
      loadEvents();
    }
  }, [selectedCalendarId, loadEvents]);

  useEffect(() => {
    if (selectedCalendarId !== savedSettings.selectedCalendarId || isEnabled !== savedSettings.isEnabled) {
      setIsDirty(true);
      setSaveStatus('idle');
    } else {
      setIsDirty(false);
    }
  }, [selectedCalendarId, isEnabled, savedSettings]);

  const handleSave = () => {
    setSaveStatus('saving');
    
    const newSettings: Settings = { selectedCalendarId, isEnabled };
    const dataToSync = {
        settings: newSettings,
        user: user,
    };

    // Save to the extension's synced storage if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(dataToSync, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving to chrome.storage.sync:", chrome.runtime.lastError);
          setSaveStatus('error');
        } else {
          console.log("Settings and user synced to extension.");
          onSettingsSave(newSettings);
          setSaveStatus('saved');
          setIsDirty(false);
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      });
    } else {
      // Fallback for local development outside the extension context
      console.warn("chrome.storage.sync not available. Saving to localStorage only.");
      onSettingsSave(newSettings);
      setSaveStatus('saved');
      setIsDirty(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const renderEventsList = () => {
    if (isEventsLoading) {
        return (
            <div className="flex justify-center items-center py-6">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    if (eventsError) {
        return <p className="mt-4 text-center text-sm text-red-600">{eventsError}</p>;
    }

    if (events.length === 0) {
        return <p className="mt-4 text-center text-sm text-gray-500">No upcoming events found for this calendar.</p>;
    }
    
    return (
        <ul className="space-y-4">
            {events.map(event => {
                const startTime = new Date(event.start);
                const eventDate = startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                const eventTime = startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                return (
                    <li key={event.id} className="border-l-4 border-brand-secondary pl-4">
                        <p className="font-semibold text-gray-800">{event.summary}</p>
                        <p className="text-sm text-gray-500">{eventDate} at {eventTime}</p>
                    </li>
                );
            })}
        </ul>
    );
  };
  
  return (
    <div className="min-h-screen bg-brand-light">
      <Header 
        user={user} 
        onLogout={onLogout} 
        onUpgradeClick={onNavigateToPricing} 
        onNavigateToAccount={onNavigateToAccount} 
      />
      <main className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4">Configuration</h2>
              {isLoading && <div className="py-8 flex justify-center"><Spinner /></div>}
              {error && <p className="mt-4 text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>}
              {!isLoading && !error && calendars.length > 0 && (
                <div className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="calendar-select" className="block text-sm font-medium text-gray-700">
                      Monitor Calendar
                    </label>
                    <select
                      id="calendar-select"
                      name="calendar"
                      value={selectedCalendarId || ''}
                      onChange={(e) => setSelectedCalendarId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-brand-primary focus:outline-none focus:ring-brand-primary sm:text-sm"
                    >
                      {calendars.map(cal => <option key={cal.id} value={cal.id}>{cal.summary}</option>)}
                    </select>
                  </div>
                  <ToggleSwitch
                    label="Enable Calert Notifications"
                    enabled={isEnabled}
                    onChange={setIsEnabled}
                  />
                </div>
              )}
               {!isLoading && !error && calendars.length === 0 && (
                  <p className="mt-6 text-gray-600">No calendars found. Please ensure you have at least one calendar in your Google account and have granted permission.</p>
               )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Status</h3>
              <div className="mt-4 space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Your Plan</span>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${tierInfo.className}`}>
                        {tierInfo.label}
                    </span>
                 </div>
                 {user.tier === 'free' && (
                   <div className="text-sm text-gray-600 border-t border-gray-200 pt-3">
                      <p>Briefings Used: <strong>{briefingsUsed} / 5</strong> this month.</p>
                      <button onClick={onNavigateToPricing} className="text-brand-primary font-semibold hover:underline">Upgrade to Pro</button>
                   </div>
                 )}
              </div>
              
              {isDirty && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="w-full flex justify-center items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:bg-gray-300"
                  >
                    {saveStatus === 'saving' && <Spinner className="w-4 h-4 mr-2" />}
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : 'Save Changes'}
                  </button>
                   {saveStatus === 'error' && <p className="mt-2 text-xs text-red-600">Failed to save settings.</p>}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Upcoming Events</h3>
              <div className="mt-4">
                {renderEventsList()}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardScreen;