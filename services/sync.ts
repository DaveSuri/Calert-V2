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
  return null;
}

// When running in SPA context, use relative base ('') so Vite proxy or same-origin applies.
// In extension context you shouldn't import this file; the extension uses public/config.js.
// For production builds, we should always use the absolute URL.
const IS_DEVELOPMENT = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = IS_DEVELOPMENT ? '' : SERVER_BASE_URL;

export async function syncTodayEvents(accessToken: string, calendarId: string) {
  const appToken = getAppToken();
  if (!appToken) {
    throw new Error('Missing APP token: set localStorage.calert_app_token or process.env.APP_TOKEN');
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
