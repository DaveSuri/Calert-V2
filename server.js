
const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// --- API ROUTER ---
// This is placed before any static file handlers to ensure it gets first priority.
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


// --- STATIC FILE & SPA SERVING ---

// Serve built frontend from 'dist' directory (output of Vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Optionally expose additional static assets from 'public' if needed
app.use('/public', express.static(path.join(__dirname, 'public')));

// Catch-all to serve index.html from the built app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Calert server listening on port ${port}`);
});
