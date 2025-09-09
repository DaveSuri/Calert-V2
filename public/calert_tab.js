import { marked } from 'marked';

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

        try {
            const apiResponse = await fetch('/api/briefing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            });

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                throw new Error(`Server responded with status: ${apiResponse.status}. ${errorText}`);
            }

            const briefingMarkdown = await apiResponse.text();
            briefingContainer.innerHTML = marked.parse(briefingMarkdown);
            // On success, we can leave the button disabled as it's a one-shot action.

        } catch (error) {
            console.error('Error getting meeting briefing:', error);
            briefingContainer.innerHTML = `<p style="color: #ffcdd2;">Sorry, I couldn't generate a briefing for this meeting. Please try again later.</p>`;
            briefingButton.disabled = false; // Re-enable button on error
        }
    }
});