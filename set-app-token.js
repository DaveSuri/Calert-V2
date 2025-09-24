// Script to set the APP_TOKEN in localStorage for the Calert application
// This fixes the "Missing APP token" error

console.log('Setting APP_TOKEN in localStorage...');
localStorage.setItem('calert_app_token', 'calert-secure-token-2024');
console.log('✅ APP_TOKEN has been set successfully!');
console.log('You can now use the "Sync Today\'s Events" feature.');

// Verify it was set
const token = localStorage.getItem('calert_app_token');
if (token) {
    console.log('✅ Verification: APP_TOKEN is set to:', token);
} else {
    console.error('❌ Failed to set APP_TOKEN');
}