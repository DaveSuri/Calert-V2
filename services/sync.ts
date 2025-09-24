import { UnauthorizedError, apiFetch } from './http';
import { SERVER_BASE_URL } from '../config';

// For SPA usage: read app token from localStorage or env (defined via Vite)
function getAppToken(): string | null {
  try {
    const ls = localStorage.getItem('calert_app_token');
    if (ls && ls.trim()) return ls.trim();
  } catch {}
  // @ts-ignore
  const fromEnv = typeof process !== 'undefined' ? (process.env.APP_TOKEN as string | undefined) : undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  
  // Auto-set the token if it's missing (for development/testing)
  const defaultToken = 'calert-secure-token-2024';
  try {
    localStorage.setItem('calert_app_token', defaultToken);
    console.log('✅ Auto-set APP_TOKEN for development');
    return defaultToken;
  } catch {
    // If localStorage fails (like in some production environments), return the default token anyway
    console.log('⚠️ localStorage unavailable, using default APP_TOKEN');
    return defaultToken;
  }
}

// When running in SPA context, use relative base ('') so Vite proxy or same-origin applies.
// In extension context you shouldn't import this file; the extension uses public/config.js.
// For production builds, we should always use the absolute URL to the 'calert' service.
const IS_DEVELOPMENT = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = IS_DEVELOPMENT ? '' : SERVER_BASE_URL;

export async function syncTodayEvents(accessToken: string, calendarId: string) {
  const appToken = getAppToken();
  if (!appToken) {
    throw new Error('Failed to configure APP token. Please refresh the page and try again.');
  }
  const res = await apiFetch(`${API_BASE}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-App-Token': appToken,
    },
    body: JSON.stringify({ calendarId }),
    expectJson: true,
  });
  return res as unknown as { ok: boolean; count: number; day: string };
}
