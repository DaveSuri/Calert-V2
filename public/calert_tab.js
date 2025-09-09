import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

// This file is executed in a browser environment, but the coding guidelines
// require using `process.env.API_KEY`. We will assume a build tool or environment
// substitutes this variable before deployment.
declare var process: {
  env: {
    API_KEY: string;
  }
};

document.addEventListener('DOMContentLoaded', () => {
    // Attempt to enter full-screen mode for an immersive experience.
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Could not enter full-screen mode: ${err.message}`);
        });
    }

    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    const startTimeStr = params.get('startTime');
    const endTimeStr = params.get('endTime');
    const hangoutLink = params.get('hangoutLink');
    const description = params.get('description');

    const eventTitleEl = document.getElementById('event-title');
    const eventTimeEl = document.getElementById('event-time');
    const joinButton = document.getElementById('join-button');
    const dismissButton = document.getElementById('dismiss-button');
    const briefingButton = document.getElementById('briefing-button');
    const briefingContainer = document.getElementById('briefing-container');

    eventTitleEl.textContent = title || 'Calendar Event';
    
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };
    
    if (startTimeStr && endTimeStr) {
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        eventTimeEl.textContent = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }

    if (hangoutLink) {
        joinButton.classList.remove('hidden');
        joinButton.addEventListener('click', () => {
            window.open(hangoutLink, '_blank');
            // Close this tab after opening the meeting link.
            chrome.tabs.getCurrent(tab => {
                if (tab && tab.id) chrome.tabs.remove(tab.id);
            });
        });
    }

    dismissButton.addEventListener('click', () => {
        // Use the chrome.tabs API to close the current tab.
        chrome.tabs.getCurrent(tab => {
            if (tab && tab.id) {
                chrome.tabs.remove(tab.id);
            } else {
                // Fallback for cases where the API might fail.
                window.close();
            }
        });
    });

    // Gemini Briefing Feature
    if (description && description.trim()) {
        briefingButton.classList.remove('hidden');
        briefingButton.addEventListener('click', handleGetBriefing);
    }

    async function handleGetBriefing() {
        briefingButton.disabled = true;
        briefingContainer.classList.remove('hidden');
        briefingContainer.innerHTML = '<div class="loader"></div>';

        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('Google API Key is not configured.');
            briefingContainer.innerHTML = `<p style="color: #ffcdd2;">The AI Briefing feature is not configured. An API key is required.</p>`;
            briefingButton.disabled = false;
            return;
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

            const briefingMarkdown = response.text;
            briefingContainer.innerHTML = marked.parse(briefingMarkdown);

        } catch (error) {
            console.error('Error getting meeting briefing:', error);
            briefingContainer.innerHTML = `<p style="color: #ffcdd2;">Sorry, I couldn't generate a briefing for this meeting. Please check your API key or try again later.</p>`;
            briefingButton.disabled = false; // Re-enable button on error
        }
    }
});