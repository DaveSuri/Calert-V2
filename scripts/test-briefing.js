#!/usr/bin/env node
/*
 Minimal smoke test for /api/briefing
 Usage:
   API_KEY=YOUR_GEMINI_API_KEY node scripts/test-briefing.js [serverBaseUrl]
 Defaults to http://localhost:8080
*/

const http = require('http');
const https = require('https');

const serverBase = process.argv[2] || 'http://localhost:8080';
const url = new URL('/api/briefing', serverBase);

const payload = {
  title: 'Weekly Sync: Project Calert',
  description: 'Discuss progress, blockers, and next steps for Calert. Participants: Alice, Bob.'
};

const data = JSON.stringify(payload);
const lib = url.protocol === 'https:' ? https : http;

const req = lib.request(
  {
    method: 'POST',
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log('--- Response start ---');
      console.log(body);
      console.log('--- Response end ---');
      if (res.statusCode !== 200) process.exit(1);
    });
  }
);

req.on('error', (err) => {
  console.error('Request error:', err);
  process.exit(1);
});

req.write(data);
req.end();
