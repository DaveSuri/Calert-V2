import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import type { User, Settings } from './types';

// This allows TypeScript to recognize the `google` global variable from the script
declare var google: any;

// Storage keys
const USER_STORAGE_KEY = 'calert_user';
const SETTINGS_STORAGE_KEY = 'calert_settings';

// This is the public client ID for the Calert application.
const GOOGLE_CLIENT_ID = '360373462324-nr5vpdjfd1g5i38j5h5c6l3g74d0lqd9.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';


const App: React.FC = () => {
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

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

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
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const handleSettingsSave = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <DashboardScreen user={user} onLogout={handleLogout} savedSettings={settings} onSettingsSave={handleSettingsSave} />;
};

export default App;