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
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout, savedSettings, onSettingsSave }) => {
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
        setError('Failed to fetch calendars. Please check your connection and try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.accessToken, savedSettings.selectedCalendarId]);
  
  const loadEvents = useCallback(async () => {
    if (!selectedCalendarId) {
        setEvents([]);
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
        accessToken: user.accessToken,
    };

    // Save to the extension's synced storage if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(dataToSync, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving to chrome.storage.sync:", chrome.runtime.lastError);
          setSaveStatus('error');
        } else {
          console.log("Settings synced to extension.");
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
        return <p className="mt-4 text-center text-sm text-gray-500">No upcoming events found.</p>;
    }
    
    const nextEventId = events.length > 0 ? events[0].id : null;

    return (
        <ul className="mt-4 space-y-3">
            {events.map(event => {
                const isNextEvent = event.id === nextEventId;
                const startTime = new Date(event.start);

                return (
                    <li key={event.id} className={`p-4 rounded-lg flex items-start space-x-4 ${isNextEvent ? 'bg-indigo-50 border border-brand-primary' : 'bg-gray-50'}`}>
                        <div className="flex-shrink-0">
                            <div className="flex flex-col items-center justify-center h-12 w-12 rounded-md bg-white shadow-sm border border-gray-200">
                                <span className="text-sm font-semibold text-brand-primary uppercase">{startTime.toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-xl font-bold text-gray-800">{startTime.getDate()}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-gray-900 truncate ${isNextEvent ? 'text-brand-dark' : ''}`}>{event.summary}</p>
                            <p className="text-sm text-gray-500">
                                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        {isNextEvent && (
                           <div className="flex-shrink-0 self-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Next alarm
                                </span>
                           </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
            <Spinner className="w-12 h-12" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-lg">
            <p className="font-semibold">An Error Occurred</p>
            <p>{error}</p>
        </div>
      );
    }

    if (calendars.length === 0) {
      return (
        <div className="text-center py-10 text-gray-600">
            <p className="font-semibold">No Calendars Found</p>
            <p>We couldn't find any calendars for this Google account.</p>
        </div>
      );
    }

    return (
      <>
        <div>
            <h2 className="text-xl font-semibold text-gray-900">Calendar to Monitor</h2>
            <p className="mt-1 text-sm text-gray-500">Calert will watch for events on this calendar.</p>
            <fieldset className="mt-4">
                <legend className="sr-only">Calendar selection</legend>
                <div className="space-y-4">
                    {calendars.map((calendar) => (
                        <div key={calendar.id} className="flex items-center">
                            <input
                                id={calendar.id}
                                name="calendar-selection"
                                type="radio"
                                checked={selectedCalendarId === calendar.id}
                                onChange={() => setSelectedCalendarId(calendar.id)}
                                className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-brand-secondary"
                            />
                            <label htmlFor={calendar.id} className="ml-3 block text-sm font-medium text-gray-700">
                                {calendar.summary}
                                {calendar.primary && <span className="text-xs text-brand-primary font-bold ml-2">(Primary)</span>}
                            </label>
                        </div>
                    ))}
                </div>
            </fieldset>
        </div>

        <div className="border-t border-gray-200 pt-6">
            <ToggleSwitch
                label="Enable Calert"
                enabled={isEnabled}
                onChange={setIsEnabled}
            />
            <p className="mt-2 text-sm text-gray-500">
                When enabled, Calert will show full-screen alerts for your events.
            </p>
        </div>

        <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
            <p className="mt-1 text-sm text-gray-500">The next alarm will be scheduled for the highlighted event.</p>
            {renderEventsList()}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <Header user={user} onLogout={onLogout} />
      <main className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
            <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-md space-y-8">
                {renderContent()}
            </div>
            
            <div className="mt-6 flex justify-end items-center">
                {saveStatus === 'saved' && (
                  <span className="text-green-600 font-medium mr-4 transition-opacity duration-300">Settings saved!</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600 font-medium mr-4">Save failed.</span>
                )}
                <button
                    onClick={handleSave}
                    disabled={!isDirty || saveStatus === 'saving' || isLoading || !!error || calendars.length === 0}
                    className="rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardScreen;