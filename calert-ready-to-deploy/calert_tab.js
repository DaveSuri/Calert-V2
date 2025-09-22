import { marked } from 'marked';
import { SERVER_BASE_URL, APP_TOKEN } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
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
    const briefingButtonText = document.getElementById('briefing-button-text');
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

    // Gemini Briefing Feature with Limits
    const BRIEFING_USAGE_KEY = 'calert_briefing_usage';
    const BRIEFING_LIMIT_FREE = 5;
    let usageData = { count: 0, month: new Date().getMonth() };
    let isPro = false;
    let briefingEntitlement = { canBrief: false, limitReached: false, remaining: 0 };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        const { user, [BRIEFING_USAGE_KEY]: storedUsage } = await chrome.storage.sync.get(['user', BRIEFING_USAGE_KEY]);

        if (user && (user.tier === 'pro' || user.tier === 'teams')) {
            isPro = true;
        }

        if (storedUsage) {
            // Reset count if we're in a new month
            if (storedUsage.month !== new Date().getMonth()) {
                usageData = { count: 0, month: new Date().getMonth() };
                await chrome.storage.sync.set({ [BRIEFING_USAGE_KEY]: usageData });
            } else {
                usageData = storedUsage;
            }
        }
    }

    if (isPro) {
        briefingEntitlement = { canBrief: true, limitReached: false, remaining: Infinity };
    } else {
        const remaining = BRIEFING_LIMIT_FREE - usageData.count;
        briefingEntitlement = {
            canBrief: remaining > 0,
            limitReached: remaining <= 0,
            remaining: Math.max(0, remaining),
        };
    }

    if (description && description.trim()) {
        briefingButton.classList.remove('hidden');

        if (briefingEntitlement.limitReached) {
            briefingButton.disabled = true;
            briefingButtonText.textContent = 'Limit Reached';
            briefingButton.title = 'You have used all 5 free briefings this month. Upgrade to Pro for unlimited access.';
        } else {
            briefingButton.addEventListener('click', handleGetBriefing);
            if (!isPro) {
                briefingButtonText.textContent = `Get Briefing (${briefingEntitlement.remaining} left)`;
            }
        }
    }

    async function handleGetBriefing() {
        if (!APP_TOKEN) {
            briefingContainer.classList.remove('hidden');
            briefingContainer.innerHTML = '<p style="color: #ffcdd2;">Backend auth is not configured. Please set an app token via <code>localStorage.setItem(\'calert_app_token\', \'YOUR_TOKEN\')</code> and set the same token on the server as <code>APP_TOKEN</code>.</p>';
            return;
        }
        if (briefingEntitlement.limitReached && !isPro) return;

        briefingButton.disabled = true;
        briefingContainer.classList.remove('hidden');
        briefingContainer.innerHTML = '<div class="loader"></div>';

        try {
            const apiResponse = await fetch(`${SERVER_BASE_URL}/api/briefing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Token': APP_TOKEN,
                },
                body: JSON.stringify({ title, description }),
            });

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                throw new Error(`Server responded with status: ${apiResponse.status}. ${errorText}`);
            }

            const briefingMarkdown = await apiResponse.text();
            briefingContainer.innerHTML = marked.parse(briefingMarkdown);
            
            // On success, increment usage count for free users
            if (!isPro) {
                usageData.count++;
                await chrome.storage.sync.set({ [BRIEFING_USAGE_KEY]: usageData });
            }

        } catch (error) {
            console.error('Error getting meeting briefing:', error);
            briefingContainer.innerHTML = `<p style="color: #ffcdd2;">Sorry, I couldn't generate a briefing for this meeting. Please try again later.</p>`;
            briefingButton.disabled = false; // Re-enable button on error
        }
    }
});