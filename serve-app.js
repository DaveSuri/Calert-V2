/**
 * Simple Node.js server to serve the built Calert application
 * Run with: node serve-app.js
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Calert is running at http://localhost:${PORT}`);
  console.log(`📱 Use this URL to test the application locally`);
  console.log(`🌐 The app is configured to use backend: https://calert-360373462324.us-west1.run.app`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open http://localhost:${PORT} in your browser`);
  console.log(`   2. Test Google OAuth login`);
  console.log(`   3. Verify calendar integration works`);
  console.log(`   4. If backend is down, you may need to deploy it separately`);
});