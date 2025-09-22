// --- Calert Configuration ---

// For local development, this should point to your local server.
// The default is http://localhost:8080, which matches the port in server.js.
//
// IMPORTANT: After deploying your server (e.g., to Cloud Run), you MUST
// replace the URL below with your actual server's public URL.
// Without this, the Chrome Extension will not be able to communicate
// with the backend and features like fetching calendars or getting
// AI briefings will fail.
//
// Example of a valid production URL: 'https://calert-service-abcdef-uc.a.run.app'

// This module computes SERVER_BASE_URL in a flexible way so you can switch
// between production and local development without editing source code.
// Precedence (highest to lowest):
// 1) URL query param:  ?server=https://your-server
// 2) localStorage key: calert_server_base_url
// 3) Global: self.CALERT_SERVER_BASE_URL (can be injected by build tooling)
// 4) If running on localhost, default to http://localhost:8080
// 5) Fallback to the production URL below

const DEFAULT_PROD_URL = 'https://calert-360373462324.us-west1.run.app';
const DEFAULT_DEV_URL = 'http://localhost:8080';

function readFromQueryString() {
  try {
    const url = new URL(self.location.href);
    const qs = url.searchParams.get('server');
    return qs && qs.trim() ? qs.trim() : null;
  } catch (_) {
    return null;
  }
}

function readFromLocalStorage() {
  try {
    const v = self.localStorage?.getItem('calert_server_base_url');
    return v && v.trim() ? v.trim() : null;
  } catch (_) {
    return null;
  }
}

function readFromGlobal() {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore allow access in plain JS context
    const v = self.CALERT_SERVER_BASE_URL;
    return v && typeof v === 'string' && v.trim() ? v.trim() : null;
  } catch (_) {
    return null;
  }
}

function isLocalhost() {
  try {
    return ['localhost', '127.0.0.1'].includes(self.location.hostname);
  } catch (_) {
    return false;
  }
}

function computeServerBaseUrl() {
  const fromQuery = readFromQueryString();
  if (fromQuery) return fromQuery;
  const fromLS = readFromLocalStorage();
  if (fromLS) return fromLS;
  const fromGlobal = readFromGlobal();
  if (fromGlobal) return fromGlobal;
  if (isLocalhost()) return DEFAULT_DEV_URL;
  return DEFAULT_PROD_URL;
}

export const SERVER_BASE_URL = computeServerBaseUrl();

// Shared secret for simple auth to the backend. For development, set via:
// localStorage.setItem('calert_app_token', 'your-token')
// or define self.CALERT_APP_TOKEN globally before this script.
function computeAppToken() {
  try {
    // @ts-ignore
    if (typeof self.CALERT_APP_TOKEN === 'string' && self.CALERT_APP_TOKEN.trim()) {
      // @ts-ignore
      return self.CALERT_APP_TOKEN.trim();
    }
  } catch (_) {}
  try {
    const v = self.localStorage?.getItem('calert_app_token');
    return v && v.trim() ? v.trim() : '';
  } catch (_) {
    return '';
  }
}

export const APP_TOKEN = computeAppToken();

// Optional helper to set at runtime from DevTools:
// localStorage.setItem('calert_server_base_url', 'http://localhost:8080');
// Then reload the extension page.