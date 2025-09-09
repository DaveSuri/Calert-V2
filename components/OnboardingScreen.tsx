import React, { useState, useEffect, useCallback } from 'react';
import type { User, Calendar, Settings } from '../types';
import Spinner from './Spinner';
import { fetchCalendars } from '../services/googleCalendarApi';

interface OnboardingScreenProps {
  user: User;
  onOnboardingComplete: (initialSettings: Settings) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ user, onOnboardingComplete }) => {
  const [step, setStep] = useState(1);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  const loadCalendars = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedCalendars = await fetchCalendars(user.accessToken);
      setCalendars(fetchedCalendars);
      const primaryCalendar = fetchedCalendars.find(c => c.primary) || fetchedCalendars[0];
      if (primaryCalendar) {
        setSelectedCalendarId(primaryCalendar.id);
      }
    } catch (err) {
      setError('Failed to fetch calendars. Please try reloading the page.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user.accessToken]);

  useEffect(() => {
    if (step === 2) {
      loadCalendars();
    }
  }, [step, loadCalendars]);

  const handleFinish = () => {
    if (!selectedCalendarId) {
        alert("Please select a calendar to continue.");
        return;
    }
    const initialSettings: Settings = {
        selectedCalendarId,
        isEnabled: true, // Enable by default for new users
    };
    onOnboardingComplete(initialSettings);
  };
  
  const selectedCalendarName = calendars.find(c => c.id === selectedCalendarId)?.summary || '';

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h1 className="text-4xl font-bold text-gray-800">Welcome to Calert, {user.name.split(' ')[0]}!</h1>
            <p className="mt-4 text-lg text-gray-600">Let's get you set up to never miss a meeting again.</p>
            <button
              onClick={() => setStep(2)}
              className="mt-8 rounded-lg bg-brand-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105"
            >
              Let's Get Started
            </button>
          </>
        );
      case 2:
        return (
          <>
            <h1 className="text-3xl font-bold text-gray-800">Select Your Primary Calendar</h1>
            <p className="mt-2 text-md text-gray-600">Calert will monitor this calendar for upcoming events.</p>
            {isLoading && <div className="py-8"><Spinner className="w-10 h-10" /></div>}
            {error && <p className="mt-4 text-red-600">{error}</p>}
            {!isLoading && !error && (
              <div className="mt-6 w-full max-w-md text-left space-y-3">
                {calendars.map(calendar => (
                  <label key={calendar.id} className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-brand-primary">
                    <input
                      type="radio"
                      name="calendar"
                      value={calendar.id}
                      checked={selectedCalendarId === calendar.id}
                      onChange={() => setSelectedCalendarId(calendar.id)}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-secondary"
                    />
                    <span className="ml-3 font-medium text-gray-800">{calendar.summary}</span>
                    {calendar.primary && <span className="ml-auto text-xs font-bold text-brand-primary bg-indigo-100 px-2 py-1 rounded-full">Primary</span>}
                  </label>
                ))}
              </div>
            )}
            <button
              onClick={() => setStep(3)}
              disabled={isLoading || !selectedCalendarId}
              className="mt-8 rounded-lg bg-brand-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </>
        );
        case 3:
            return (
                <>
                    <h1 className="text-3xl font-bold text-gray-800">How It Works</h1>
                    <div className="mt-6 p-6 bg-indigo-50 rounded-xl border border-brand-secondary max-w-lg">
                        <div className="flex items-center justify-center">
                            <svg className="w-12 h-12 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h9.75a2.25 2.25 0 012.25 2.25z" />
                            </svg>
                            <p className="ml-4 text-lg text-gray-700 font-medium">
                                When an event starts, Calert opens a new, <strong>full-screen tab</strong> to grab your attention. It's that simple.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStep(4)}
                        className="mt-8 rounded-lg bg-brand-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105"
                    >
                        Got It!
                    </button>
                </>
            );
      case 4:
        return (
          <>
            <div className="mb-4">
                <svg className="w-20 h-20 text-green-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">You're All Set!</h1>
            <p className="mt-4 text-lg text-gray-600">
              Calert is now monitoring your <strong className="text-brand-dark">{selectedCalendarName}</strong> calendar.
            </p>
            <button
              onClick={handleFinish}
              className="mt-8 rounded-lg bg-brand-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105"
            >
              Go to Dashboard
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="w-full max-w-2xl text-center flex flex-col items-center">
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingScreen;
