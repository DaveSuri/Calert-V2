<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gSe4ywM0Lz8AfJnH73thIa9PrXC0HxjJ

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Environment variables (standardized)

This project uses two env vars for different runtimes:

- `API_KEY` — Server-side Gemini API key used by `server.js` at runtime.
  - Set this in your production environment (Cloud Run, Docker, etc.) or local shell when starting the server.
  - Example (local):
    ```bash
    API_KEY=YOUR_GEMINI_API_KEY node server.js
    ```
- `GEMINI_API_KEY` — Frontend build-time key available to Vite-bundled client code.
  - Put this in `.env.local` for SPA development with Vite.
  - Note: `server.js` does NOT read this; the server only reads `API_KEY`.

A sample file is provided at [`.env.example`](.env.example). Copy it to `.env.local` for local SPA dev:

```bash
cp .env.example .env.local
# Edit GEMINI_API_KEY=
```

## Development Workflows

There are two main ways to develop Calert locally:

### 1. SPA-Only Development (Recommended for UI work)

Start only the Vite dev server. API calls will be proxied to your Express server.

```bash
# Terminal 1: Start Vite dev server
npm run dev
# Opens http://localhost:5173 with hot reload
```

The Vite proxy automatically forwards `/api/*` requests to `http://localhost:8080`. You don't need to run the Express server separately for UI development.

### 2. Full-Stack Development (For testing production-like behavior)

Run both the Express server and Vite dev server for full end-to-end testing.

```bash
# Terminal 1: Build frontend and start Express server
npm run build
API_KEY=YOUR_GEMINI_API_KEY node server.js
# Server runs on http://localhost:8080

# Terminal 2: Start Vite dev server
npm run dev
# Opens http://localhost:5173 with hot reload
```

This setup serves the production build of the SPA from the Express server, which is closer to how it will run in production.

### Chrome Extension Development

For Chrome Extension development:

1. Build the extension: `npm run build`
2. Load unpacked extension from the `dist/` directory in Chrome
3. Configure `SERVER_BASE_URL` in `public/config.js`:
   - For local dev: Set `localStorage.setItem('calert_server_base_url', 'http://localhost:8080')` in DevTools
   - For production: Use the default production URL or set the global variable

### Tips

- Use SPA-Only mode for most development (faster iteration)
- Use Full-Stack mode when testing API integration or production behavior
- The Vite proxy handles CORS automatically during development
- Make sure your Express server is running on port 8080 for the proxy to work

## SERVER_BASE_URL configuration (Chrome Extension)

The extension reads its backend base URL from `public/config.js`. It is now flexible and supports multiple overrides in this order:

1. Query string: `?server=https://your-server`
2. `localStorage` key: `calert_server_base_url`
3. Global variable: `self.CALERT_SERVER_BASE_URL`
4. If running on `localhost`, defaults to `http://localhost:8080`
5. Fallback to the production URL defined in the file

This means you can switch between local and production servers without editing source code. For example, in DevTools Console on the extension page:

```js
localStorage.setItem('calert_server_base_url', 'http://localhost:8080');
location.reload();
```

The SPA itself uses relative URLs for API calls when running in the browser, so it will talk to whichever origin serves it (recommended to use a Vite dev proxy pointing `/api` to `http://localhost:8080`).

## Deploying

- Server (Cloud Run/Docker): set `API_KEY` in the runtime environment.
- SPA (Vercel or static hosting): build with `npm run build`. The SPA does not need `API_KEY` at build time.
- Chrome Extension: build with `npm run build` and load the `dist/` directory as an unpacked extension.

## OAuth configuration checklist

Ensure your Google Cloud Console settings match the app:

- Authorized JavaScript origins (Web client): include `http://localhost:5173` and your production domain.
- Chrome Extension client (`chrome.identity`): make sure the OAuth client is configured for the extension and that `calendar.readonly` scope is approved.
- App scopes (`App.tsx`): `SCOPES` include `calendar.readonly`, `userinfo.profile`, and `userinfo.email` which must be reflected in your Consent Screen configuration.

## Security & server hardening

- CORS is enabled in `server.js` to allow localhost dev origins and `chrome-extension://`.
- Request size limits are enforced (`1mb`) and `/api/briefing` payload is validated (types and length).
- Basic rate limiting is applied to `/api/briefing` (100 req / 15 min per IP), skipping Chrome Extension origin.
- Additional security headers are set in `vercel.json` (Referrer-Policy, Permissions-Policy, etc.).

## Release, packaging, and CI

- Package the Chrome Extension zip from `dist/`:
  ```bash
  npm run package-extension
  ```
- GitHub Actions CI at `.github/workflows/ci.yml` runs typecheck, lint, build, and uploads the extension artifact.
