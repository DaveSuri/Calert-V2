// Chrome Extension Debug Script
// Run this in the browser console on the extension settings page

console.log('=== Calert Extension Debug ===');

// 1. Check current storage
chrome.storage.sync.get(['settings'], (result) => {
    console.log('Current settings:', result.settings);
});

// 2. Test auth token
chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (token) {
        console.log('✅ Auth token available:', token.substring(0, 20) + '...');
    } else {
        console.log('❌ No auth token available');
    }
});

// 3. Check alarms
chrome.alarms.getAll((alarms) => {
    console.log('Current alarms:', alarms);
});

// 4. Test manual settings (uncomment to use)
/*
const testSettings = {
    isEnabled: true,
    selectedCalendarId: 'primary' // or your specific calendar ID
};

chrome.storage.sync.set({ settings: testSettings }, () => {
    console.log('✅ Test settings saved');
    chrome.runtime.sendMessage({ type: 'calert-reschedule' });
});
*/

console.log('=== Debug script complete ===');
console.log('Open the extension popup to see if status changed to "Monitoring active"');