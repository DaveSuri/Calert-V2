
const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// --- API ROUTER ---
// Create a dedicated router for all API endpoints.
const apiRouter = express.Router();

// API endpoint for generating briefings
apiRouter.post('/briefing', async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send('Title and description are required.');
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY environment variable not set.');
    return res.status(500).send('Server configuration error: API_KEY is missing.');
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
      contents: prompt,
    });
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(response.text);

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

// Mount the API router. All requests starting with /api will be handled by it.
// This is placed before static file serving to ensure it takes priority.
app.use('/api', apiRouter);


// --- STATIC FILE & SPA SERVING ---

// Serve all static files from the project's root directory.
// This allows the browser to fetch /index.tsx, /components/..., etc.
// Note: This is simpler and more robust than defining individual routes for each file/folder.
// For security in a real production app with a build step, you'd serve from a 'dist' or 'build' folder.
// Given the current no-build-step setup, we serve the source files directly.
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));


// All GET requests not handled by the API router or static file server should
// serve the main React application's entry point. This is the catch-all for the SPA.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(port, () => {
  console.log(`Calert server listening on port ${port}`);
});
