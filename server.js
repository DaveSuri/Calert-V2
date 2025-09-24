
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');
const { db } = require('./server/firebaseAdmin');

const app = express();
const port = process.env.PORT || 8080;

// --- MIDDLEWARE ---
// Enable CORS for SPA dev origins and Chrome Extension
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow Chrome Extension origins (chrome-extension:// protocol)
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    // Allow your specific Netlify domain
    if (origin === 'https://luxury-begonia-e85c75.netlify.app') {
      return callback(null, true);
    }

    // Allow Netlify domains (*.netlify.app)
    if (origin.endsWith('.netlify.app') || origin.endsWith('.netlify.com')) {
      return callback(null, true);
    }

    // Allow Vercel domains (*.vercel.app)
    if (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.com')) {
      return callback(null, true);
    }

    // Allow specific production domains via env var ALLOWED_ORIGINS (comma-separated)
    const allowed = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (allowed.length && allowed.includes(origin)) {
      return callback(null, true);
    }

    // Reject other origins
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Token']
}));

// Request size limits and JSON parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Rate limiting for AI briefing endpoint
const briefingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many briefing requests',
    details: 'You have exceeded the rate limit of 100 requests per 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for Chrome Extension requests (they come from chrome-extension://)
    return req.headers.origin && req.headers.origin.startsWith('chrome-extension://');
  }
});

// Apply rate limiting to briefing endpoint only
app.use('/api/briefing', briefingLimiter);

// --- API ROUTER ---
// This is placed before any static file handlers to ensure it gets first priority.
const apiRouter = express.Router();

// Firestore-backed sync endpoint: store up to 24 events per user per day
apiRouter.post('/sync', async (req, res) => {
  // Shared secret check
  const providedToken = req.get('X-App-Token') || '';
  const expectedToken = process.env.APP_TOKEN || '';
  if (!expectedToken || providedToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const authHeader = req.headers.authorization;
  const { calendarId } = req.body || {};
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed.' });
  }
  if (!calendarId || typeof calendarId !== 'string') {
    return res.status(400).json({ error: 'calendarId is required' });
  }

  const accessToken = authHeader.split(' ')[1];
  try {
    // Get user identity (email) from Google to key Firestore writes
    const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoResp.ok) {
      const msg = await userInfoResp.text();
      return res.status(401).json({ error: 'Unauthorized', details: msg });
    }
    const userInfo = await userInfoResp.json();
    const userEmail = userInfo.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'Could not resolve user email from token' });
    }

    // Firestore document path: users/{email}/eventSync/{YYYY-MM-DD}
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(today.getUTCDate()).padStart(2, '0');
    const dayKey = `${yyyy}-${mm}-${dd}`;
    const docRef = db.collection('users').doc(userEmail).collection('eventSync').doc(dayKey);

    const existingSnap = await docRef.get();
    if (existingSnap.exists) {
      const data = existingSnap.data() || {};
      const events = Array.isArray(data.events) ? data.events : [];
      if (events.length >= 24) {
        return res.status(429).json({ error: 'Daily sync limit reached', limit: 24 });
      }
    }

    // Fetch up to 24 upcoming events from Google Calendar
    const timeMin = new Date().toISOString();
    const encodedCalendarId = encodeURIComponent(calendarId);
    const googleApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?timeMin=${timeMin}&maxResults=24&singleEvents=true&orderBy=startTime`;
    const eventsResp = await fetch(googleApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!eventsResp.ok) {
      const errorBody = await eventsResp.text();
      return res.status(eventsResp.status).send(errorBody);
    }
    const eventsJson = await eventsResp.json();
    const items = Array.isArray(eventsJson.items) ? eventsJson.items : [];

    // Normalize and filter to non all-day events, cap to 24
    const normalized = items
      .filter((ev) => ev?.start?.dateTime)
      .slice(0, 24)
      .map((ev) => ({
        id: ev.id,
        summary: ev.summary || 'No Title',
        start: ev.start.dateTime,
        end: ev.end?.dateTime || ev.start.dateTime,
      }));

    // Merge with existing (but cap at 24)
    let toWrite = normalized;
    if (existingSnap.exists) {
      const existing = existingSnap.data() || {};
      const existingEvents = Array.isArray(existing.events) ? existing.events : [];
      const combined = [...existingEvents, ...normalized];
      // De-duplicate by id
      const seen = new Set();
      toWrite = combined.filter((e) => {
        if (!e?.id || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      }).slice(0, 24);
    }

    await docRef.set(
      {
        calendarId,
        updatedAt: new Date().toISOString(),
        events: toWrite,
      },
      { merge: true }
    );

    return res.json({ ok: true, count: toWrite.length, day: dayKey });
  } catch (e) {
    console.error('SYNC ERROR', e);
    return res.status(500).json({ error: 'Failed to sync events' });
  }
});

// API endpoint for generating briefings
apiRouter.post('/briefing', async (req, res) => {
  // Simple shared-secret auth for extension/SPA
  const providedToken = req.get('X-App-Token') || '';
  const expectedToken = process.env.APP_TOKEN || '';
  if (!expectedToken || providedToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { title, description } = req.body;

  // Enhanced payload validation
  if (!title || !description) {
    return res.status(400).json({
      error: 'Title and description are required',
      details: 'Both title and description must be non-empty strings'
    });
  }

  if (typeof title !== 'string' || typeof description !== 'string') {
    return res.status(400).json({
      error: 'Invalid data types',
      details: 'Title and description must be strings'
    });
  }

  if (title.length > 200 || description.length > 5000) {
    return res.status(400).json({
      error: 'Input too large',
      details: 'Title must be ≤200 characters, description must be ≤5000 characters'
    });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY environment variable not set.');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'API_KEY is missing from environment'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a helpful meeting assistant. Your goal is to provide a concise, clear, and actionable briefing for an upcoming calendar event.
Based on the event title and description provided below, generate a briefing in Markdown format.

The briefing should include the following sections:
- A one-sentence **Summary** of the meeting's purpose.
- **Key Topics** to be discussed, presented as a bulleted list.
- **Action Items / Talking Points** suggesting what the user might need to prepare or discuss, also as a bulleted list.

**Event Title:** ${title}

**Event Description:**
${description}

Provide only the Markdown content for the briefing, with each section having a heading (e.g., ### Summary).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const outputText = response.output_text || response.text || '';
    res.setHeader('Content-Type', 'text/plain');
    res.send(outputText);

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).send('Failed to generate briefing.');
  }
});

// Proxy endpoint for fetching Google Calendars
apiRouter.get('/calendars', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Authorization header missing or malformed.');
  }
  const accessToken = authHeader.split(' ')[1];

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[PROXY ERROR] Google API '/calendarList' responded with status ${response.status}:`, errorBody);
      return res.status(response.status).send(errorBody);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("[PROXY ERROR] Failed to fetch from Google API '/calendarList':", error);
    res.status(500).send('Failed to fetch calendars from Google.');
  }
});

// Proxy endpoint for fetching Google Calendar events
apiRouter.get('/events', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { calendarId } = req.query;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Authorization header missing or malformed.');
  }
  if (!calendarId) {
    return res.status(400).send('calendarId query parameter is required.');
  }
  
  const accessToken = authHeader.split(' ')[1];
  const timeMin = new Date().toISOString();
  const encodedCalendarId = encodeURIComponent(calendarId);
  const googleApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?timeMin=${timeMin}&maxResults=5&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(googleApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[PROXY ERROR] Google API '/events' responded with status ${response.status}:`, errorBody);
      return res.status(response.status).send(errorBody);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("[PROXY ERROR] Failed to fetch from Google API '/events':", error);
    res.status(500).send('Failed to fetch events from Google.');
  }
});

app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});


// --- STATIC FILE & SPA SERVING ---

// Serve built frontend from 'dist' directory (output of Vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Optionally expose additional static assets from 'public' if needed
app.use('/public', express.static(path.join(__dirname, 'public')));

// Catch-all to serve index.html from the built app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Export app for tests; only start server when run directly
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Calert server listening on port ${port}`);
  });
}

module.exports = app;
