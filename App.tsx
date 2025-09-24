import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import PricingScreen from './components/PricingScreen';
import AccountScreen from './components/AccountScreen';
import OnboardingScreen from './components/OnboardingScreen';
import type { User, Settings } from './types';
import { setUnauthorizedHandler } from './services/http';

// This allows TypeScript to recognize the `google` global variable from the script
declare var google: any;

// Storage keys
const USER_STORAGE_KEY = 'calert_user';
const SETTINGS_STORAGE_KEY = 'calert_settings';
const ONBOARDING_COMPLETE_KEY = 'calert_onboarding_complete';

// --- Google OAuth Client IDs ---
// We need separate Client IDs for the web app and the Chrome Extension because
// they have different origins ('https://...' vs 'chrome-extension://...').
const GOOGLE_CLIENT_ID_WEB = '360373462324-nr5vpdjfd1g5i38j5h5c6l3g74d0lqd9.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_CHROME_EXTENSION = '360373462324-0fjqvtd35esaqi5v8ioschmbhshj0l4l.apps.googleusercontent.com';

// Detect the current environment to select the correct Client ID.
const IS_EXTENSION = window.location.protocol === 'chrome-extension:';
const GOOGLE_CLIENT_ID = IS_EXTENSION ? GOOGLE_CLIENT_ID_CHROME_EXTENSION : GOOGLE_CLIENT_ID_WEB;

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';


const App: React.FC = () => {
  // Initialize APP token early for development
  useEffect(() => {
    if (!localStorage.getItem('calert_app_token')) {
      localStorage.setItem('calert_app_token', 'calert-secure-token-2024');
      console.log('✅ APP_TOKEN initialized for development');
    }
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
     try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return storedSettings ? JSON.parse(storedSettings) : { selectedCalendarId: null, isEnabled: true };
    } catch {
      return { selectedCalendarId: null, isEnabled: true };
    }
  });
  
  const [view, setView] = useState<'dashboard' | 'pricing' | 'account'>('dashboard');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
  });


  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      // Also clear onboarding status on logout
      localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      setHasCompletedOnboarding(false);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Register a global unauthorized handler to trigger re-auth and allow a retry once
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      try {
        handleLogin();
      } catch (e) {
        console.warn('Failed to trigger re-auth automatically. Please click login again.');
      }
    });
  }, []);

  const handleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("Google Client ID is not configured.");
      alert("Authentication is not configured. Please contact support.");
      return;
    }
    
    if (typeof google === 'undefined' || !google.accounts) {
        alert("Google Authentication library is not loaded yet. Please try again in a moment.");
        return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          console.error('Google Authentication error:', tokenResponse);
          return;
        }

        try {
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${tokenResponse.access_token}`
            }
          });

          if (!userInfoResponse.ok) {
            throw new Error(`Failed to fetch user info. Status: ${userInfoResponse.status}`);
          }

          const userInfo = await userInfoResponse.json();

          const newUser: User = {
            name: userInfo.name,
            email: userInfo.email,
            avatarUrl: userInfo.picture,
            accessToken: tokenResponse.access_token,
            tier: 'free',
          };
          setUser(newUser);
          setView('dashboard');
        } catch (error) {
          console.error("Error fetching user data:", error);
          alert("Could not fetch your user information from Google. Please try again.");
        }
      },
    });
    
    client.requestAccessToken();
  };

  const handleLogout = () => {
    if (user && user.accessToken) {
        // Revoke the token to invalidate the user's session with the app
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.oauth2.revoke(user.accessToken, () => {
                console.log('User token revoked.');
            });
        }
    }
    setUser(null);
  };

  const handleSettingsSave = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const handleOnboardingComplete = (initialSettings: Settings) => {
    setSettings(initialSettings);
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setHasCompletedOnboarding(true);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen user={user} onOnboardingComplete={handleOnboardingComplete} />;
  }

  if (view === 'pricing') {
    return <PricingScreen user={user} onBack={() => setView('dashboard')} />;
  }

  if (view === 'account') {
    return <AccountScreen user={user} onBack={() => setView('dashboard')} />;
  }

  return <DashboardScreen 
            user={user} 
            onLogout={handleLogout} 
            savedSettings={settings} 
            onSettingsSave={handleSettingsSave} 
            onNavigateToPricing={() => setView('pricing')}
            onNavigateToAccount={() => setView('account')} 
        />;
};

export default App;